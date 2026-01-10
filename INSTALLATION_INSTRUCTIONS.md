# Git Installation & GitHub Push Instructions

## Current Status
❌ Git is not installed on your system

## Step-by-Step Instructions

### Step 1: Install Git

1. **Download Git for Windows**
   - Visit: https://git-scm.com/download/win
   - Click "Click here to download" for the latest version
   - File size: ~50 MB

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through all options (defaults are fine)
   - Important: Keep "Git from the command line and also from 3rd-party software" selected
   - Click "Install"
   - Click "Finish"

3. **Verify Installation**
   - Open a NEW PowerShell window (important: must be new)
   - Type: `git --version`
   - You should see: `git version 2.x.x`

### Step 2: Push to GitHub (After Installing Git)

#### Option A: Use the Automated Script (Easiest)

1. Double-click: `push_to_github.bat`
2. Follow the prompts
3. Enter your GitHub credentials when asked
4. Done!

#### Option B: Manual Commands

Open PowerShell in the ElimuAI folder and run:

```powershell
# Initialize repository
git init

# Configure user
git config --global user.name "kadioko"
git config --global user.email "your-email@example.com"

# Add all files
git add .

# Create commit
git commit -m "Initial commit: Complete ElimuAI platform"

# Add remote
git remote add origin https://github.com/kadioko/ElimuAI.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: GitHub Authentication

When pushing, you'll need:
- **Username**: kadioko
- **Password**: Personal Access Token (NOT your GitHub password)

#### Create Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "ElimuAI Project"
4. Select scopes: ✅ repo (all)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as your password when pushing

### Step 4: Create Repository on GitHub (If Needed)

If the repository doesn't exist:
1. Go to: https://github.com/new
2. Repository name: `ElimuAI`
3. Description: "AI-powered e-learning platform for Tanzania"
4. Keep it Public (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Alternative: GitHub Desktop (No Command Line)

If you prefer a GUI:

1. **Download GitHub Desktop**
   - Visit: https://desktop.github.com/
   - Download and install

2. **Sign In**
   - Open GitHub Desktop
   - Sign in with your GitHub account

3. **Add Repository**
   - Click "File" → "Add local repository"
   - Browse to: `C:\Users\USER\Documents\Coding\Projects\ElimuAI`
   - Click "Add repository"

4. **Publish**
   - Click "Publish repository"
   - Name: ElimuAI
   - Description: AI-powered e-learning platform
   - Click "Publish repository"

5. **Done!**
   - Your project is now on GitHub

## Troubleshooting

### "git is not recognized"
- Git is not installed or not in PATH
- Solution: Install Git and restart terminal

### "Authentication failed"
- Using password instead of token
- Solution: Use Personal Access Token

### "Repository not found"
- Repository doesn't exist on GitHub
- Solution: Create it first at https://github.com/new

### "Permission denied"
- Wrong credentials
- Solution: Check username and use correct token

### "Failed to push"
- Network issues or repository already has content
- Solution: Try `git push -u origin main --force` (careful!)

## Verify Success

After pushing, visit:
https://github.com/kadioko/ElimuAI

You should see:
- ✅ All your folders (backend, frontend, docs, etc.)
- ✅ README.md displayed on the main page
- ✅ All files organized properly

## Next Steps After Push

1. **Add Repository Description**
   - Go to repository settings
   - Add description: "AI-powered e-learning platform for Tanzania with Swahili support"

2. **Add Topics**
   - Click "Add topics"
   - Add: `python`, `flask`, `e-learning`, `ai`, `tanzania`, `swahili`, `education`

3. **Update Repository Settings**
   - Enable Issues (for bug tracking)
   - Enable Discussions (for community)
   - Add a license (MIT recommended)

4. **Share Your Project**
   - Share the GitHub link
   - Add to your portfolio
   - Submit to showcases

## Future Updates

After making changes to your project:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## Need Help?

- Git Documentation: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Create an issue in your repository for project-specific help
