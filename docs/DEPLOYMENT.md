# Deployment Guide for ElimuAI

## Quick Start Deployment to Heroku (Recommended)

### Step 1: Prepare Your Application

1. Ensure all files are committed to Git:
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Install Heroku CLI

Download and install from: https://devcenter.heroku.com/articles/heroku-cli

### Step 3: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create elimuai-tz

# Add PostgreSQL database (optional, for production)
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
heroku config:set FLASK_ENV=production

# For M-Pesa (add your actual credentials)
heroku config:set MPESA_CONSUMER_KEY=your_consumer_key
heroku config:set MPESA_CONSUMER_SECRET=your_consumer_secret
heroku config:set MPESA_SHORTCODE=your_shortcode
heroku config:set MPESA_PASSKEY=your_passkey
heroku config:set MPESA_CALLBACK_URL=https://your-app.herokuapp.com/api/mpesa/callback

# Deploy
git push heroku main

# Initialize database
heroku run python -c "from app import app, db; from seed_data import seed_database; app.app_context().push(); db.create_all(); seed_database()"

# Open your app
heroku open
```

## Alternative: Deploy to Render.com (Free)

### Step 1: Create Account
Sign up at https://render.com

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: elimuai
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

### Step 3: Add Environment Variables

In the Render dashboard, add:
- `SECRET_KEY`: Generate a random string
- `PYTHON_VERSION`: 3.11.7
- `MPESA_CONSUMER_KEY`: Your M-Pesa key
- `MPESA_CONSUMER_SECRET`: Your M-Pesa secret
- `MPESA_SHORTCODE`: Your shortcode
- `MPESA_PASSKEY`: Your passkey
- `MPESA_CALLBACK_URL`: https://your-app.onrender.com/api/mpesa/callback

### Step 4: Deploy

Click "Create Web Service" - Render will automatically deploy your app.

## Alternative: Deploy to Railway.app (Free)

### Step 1: Create Account
Sign up at https://railway.app

### Step 2: Deploy

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway auto-detects Python and deploys

### Step 3: Add Environment Variables

In Railway dashboard:
1. Go to Variables tab
2. Add all environment variables from `.env.example`
3. Click "Deploy"

## Alternative: Deploy to PythonAnywhere (Free)

### Step 1: Create Account
Sign up at https://www.pythonanywhere.com

### Step 2: Upload Code

```bash
# In PythonAnywhere Bash console
git clone <your-repo-url>
cd ElimuAI
pip install --user -r requirements.txt
```

### Step 3: Configure Web App

1. Go to Web tab
2. Click "Add a new web app"
3. Choose Flask
4. Set source code directory to `/home/yourusername/ElimuAI`
5. Edit WSGI file:

```python
import sys
path = '/home/yourusername/ElimuAI'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

### Step 4: Set Environment Variables

In Web tab, add environment variables in the "Environment variables" section.

### Step 5: Reload

Click "Reload" button to start your app.

## Production Checklist

### Security
- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `FLASK_ENV=production`
- [ ] Use HTTPS (most platforms provide this automatically)
- [ ] Enable CORS only for your domain
- [ ] Set up proper error logging

### Database
- [ ] Migrate from SQLite to PostgreSQL for production
- [ ] Set up regular database backups
- [ ] Configure connection pooling

### M-Pesa Configuration
- [ ] Switch from sandbox to production M-Pesa API
- [ ] Update `MPESA_API_URL` in `config.py`:
  ```python
  MPESA_API_URL = 'https://api.safaricom.co.ke'  # Production
  ```
- [ ] Verify callback URL is publicly accessible
- [ ] Test payment flow thoroughly

### Performance
- [ ] Enable caching (Redis recommended)
- [ ] Compress static files
- [ ] Use CDN for static assets
- [ ] Set up monitoring (e.g., Sentry)

### Monitoring
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Enable analytics

## Upgrading to PostgreSQL

For production, replace SQLite with PostgreSQL:

1. **Update requirements.txt**:
```
psycopg2-binary==2.9.9
```

2. **Update config.py**:
```python
import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///elimuai.db')
    
    # Fix for Heroku postgres:// vs postgresql://
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
```

3. **Migrate data** (if needed):
```bash
# Export from SQLite
sqlite3 elimuai.db .dump > backup.sql

# Import to PostgreSQL (adjust as needed)
psql your_database < backup.sql
```

## Custom Domain Setup

### Heroku
```bash
heroku domains:add www.elimuai.co.tz
heroku domains:add elimuai.co.tz
```

Then configure DNS:
- Add CNAME record: `www` → `your-app.herokuapp.com`
- Add ALIAS/ANAME record: `@` → `your-app.herokuapp.com`

### Render/Railway
Follow platform-specific instructions in their dashboard.

## SSL/HTTPS

All recommended platforms (Heroku, Render, Railway, PythonAnywhere) provide free SSL certificates automatically.

## Troubleshooting

### App won't start
- Check logs: `heroku logs --tail` (Heroku) or platform-specific logs
- Verify all environment variables are set
- Check Python version compatibility

### Database errors
- Ensure database is created: `db.create_all()`
- Check DATABASE_URL is correct
- Verify database migrations

### M-Pesa not working
- Verify credentials are correct
- Check callback URL is publicly accessible
- Ensure using correct API URL (sandbox vs production)
- Check M-Pesa API logs in Daraja portal

### Static files not loading
- Verify static folder structure
- Check file paths in HTML
- Clear browser cache

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Review user feedback
- Update dependencies monthly
- Backup database daily
- Monitor M-Pesa transactions

### Scaling
When you outgrow free tier:
- Upgrade to paid Heroku dyno
- Add Redis for caching
- Implement CDN for static files
- Add load balancer for multiple instances

## Cost Estimates

### Free Tier (Suitable for MVP/Testing)
- Heroku: Free (with limitations)
- Render: Free (750 hours/month)
- Railway: $5 credit/month
- PythonAnywhere: Free (limited)

### Production (Recommended)
- Heroku Hobby: $7/month
- Render Starter: $7/month
- Railway: Pay as you go (~$5-10/month)
- Database: $9/month (Heroku Postgres)

### Enterprise
- Heroku Professional: $25-50/month
- Dedicated database: $50+/month
- CDN: $10-20/month
- Monitoring: $10-30/month

## Support Resources

- Heroku Docs: https://devcenter.heroku.com/
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app/
- M-Pesa Daraja: https://developer.safaricom.co.ke/docs

---

**Need help?** Create an issue in the repository or contact support.
