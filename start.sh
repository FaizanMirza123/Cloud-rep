#!/bin/bash

# VoiceFlow Application Startup Script

echo "================================================="
echo "      VoiceFlow Application Startup"
echo "================================================="

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file from template..."
    cp "backend/.env.example" "backend/.env"
    echo "Please edit backend/.env with your VAPI_API_KEY and other settings"
    echo "Then run this script again"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env file from template..."
    cp "frontend/.env.example" "frontend/.env"
fi

# Function to cleanup background processes
cleanup() {
    echo "Shutting down VoiceFlow application..."
    pkill -f "python main.py"
    pkill -f "npm run dev"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "================================================="
echo "   VoiceFlow Application Started!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:8000/docs"
echo "================================================="
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
