# ElimuAI - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Setup Environment

**Windows:**
```bash
# Run the setup script
python setup.py

# Or manually create virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
python3 setup.py

# Or manually
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Configure (Optional)

Edit `.env` file to add M-Pesa credentials (optional for testing):
```env
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

### Step 3: Run the Application

**Windows:**
```bash
run.bat
```

**macOS/Linux:**
```bash
python app.py
```

**Access the app:** Open http://localhost:5000 in your browser

## 📱 Testing the Platform

### 1. Create an Account
- Go to Sign Up page
- Enter username, email, password
- Choose preferred language (Swahili/English)
- Optional: Add phone number for M-Pesa

### 2. Explore Courses
- Browse available courses in Math, Business, Vocational Skills
- Click on a course to view lessons and quizzes
- Free courses are immediately accessible

### 3. Take Lessons
- Click "Open" on any lesson
- Read the content
- Click "Complete Lesson" when done

### 4. Take Quizzes
- Click "Start" on any quiz
- Answer all questions
- Submit to see results with explanations

### 5. Use AI Tutor
- Go to "AI Tutor" page
- Ask questions about Math, Business, or Vocational Skills
- Works in both English and Swahili

### 6. Track Progress
- Visit Dashboard to see:
  - Total courses and enrolled courses
  - Completed lessons
  - Quiz scores and history
  - Recent activity

## 🎯 Sample Test Accounts

The database is pre-seeded with sample courses. Create your own account to test all features.

## 🔧 Troubleshooting

**Port already in use:**
```bash
# Change port in app.py (last line)
app.run(debug=True, host='0.0.0.0', port=5001)
```

**Database errors:**
```bash
# Delete and recreate database
rm elimuai.db  # or del elimuai.db on Windows
python app.py
```

**Dependencies issues:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## 📚 Available Sample Courses

1. **Basic Mathematics** (Free)
   - Addition, Subtraction, Multiplication
   - 3 Lessons, 1 Quiz

2. **Business Fundamentals** (Free)
   - Market Research, Basic Accounting
   - 2 Lessons, 1 Quiz

3. **Advanced Mathematics** (Premium)
   - Calculus, Statistics
   - Premium subscription required

4. **Vocational Skills - Carpentry** (Premium)
   - Practical carpentry skills
   - Premium subscription required

## 🌍 Language Switching

Click the language toggle button (EN/SW) in the navigation bar to switch between English and Swahili.

## 💳 Testing M-Pesa (Sandbox)

1. Get sandbox credentials from https://developer.safaricom.co.ke/
2. Add credentials to `.env` file
3. Use test phone numbers provided by Safaricom
4. Initiate payment from Dashboard → "Get Premium"

## 📖 Next Steps

- Read `README.md` for detailed documentation
- Check `DEPLOYMENT.md` for deployment instructions
- Review `DATABASE_SCHEMA.md` for database structure
- Customize courses in `seed_data.py`

## 🛠️ Development Mode

The app runs in debug mode by default with:
- Auto-reload on code changes
- Detailed error messages
- SQLite database (easy to reset)

## 🚀 Deploy to Production

See `DEPLOYMENT.md` for detailed deployment instructions to:
- Heroku (Recommended)
- Render.com
- Railway.app
- PythonAnywhere

## 📞 Support

- Check documentation files
- Review code comments
- Create GitHub issue for bugs

---

**Happy Learning! 📚🎓**
