@echo off
REM VoiceFlow Application Startup Script for Windows

echo =================================================
echo      VoiceFlow Application Startup
echo =================================================

REM Check if .env file exists
if not exist "backend\.env" (
    echo Creating .env file from template...
    copy "backend\.env.example" "backend\.env"
    echo Please edit backend\.env with your VAPI_API_KEY and other settings
    echo Then run this script again
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo Creating frontend .env file from template...
    copy "frontend\.env.example" "frontend\.env"
)

REM Start backend
echo Starting backend server...
start "VoiceFlow Backend" cmd /k "cd backend && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend
echo Starting frontend development server...
start "VoiceFlow Frontend" cmd /k "cd frontend && npm run dev"

echo =================================================
echo   VoiceFlow Application Started!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo =================================================

pause
