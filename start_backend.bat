@echo off
cd /d "%~dp0backend"
echo Installing Python dependencies...
pip install -r requirements.txt
echo Starting FastAPI server...
python main.py
pause
