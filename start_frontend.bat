@echo off
cd /d "%~dp0frontend"
echo Installing npm dependencies...
call npm install
echo Starting React development server...
call npm run dev
pause
