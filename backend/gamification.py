from models import db
from datetime import datetime, timedelta

class GamificationEngine:
    POINTS = {
        'lesson_complete': 10,
        'quiz_pass': 20,
        'quiz_perfect': 50,
        'daily_login': 5,
        'streak_bonus': 10,
        'first_course': 25,
        'chatbot_interaction': 2
    }
    
    BADGES = {
        'beginner': {'points': 0, 'name_en': 'Beginner', 'name_sw': 'Mwanzo', 'icon': '🌱'},
        'learner': {'points': 100, 'name_en': 'Learner', 'name_sw': 'Mwanafunzi', 'icon': '📚'},
        'scholar': {'points': 500, 'name_en': 'Scholar', 'name_sw': 'Msomi', 'icon': '🎓'},
        'expert': {'points': 1000, 'name_en': 'Expert', 'name_sw': 'Mtaalamu', 'icon': '⭐'},
        'master': {'points': 2500, 'name_en': 'Master', 'name_sw': 'Bingwa', 'icon': '👑'},
        'quiz_master': {'quizzes': 10, 'name_en': 'Quiz Master', 'name_sw': 'Bingwa wa Majaribio', 'icon': '🏆'},
        'speed_learner': {'lessons_per_day': 5, 'name_en': 'Speed Learner', 'name_sw': 'Mwanafunzi wa Kasi', 'icon': '⚡'},
        'persistent': {'streak_days': 7, 'name_en': 'Persistent', 'name_sw': 'Mshikamano', 'icon': '🔥'},
        'dedicated': {'streak_days': 30, 'name_en': 'Dedicated', 'name_sw': 'Mwenye Kujitolea', 'icon': '💪'}
    }
    
    @staticmethod
    def award_points(user, action, amount=None):
        from models import UserPoints
        
        points = amount or GamificationEngine.POINTS.get(action, 0)
        
        user_points = UserPoints.query.filter_by(user_id=user.id).first()
        if not user_points:
            user_points = UserPoints(user_id=user.id, total_points=0)
            db.session.add(user_points)
        
        user_points.total_points += points
        user_points.last_activity = datetime.utcnow()
        
        db.session.commit()
        
        GamificationEngine.check_badges(user)
        
        return points
    
    @staticmethod
    def check_badges(user):
        from models import UserPoints, UserBadge, QuizAttempt, Progress
        
        user_points = UserPoints.query.filter_by(user_id=user.id).first()
        if not user_points:
            return
        
        total_points = user_points.total_points
        
        for badge_id, badge_info in GamificationEngine.BADGES.items():
            existing = UserBadge.query.filter_by(user_id=user.id, badge_id=badge_id).first()
            if existing:
                continue
            
            earned = False
            
            if 'points' in badge_info and total_points >= badge_info['points']:
                earned = True
            
            if 'quizzes' in badge_info:
                quiz_count = QuizAttempt.query.filter_by(user_id=user.id).count()
                if quiz_count >= badge_info['quizzes']:
                    earned = True
            
            if 'streak_days' in badge_info:
                if user_points.current_streak >= badge_info['streak_days']:
                    earned = True
            
            if earned:
                new_badge = UserBadge(
                    user_id=user.id,
                    badge_id=badge_id,
                    earned_at=datetime.utcnow()
                )
                db.session.add(new_badge)
        
        db.session.commit()
    
    @staticmethod
    def update_streak(user):
        from models import UserPoints
        
        user_points = UserPoints.query.filter_by(user_id=user.id).first()
        if not user_points:
            user_points = UserPoints(user_id=user.id, total_points=0)
            db.session.add(user_points)
        
        now = datetime.utcnow()
        last_activity = user_points.last_activity
        
        if last_activity:
            days_diff = (now.date() - last_activity.date()).days
            
            if days_diff == 1:
                user_points.current_streak += 1
                user_points.longest_streak = max(user_points.longest_streak, user_points.current_streak)
                GamificationEngine.award_points(user, 'streak_bonus')
            elif days_diff > 1:
                user_points.current_streak = 1
            
        else:
            user_points.current_streak = 1
        
        user_points.last_activity = now
        db.session.commit()
    
    @staticmethod
    def get_leaderboard(limit=10, timeframe='all'):
        from models import UserPoints, User
        
        query = db.session.query(
            User.username,
            UserPoints.total_points,
            UserPoints.current_streak
        ).join(UserPoints, User.id == UserPoints.user_id)
        
        if timeframe == 'week':
            week_ago = datetime.utcnow() - timedelta(days=7)
            query = query.filter(UserPoints.last_activity >= week_ago)
        elif timeframe == 'month':
            month_ago = datetime.utcnow() - timedelta(days=30)
            query = query.filter(UserPoints.last_activity >= month_ago)
        
        leaderboard = query.order_by(UserPoints.total_points.desc()).limit(limit).all()
        
        return [
            {
                'username': username,
                'points': points,
                'streak': streak,
                'rank': idx + 1
            }
            for idx, (username, points, streak) in enumerate(leaderboard)
        ]
    
    @staticmethod
    def get_user_stats(user):
        from models import UserPoints, UserBadge, QuizAttempt, Progress
        
        user_points = UserPoints.query.filter_by(user_id=user.id).first()
        badges = UserBadge.query.filter_by(user_id=user.id).all()
        quiz_count = QuizAttempt.query.filter_by(user_id=user.id).count()
        completed_lessons = Progress.query.filter_by(user_id=user.id, completed=True).count()
        
        return {
            'total_points': user_points.total_points if user_points else 0,
            'current_streak': user_points.current_streak if user_points else 0,
            'longest_streak': user_points.longest_streak if user_points else 0,
            'badges_earned': len(badges),
            'total_badges': len(GamificationEngine.BADGES),
            'quizzes_completed': quiz_count,
            'lessons_completed': completed_lessons,
            'level': GamificationEngine.calculate_level(user_points.total_points if user_points else 0)
        }
    
    @staticmethod
    def calculate_level(points):
        if points < 100:
            return 1
        elif points < 500:
            return 2
        elif points < 1000:
            return 3
        elif points < 2500:
            return 4
        elif points < 5000:
            return 5
        else:
            return 6 + (points - 5000) // 1000
