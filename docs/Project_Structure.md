# Project Structure - CogniPath LMS

This document provides a detailed map of the project's directory structure and the specific roles of each directory/file.

---

## 1. Global Overview
```text
cognipath_lms/
├── client/                 # React Frontend (Vite)
├── server/                 # Flask Backend (Python)
├── docs/                   # "Kim Chỉ Nam" Documentation
├── firebase.json           # Firebase Hosting/Storage configuration
├── firestore.rules         # Security rules for Firestore
├── .firebaserc             # Firebase project alias
└── README.md               # Quick start guide
```

---

## 2. Frontend Structure (`client/src/`)
**Technology Stack:** React, TailwindCSS, Lucide Icons, Framer Motion.

```text
client/src/
├── api/
│   └── axiosClient.ts      # Configured Axios instance for Backend communication
├── components/             # Reusable UI components
│   ├── dashboard/          # Course cards, list views
│   ├── layout/             # Sidebar, Navbar, Page wrappers
│   ├── tutor/              # Chat interface, message bubbles
│   └── ui/                 # Atomic components (Buttons, Modals, Inputs)
├── config/                 # App-wide configurations
├── context/
│   └── AuthContext.tsx     # Firebase Auth state management
├── hooks/                  # Custom hooks (Business Logic)
│   ├── useGemini.ts        # AI interactions & Firestore CRUD
│   └── useUpload.ts        # File upload logic (Simulation/Firebase)
├── pages/                  # Page-level components
│   ├── Dashboard.tsx       # Main user portal
│   ├── Landing.tsx         # Home/Sign-in page
│   ├── LearningWorkspace.tsx # Multi-pane AI learning environment
│   └── Profile.tsx         # User settings
├── types/                  # TypeScript Interfaces
│   ├── gemini.ts           # AI & Course-related models
│   └── models.ts           # User & Profile-related models
├── firebase.ts             # Client-side Firebase initialization
├── App.tsx                 # Main routing and provider setup
└── main.tsx                # Entry point
```

---

## 3. Backend Structure (`server/`)
**Technology Stack:** Flask, Google Generative AI SDK, Firebase Admin SDK.

```text
server/
├── app/
│   ├── prompts/
│   │   └── system_prompts.py # AI System Instructions (Socratic, Generator)
│   ├── routes/
│   │   └── agent_routes.py   # API Endpoints (Path Gen, Chat, Lessons)
│   ├── services/
│   │   └── gemini_service.py # Core AI logic & context processing
│   ├── firebase_setup.py     # Admin SDK & Firestore initialization
│   └── __init__.py           # Package setup
├── run.py                    # Server entry point (Flask Runner)
├── requirements.txt          # Python dependencies
└── Dockerfile                # Production container configuration
```

---

## 4. Documentation (`docs/`)
The "Kim Chỉ Nam" suite:
- `Workflows_Master.md`: Detailed business/technical logic.
- `Schema_Dictionary.md`: Data models & naming standards.
- `Project_Structure.md`: This file (Project map).
- `User_Guide.md`: End-user manual.
