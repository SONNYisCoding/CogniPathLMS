@echo off
echo Starting CogniPath AI Tutor...

start "CogniPath Backend" cmd /k "cd server && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python run.py"
start "CogniPath Frontend" cmd /k "cd client && npm install && npm run dev"

echo Servers starting in separate windows...
