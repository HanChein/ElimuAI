from flask import Flask, request, jsonify, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from datetime import datetime, timedelta
from models import db, User, Course, Lesson, Quiz, Question, QuizAttempt, Progress, Payment
from config import Config
from chatbot import SimpleChatbot
from mpesa import MPesaAPI
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder='../frontend/static', static_url_path='')
app.config.from_object(Config)

db.init_app(app)
CORS(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

chatbot = SimpleChatbot()

mpesa_api = MPesaAPI(
    consumer_key=app.config['MPESA_CONSUMER_KEY'],
    consumer_secret=app.config['MPESA_CONSUMER_SECRET'],
    shortcode=app.config['MPESA_SHORTCODE'],
    passkey=app.config['MPESA_PASSKEY'],
    callback_url=app.config['MPESA_CALLBACK_URL'],
    api_url=app.config['MPESA_API_URL']
)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return send_from_directory('../frontend/static', 'index.html')

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            phone_number=data.get('phone_number', ''),
            preferred_language=data.get('preferred_language', 'sw')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.check_password(data['password']):
            login_user(user, remember=data.get('remember', False))
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/api/user/profile', methods=['GET'])
@login_required
def get_profile():
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    try:
        data = request.get_json()
        
        if 'preferred_language' in data:
            current_user.preferred_language = data['preferred_language']
        
        if 'phone_number' in data:
            current_user.phone_number = data['phone_number']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated',
            'user': current_user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        language = request.args.get('language', 'en')
        category = request.args.get('category')
        
        query = Course.query
        
        if category:
            query = query.filter_by(category=category)
        
        courses = query.all()
        
        return jsonify({
            'success': True,
            'courses': [course.to_dict(language) for course in courses]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    try:
        language = request.args.get('language', 'en')
        course = Course.query.get_or_404(course_id)
        
        course_data = course.to_dict(language)
        course_data['lessons'] = [lesson.to_dict(language) for lesson in course.lessons]
        course_data['quizzes'] = [quiz.to_dict(language) for quiz in course.quizzes]
        
        return jsonify({
            'success': True,
            'course': course_data
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    try:
        language = request.args.get('language', 'en')
        lesson = Lesson.query.get_or_404(lesson_id)
        
        if current_user.is_authenticated:
            progress = Progress.query.filter_by(
                user_id=current_user.id,
                lesson_id=lesson_id
            ).first()
            
            if not progress:
                progress = Progress(
                    user_id=current_user.id,
                    course_id=lesson.course_id,
                    lesson_id=lesson_id
                )
                db.session.add(progress)
            
            progress.last_accessed = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'lesson': lesson.to_dict(language)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/lessons/<int:lesson_id>/complete', methods=['POST'])
@login_required
def complete_lesson(lesson_id):
    try:
        lesson = Lesson.query.get_or_404(lesson_id)
        
        progress = Progress.query.filter_by(
            user_id=current_user.id,
            lesson_id=lesson_id
        ).first()
        
        if not progress:
            progress = Progress(
                user_id=current_user.id,
                course_id=lesson.course_id,
                lesson_id=lesson_id
            )
            db.session.add(progress)
        
        progress.completed = True
        progress.last_accessed = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Lesson marked as complete'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    try:
        language = request.args.get('language', 'en')
        quiz = Quiz.query.get_or_404(quiz_id)
        
        quiz_data = quiz.to_dict(language)
        quiz_data['questions'] = [q.to_dict(language, include_answer=False) for q in quiz.questions]
        
        return jsonify({
            'success': True,
            'quiz': quiz_data
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@login_required
def submit_quiz(quiz_id):
    try:
        data = request.get_json()
        answers = data.get('answers', {})
        language = data.get('language', 'en')
        
        quiz = Quiz.query.get_or_404(quiz_id)
        questions = quiz.questions
        
        score = 0
        results = []
        
        for question in questions:
            user_answer = answers.get(str(question.id))
            is_correct = user_answer == question.correct_answer
            
            if is_correct:
                score += 1
            
            results.append({
                'question_id': question.id,
                'question': question.to_dict(language, include_answer=True),
                'user_answer': user_answer,
                'is_correct': is_correct
            })
        
        attempt = QuizAttempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            score=score,
            total_questions=len(questions),
            answers=answers
        )
        db.session.add(attempt)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'score': score,
            'total': len(questions),
            'percentage': (score / len(questions) * 100) if len(questions) > 0 else 0,
            'results': results
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/chatbot', methods=['POST'])
def chatbot_message():
    try:
        data = request.get_json()
        message = data.get('message', '')
        language = data.get('language', 'en')
        
        response = chatbot.get_response(message, language)
        
        return jsonify({
            'success': True,
            'response': response
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    try:
        language = request.args.get('language', 'en')
        
        total_courses = Course.query.count()
        enrolled_courses = db.session.query(Progress.course_id).filter_by(
            user_id=current_user.id
        ).distinct().count()
        
        completed_lessons = Progress.query.filter_by(
            user_id=current_user.id,
            completed=True
        ).count()
        
        quiz_attempts = QuizAttempt.query.filter_by(
            user_id=current_user.id
        ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
        
        recent_progress = Progress.query.filter_by(
            user_id=current_user.id
        ).order_by(Progress.last_accessed.desc()).limit(5).all()
        
        progress_data = []
        for prog in recent_progress:
            if prog.course:
                progress_data.append({
                    'course': prog.course.to_dict(language),
                    'lesson': prog.lesson.to_dict(language) if prog.lesson else None,
                    'completed': prog.completed,
                    'last_accessed': prog.last_accessed.isoformat()
                })
        
        return jsonify({
            'success': True,
            'stats': {
                'total_courses': total_courses,
                'enrolled_courses': enrolled_courses,
                'completed_lessons': completed_lessons,
                'quiz_attempts': len(quiz_attempts)
            },
            'recent_quizzes': [attempt.to_dict() for attempt in quiz_attempts],
            'recent_progress': progress_data,
            'is_premium': current_user.is_premium,
            'premium_expires': current_user.premium_expires.isoformat() if current_user.premium_expires else None
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mpesa/initiate', methods=['POST'])
@login_required
def initiate_mpesa_payment():
    try:
        data = request.get_json()
        phone_number = data.get('phone_number', current_user.phone_number)
        
        if not phone_number:
            return jsonify({'success': False, 'message': 'Phone number required'}), 400
        
        amount = app.config['PREMIUM_PRICE']
        
        payment = Payment(
            user_id=current_user.id,
            amount=amount,
            phone_number=phone_number,
            status='pending'
        )
        db.session.add(payment)
        db.session.commit()
        
        result = mpesa_api.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=f"ELIMU{current_user.id}",
            transaction_desc="ElimuAI Premium Subscription"
        )
        
        if result.get('ResponseCode') == '0':
            payment.transaction_id = result.get('CheckoutRequestID')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Payment initiated. Please check your phone.',
                'checkout_request_id': result.get('CheckoutRequestID')
            }), 200
        else:
            payment.status = 'failed'
            db.session.commit()
            return jsonify({
                'success': False,
                'message': result.get('errorMessage', 'Payment initiation failed')
            }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    try:
        data = request.get_json()
        
        result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
        checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
        
        payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
        
        if payment:
            if result_code == 0:
                callback_metadata = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {}).get('Item', [])
                
                mpesa_receipt = None
                for item in callback_metadata:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt = item.get('Value')
                        break
                
                payment.status = 'completed'
                payment.mpesa_receipt = mpesa_receipt
                payment.completed_at = datetime.utcnow()
                
                user = payment.user
                user.is_premium = True
                
                if user.premium_expires and user.premium_expires > datetime.utcnow():
                    user.premium_expires += timedelta(days=app.config['PREMIUM_DURATION_DAYS'])
                else:
                    user.premium_expires = datetime.utcnow() + timedelta(days=app.config['PREMIUM_DURATION_DAYS'])
                
                db.session.commit()
            else:
                payment.status = 'failed'
                db.session.commit()
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mpesa/status/<checkout_request_id>', methods=['GET'])
@login_required
def check_payment_status(checkout_request_id):
    try:
        payment = Payment.query.filter_by(
            transaction_id=checkout_request_id,
            user_id=current_user.id
        ).first_or_404()
        
        return jsonify({
            'success': True,
            'payment': payment.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        if Course.query.count() == 0:
            from seed_data import seed_database
            seed_database()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
