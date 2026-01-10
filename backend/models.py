from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20))
    preferred_language = db.Column(db.String(10), default='sw')
    is_premium = db.Column(db.Boolean, default=False)
    premium_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    progress = db.relationship('Progress', backref='user', lazy=True, cascade='all, delete-orphan')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'phone_number': self.phone_number,
            'preferred_language': self.preferred_language,
            'is_premium': self.is_premium,
            'premium_expires': self.premium_expires.isoformat() if self.premium_expires else None,
            'created_at': self.created_at.isoformat()
        }

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    title_en = db.Column(db.String(200), nullable=False)
    title_sw = db.Column(db.String(200), nullable=False)
    description_en = db.Column(db.Text)
    description_sw = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)
    difficulty_level = db.Column(db.String(20), default='beginner')
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    lessons = db.relationship('Lesson', backref='course', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='course', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, language='en'):
        return {
            'id': self.id,
            'title': self.title_sw if language == 'sw' else self.title_en,
            'description': self.description_sw if language == 'sw' else self.description_en,
            'category': self.category,
            'difficulty_level': self.difficulty_level,
            'is_premium': self.is_premium,
            'lesson_count': len(self.lessons),
            'quiz_count': len(self.quizzes)
        }

class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    title_sw = db.Column(db.String(200), nullable=False)
    content_en = db.Column(db.Text, nullable=False)
    content_sw = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self, language='en'):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title_sw if language == 'sw' else self.title_en,
            'content': self.content_sw if language == 'sw' else self.content_en,
            'order': self.order
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    title_sw = db.Column(db.String(200), nullable=False)
    difficulty_level = db.Column(db.String(20), default='beginner')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, language='en'):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title_sw if language == 'sw' else self.title_en,
            'difficulty_level': self.difficulty_level,
            'question_count': len(self.questions)
        }

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_text_en = db.Column(db.Text, nullable=False)
    question_text_sw = db.Column(db.Text, nullable=False)
    option_a_en = db.Column(db.String(200), nullable=False)
    option_a_sw = db.Column(db.String(200), nullable=False)
    option_b_en = db.Column(db.String(200), nullable=False)
    option_b_sw = db.Column(db.String(200), nullable=False)
    option_c_en = db.Column(db.String(200), nullable=False)
    option_c_sw = db.Column(db.String(200), nullable=False)
    option_d_en = db.Column(db.String(200), nullable=False)
    option_d_sw = db.Column(db.String(200), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)
    explanation_en = db.Column(db.Text)
    explanation_sw = db.Column(db.Text)
    
    def to_dict(self, language='en', include_answer=False):
        data = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text_sw if language == 'sw' else self.question_text_en,
            'options': {
                'A': self.option_a_sw if language == 'sw' else self.option_a_en,
                'B': self.option_b_sw if language == 'sw' else self.option_b_en,
                'C': self.option_c_sw if language == 'sw' else self.option_c_en,
                'D': self.option_d_sw if language == 'sw' else self.option_d_en
            }
        }
        if include_answer:
            data['correct_answer'] = self.correct_answer
            data['explanation'] = self.explanation_sw if language == 'sw' else self.explanation_en
        return data

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    answers = db.Column(db.JSON)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'total_questions': self.total_questions,
            'percentage': (self.score / self.total_questions * 100) if self.total_questions > 0 else 0,
            'completed_at': self.completed_at.isoformat()
        }

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    
    course = db.relationship('Course', backref='progress_records')
    lesson = db.relationship('Lesson', backref='progress_records')
    
    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'lesson_id': self.lesson_id,
            'completed': self.completed,
            'last_accessed': self.last_accessed.isoformat()
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True)
    mpesa_receipt = db.Column(db.String(100))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'phone_number': self.phone_number,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

# Gamification Models
class UserPoints(db.Model):
    __tablename__ = 'user_points'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    total_points = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='points_record')
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'total_points': self.total_points,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None
        }

class UserBadge(db.Model):
    __tablename__ = 'user_badges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.String(50), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='badges')
    
    def to_dict(self):
        return {
            'badge_id': self.badge_id,
            'earned_at': self.earned_at.isoformat()
        }

class Certificate(db.Model):
    __tablename__ = 'certificates'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    certificate_id = db.Column(db.String(50), unique=True, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='certificates')
    course = db.relationship('Course', backref='certificates')
    
    def to_dict(self):
        return {
            'id': self.id,
            'certificate_id': self.certificate_id,
            'course_id': self.course_id,
            'issued_at': self.issued_at.isoformat()
        }

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='chat_history')
