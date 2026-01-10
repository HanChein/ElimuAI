# ElimuAI - AI-Powered E-Learning Platform for Tanzania

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://elimuai.onrender.com)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-purple.svg)](https://elimuai.onrender.com)
![GitHub stars](https://img.shields.io/github/stars/kadioko/ElimuAI?style=social)
![GitHub forks](https://img.shields.io/github/forks/kadioko/ElimuAI?style=social)
![GitHub issues](https://img.shields.io/github/issues/kadioko/ElimuAI)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> **🌐 Live Demo: [https://elimuai.onrender.com](https://elimuai.onrender.com)**

**AI-powered e-learning platform for Tanzania** with Swahili/English support, gamification, certificates, and M-Pesa integration.

ElimuAI is a comprehensive e-learning platform designed for Tanzanian users, offering personalized AI tutoring in Swahili and English for Math, Business, and Vocational Skills. Built with mobile-first design, PWA support, and modern UI/UX for accessibility across Tanzania.

## 🎯 Live Demo

**Try it now:** [https://elimuai.onrender.com](https://elimuai.onrender.com)

- Register a new account (with animated onboarding tour!)
- Browse courses in Math, Business, and Vocational Skills
- Take adaptive quizzes with instant feedback
- Chat with the AI tutor in Swahili or English
- Track your learning progress with charts
- Earn points, badges, and certificates
- Compete on the leaderboard

## ✨ Features

### Core Learning
- 🤖 **AI Chatbot Tutor** - Intelligent NLP-based chatbot providing instant help in Swahili and English
- 📚 **Adaptive Quizzes** - Interactive quizzes with instant feedback and explanations
- 📊 **Progress Tracking** - Comprehensive dashboard with visual charts
- 🎯 **Personalized Learning** - Adaptive content based on user performance

### Gamification System
- 🏆 **Points & Levels** - Earn XP for completing lessons, quizzes, and daily activities
- 🏅 **Badges** - Unlock achievements for milestones (First Steps, Quiz Master, etc.)
- 🔥 **Streaks** - Maintain daily learning streaks for bonus points
- 📈 **Leaderboard** - Compete with other learners (weekly/monthly/all-time)
- 📜 **Certificates** - Earn shareable certificates upon course completion

### Modern UI/UX
- 🌙 **Dark/Light Mode** - Toggle themes with smooth transitions
- 📱 **PWA Support** - Install as app, works offline
- 🎨 **Modern Design** - Glassmorphism, gradients, animations
- ⌨️ **Keyboard Shortcuts** - Navigate quickly with hotkeys
- 🔊 **Sound Effects** - Audio feedback for achievements
- 🎓 **Onboarding Tour** - Guided tour for new users

### Platform Features
- 🌍 **Bilingual Support** - Full Swahili and English support
- 📱 **Mobile-Responsive** - Optimized for Android devices
- 💳 **M-Pesa Integration** - Seamless premium payments
- 🔔 **Toast Notifications** - Beautiful in-app notifications
- 👤 **User Profiles** - Avatar upload, stats, settings

## Tech Stack

### Backend
- **Python 3.11+**
- **Flask** - Web framework
- **SQLAlchemy** - ORM for database management
- **Flask-Login** - User authentication
- **SQLite** - Database (easily upgradable to PostgreSQL)

### Frontend
- **HTML5/CSS3** - Modern, responsive design
- **Vanilla JavaScript** - No framework dependencies
- **Mobile-First Design** - Optimized for Android devices

## Project Structure

```
ElimuAI/
├── backend/          # Flask backend (Python)
├── frontend/         # Static files (HTML/CSS/JS)
├── docs/            # Documentation
├── config/          # Configuration files
├── scripts/         # Helper scripts
├── .gitignore       # Git ignore rules
├── Procfile         # Heroku deployment
└── README.md        # This file
```

## Installation

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Git

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/kadioko/ElimuAI.git
cd ElimuAI
```

2. **Run setup script**
```bash
# Windows
python scripts\setup.py

# macOS/Linux
python3 scripts/setup.py
```

3. **Install dependencies**
```bash
pip install -r config/requirements.txt
```

4. **Set up environment variables**
```bash
# Copy the example environment file
copy config\.env.example .env

# Edit .env and add your configuration
```

5. **Run the application**
```bash
# Windows
scripts\run.bat

# macOS/Linux
python backend/app.py
```

The application will be available at `http://localhost:5000`

## Quick Start

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for detailed quick start guide.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///elimuai.db
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=your-business-shortcode
MPESA_PASSKEY=your-mpesa-passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
FLASK_ENV=development
```

### M-Pesa Configuration

To enable M-Pesa payments:

1. Register for M-Pesa Daraja API at https://developer.safaricom.co.ke/
2. Create an app to get your Consumer Key and Consumer Secret
3. Get your Business Shortcode and Passkey
4. Update the `.env` file with your credentials
5. For production, change `MPESA_API_URL` in `config.py` from sandbox to production URL

## Deployment to Heroku

### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed

### Deployment Steps

1. **Login to Heroku**
```bash
heroku login
```

2. **Create a new Heroku app**
```bash
heroku create elimuai-app
```

3. **Set environment variables**
```bash
heroku config:set SECRET_KEY=your-secret-key
heroku config:set MPESA_CONSUMER_KEY=your-key
heroku config:set MPESA_CONSUMER_SECRET=your-secret
heroku config:set MPESA_SHORTCODE=your-shortcode
heroku config:set MPESA_PASSKEY=your-passkey
heroku config:set MPESA_CALLBACK_URL=https://your-app.herokuapp.com/api/mpesa/callback
```

4. **For production, upgrade to PostgreSQL**
```bash
heroku addons:create heroku-postgresql:mini
```

Update `config.py` to use Heroku's DATABASE_URL:
```python
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///elimuai.db').replace('postgres://', 'postgresql://')
```

5. **Deploy to Heroku**
```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

6. **Initialize the database**
```bash
heroku run python
>>> from app import app, db
>>> with app.app_context():
>>>     db.create_all()
>>>     from seed_data import seed_database
>>>     seed_database()
>>> exit()
```

7. **Open your app**
```bash
heroku open
```

## Alternative Deployment Options

### Render.com (Free Tier)

1. Create account at https://render.com
2. Create new Web Service
3. Connect your GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `gunicorn app:app`
6. Add environment variables in dashboard
7. Deploy

### PythonAnywhere (Free Tier)

1. Create account at https://www.pythonanywhere.com
2. Upload your code via Git or file upload
3. Create a new web app (Flask)
4. Configure WSGI file to point to your app
5. Set environment variables in web app settings
6. Reload the web app

### Railway.app (Free Tier)

1. Create account at https://railway.app
2. Create new project from GitHub
3. Add environment variables
4. Deploy automatically

## Database Schema

### Users
- id, username, email, password_hash
- phone_number, preferred_language
- is_premium, premium_expires
- created_at

### Courses
- id, title (EN/SW), description (EN/SW)
- category, difficulty_level, is_premium
- created_at

### Lessons
- id, course_id, title (EN/SW)
- content (EN/SW), order
- created_at

### Quizzes
- id, course_id, title (EN/SW)
- difficulty_level, created_at

### Questions
- id, quiz_id, question_text (EN/SW)
- options A-D (EN/SW), correct_answer
- explanation (EN/SW)

### Progress
- id, user_id, course_id, lesson_id
- completed, last_accessed

### Quiz Attempts
- id, user_id, quiz_id
- score, total_questions, answers
- completed_at

### Payments
- id, user_id, amount, phone_number
- transaction_id, mpesa_receipt
- status, created_at, completed_at

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/<id>` - Get course details

### Lessons
- `GET /api/lessons/<id>` - Get lesson content
- `POST /api/lessons/<id>/complete` - Mark lesson complete

### Quizzes
- `GET /api/quizzes/<id>` - Get quiz questions
- `POST /api/quizzes/<id>/submit` - Submit quiz answers

### Chatbot
- `POST /api/chatbot` - Send message to AI tutor

### Dashboard
- `GET /api/dashboard` - Get user dashboard data

### Payments
- `POST /api/mpesa/initiate` - Initiate M-Pesa payment
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `GET /api/mpesa/status/<id>` - Check payment status

### Gamification
- `GET /api/gamification/stats` - Get user points, level, streak
- `GET /api/gamification/leaderboard` - Get leaderboard (all/week/month)
- `POST /api/gamification/award` - Award points for actions

### Certificates
- `GET /api/certificates` - Get user's certificates
- `POST /api/certificates/generate/<course_id>` - Generate certificate
- `GET /api/certificates/verify/<cert_id>` - Verify certificate

## Security Features

- Password hashing using Werkzeug
- CSRF protection via Flask-Login
- Secure session management
- Environment variable configuration
- SQL injection prevention via SQLAlchemy ORM
- Input validation on all forms

## Scalability Considerations

1. **Database**: Easily migrate from SQLite to PostgreSQL for production
2. **Caching**: Add Redis for session storage and caching
3. **CDN**: Serve static files via CDN for better performance
4. **Load Balancing**: Deploy multiple instances behind a load balancer
5. **Background Jobs**: Use Celery for async tasks (email, notifications)
6. **API Rate Limiting**: Implement rate limiting for API endpoints

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Go to Home |
| `C` | Go to Courses |
| `D` | Go to Dashboard |
| `T` | Open AI Tutor |
| `R` | View Rewards |
| `P` | Open Profile |
| `L` | Toggle Language |
| `M` | Toggle Dark Mode |
| `?` | Show Shortcuts |
| `Esc` | Close Modal |

## 🚀 Roadmap

### Phase 1 - Core Platform ✅
- [x] User authentication (register/login)
- [x] Bilingual support (Swahili/English)
- [x] AI chatbot tutor
- [x] Adaptive quizzes with feedback
- [x] Progress tracking dashboard
- [x] M-Pesa payment integration
- [x] Mobile-responsive design
- [x] Deployed to production

### Phase 2 - Engagement ✅
- [x] Gamification system (points, badges, leaderboards)
- [x] Daily streaks and rewards
- [x] Certificate generation
- [x] PWA with offline support
- [x] Dark/Light mode
- [x] Sound effects
- [x] Animated onboarding tour
- [x] Keyboard shortcuts
- [x] User profiles with avatars
- [x] Progress charts

### Phase 3 - Advanced Features (In Progress)
- [ ] Video lessons support
- [ ] Advanced AI with GPT/Claude integration
- [ ] Instructor dashboard
- [ ] Advanced analytics
- [ ] Push notifications
- [ ] Social learning features

### Phase 4 - Scale
- [ ] Mobile app (React Native/Flutter)
- [ ] Multi-tenant for schools
- [ ] Corporate training modules
- [ ] API for third-party integration
- [ ] Regional expansion (Kenya, Uganda, Rwanda)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@elimuai.com or create an issue in the repository.

## Acknowledgments

- Safaricom M-Pesa Daraja API
- Flask and Python community
- Tanzanian education sector

---

**Built with ❤️ for Tanzanian learners**
