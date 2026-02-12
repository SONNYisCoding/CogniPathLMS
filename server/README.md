# CogniPath AI Tutor

CogniPath is an adaptive AI tutor that generates personalized learning paths and provides Socratic tutoring using Google Gemini models.

## Tech Stack
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: Python Flask
- **AI**: Google Gemini (1.5 Pro, 1.5 Flash, 3 Deep Think)
- **Database**: Firebase (Configured in code, needs credentials if fully implemented) / In-memory for current demo

## Prerequisites
- Node.js 18+
- Python 3.8+
- Google Cloud API Key with Gemini access

## Setup

1. **Clone the repository** (if you haven't already).

2. **Backend Setup**:
   ```bash
   cd server
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd client
   npm install
   ```

4. **Environment Configuration**:
   - Create a `.env` file in `server/` with your Google API Key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     PORT=5000
     ```

## Running the Application

1. **Start the Backend**:
   ```bash
   cd server
   python run.py
   ```
   The API will start at `http://localhost:5000`.

2. **Start the Frontend**:
   ```bash
   cd client
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Features
- **Learning Path Generation**: Enter your name, goal, and level to get a custom curriculum.
- **Socratic Chat**: Chat with the specific modules to learn effectively.

## Project Structure
- `server/app/services/gemini_service.py`: Core AI logic.
- `client/src/components/features/LearningMap`: Visualization component.
- `client/src/components/features/ChatBot`: Chat component.
