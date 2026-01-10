@echo off
echo ============================================
echo ElimuAI - GitHub Push Setup
echo ============================================
echo.

REM Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed on your system.
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Run the installer with default settings
    echo 3. Restart this script after installation
    echo.
    echo Opening Git download page...
    start https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if already initialized
if exist ".git" (
    echo [INFO] Git repository already initialized
    echo.
) else (
    echo [STEP 1] Initializing Git repository...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo [OK] Repository initialized
    echo.
)

REM Configure Git user (only if not set)
git config user.name >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [STEP 2] Configuring Git user...
    set /p USERNAME="Enter your GitHub username (kadioko): "
    if "%USERNAME%"=="" set USERNAME=kadioko
    
    set /p EMAIL="Enter your email: "
    if "%EMAIL%"=="" set EMAIL=user@example.com
    
    git config --global user.name "%USERNAME%"
    git config --global user.email "%EMAIL%"
    echo [OK] Git configured
    echo.
) else (
    echo [STEP 2] Git user already configured
    echo.
)

REM Add all files
echo [STEP 3] Adding all files...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] Files added
echo.

REM Create commit
echo [STEP 4] Creating commit...
git commit -m "Initial commit: Complete ElimuAI e-learning platform with organized structure"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Commit may have failed or no changes to commit
    echo.
)
echo [OK] Commit created
echo.

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [STEP 5] Adding GitHub remote...
    git remote add origin https://github.com/kadioko/ElimuAI.git
    echo [OK] Remote added
    echo.
) else (
    echo [STEP 5] Remote already exists
    echo.
)

REM Set main branch
echo [STEP 6] Setting main branch...
git branch -M main
echo [OK] Branch set to main
echo.

REM Push to GitHub
echo [STEP 7] Pushing to GitHub...
echo.
echo You may be prompted for GitHub credentials:
echo - Username: kadioko
echo - Password: Use your Personal Access Token (not your password)
echo.
echo If you don't have a token, create one at:
echo https://github.com/settings/tokens
echo.
pause

git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Push failed. This might be because:
    echo 1. Authentication failed - Use Personal Access Token
    echo 2. Repository doesn't exist - Create it on GitHub first
    echo 3. Network issues
    echo.
    echo To create the repository:
    echo 1. Go to: https://github.com/new
    echo 2. Name it: ElimuAI
    echo 3. Don't initialize with README
    echo 4. Run this script again
    echo.
    start https://github.com/new
    pause
    exit /b 1
)

echo.
echo ============================================
echo [SUCCESS] Project pushed to GitHub!
echo ============================================
echo.
echo View your repository at:
echo https://github.com/kadioko/ElimuAI
echo.
start https://github.com/kadioko/ElimuAI
pause
