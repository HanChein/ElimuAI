@echo off
echo Starting ElimuAI Platform...
echo.

cd /d "%~dp0.."

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server...
python scripts\run_app.py
