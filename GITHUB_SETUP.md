# Push ElimuAI to GitHub

## Prerequisites

### Install Git (if not already installed)
Download and install Git from: https://git-scm.com/download/win

After installation, restart your terminal/PowerShell.

## Step-by-Step Guide

### 1. Initialize Git Repository

Open PowerShell/Terminal in the ElimuAI directory and run:

```bash
git init
```

### 2. Configure Git (First Time Only)

```bash
git config --global user.name "kadioko"
git config --global user.email "your-email@example.com"
```

### 3. Add All Files

```bash
git add .
```

### 4. Create Initial Commit

```bash
git commit -m "Initial commit: ElimuAI e-learning platform with AI tutoring, gamification, and M-Pesa integration"
```

### 5. Add Remote Repository

```bash
git remote add origin https://github.com/kadioko/ElimuAI.git
```

### 6. Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## If Repository Already Exists on GitHub

If you've already created the repository on GitHub, you might need to force push:

```bash
git push -u origin main --force
```

## Alternative: Using GitHub Desktop

1. Download GitHub Desktop: https://desktop.github.com/
2. Open GitHub Desktop
3. Click "Add" → "Add Existing Repository"
4. Browse to: `C:\Users\USER\Documents\Coding\Projects\ElimuAI`
5. Click "Publish repository"
6. Select your account and repository name: `ElimuAI`
7. Click "Publish"

## Verify Upload

Visit: https://github.com/kadioko/ElimuAI

You should see all your files organized in the new structure.

## Future Updates

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

## Common Issues

### Authentication Required
If prompted for credentials, you may need to:
1. Use a Personal Access Token instead of password
2. Generate token at: https://github.com/settings/tokens
3. Use token as password when prompted

### Repository Not Found
Ensure the repository exists at: https://github.com/kadioko/ElimuAI
Create it first on GitHub if it doesn't exist.

## Project Structure on GitHub

```
ElimuAI/
├── backend/              # Python Flask backend
│   ├── app.py
│   ├── models.py
│   ├── chatbot.py
│   └── ...
├── frontend/             # HTML/CSS/JS
│   └── static/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── docs/                 # Documentation
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT.md
│   └── ...
├── config/               # Configuration
│   ├── .env.example
│   └── requirements.txt
├── scripts/              # Helper scripts
│   ├── setup.py
│   └── run.bat
├── .gitignore
├── Procfile
├── runtime.txt
└── README.md
```

## Next Steps After Push

1. Add repository description on GitHub
2. Add topics/tags: `python`, `flask`, `e-learning`, `ai`, `tanzania`, `swahili`
3. Enable GitHub Pages (if desired)
4. Set up GitHub Actions for CI/CD (optional)
5. Add collaborators (if needed)
