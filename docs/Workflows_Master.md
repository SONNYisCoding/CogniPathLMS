# Workflows Master - CogniPath LMS

This document serves as the "Kim Chỉ Nam" for the business logic and technical workflows of the CogniPath LMS project.

---

## 1. Authentication & User Onboarding
**Goal:** Securely identify the user and persist their profile.

- **Trigger:** User signs in via Google (Firebase Auth).
- **Steps:**
    1.  Frontend receives `UserCredential` from Firebase.
    2.  `AuthContext` updates local state with `UserProfile`.
    3.  System checks if user document exists in `users/{uid}`.
    4.  If new, initialize user record with `displayName`, `email`, and `photoURL`.
- **Primary Files:** `client/src/context/AuthContext.tsx`, `client/src/firebase.ts`.

---

## 2. Learning Path Generation (AI Architecture)
**Goal:** Create a structured curriculum based on user goals and uploaded documents.

- **Trigger:** User submits the "New Course" form.
- **Payload:** `goal`, `level`, and optional `files` (PDF, DOCX, TXT, MD).
- **Steps:**
    1.  **Frontend:** `useGemini.generatePath` bundles data into `FormData`.
    2.  **Backend:** `/generate-path` (Flask) receives the request.
    3.  **AI Processing:**
        - `extract_text_from_file`: Parses content from uploaded files.
        - `generate_path`: Injects text context + user goal into `PATH_GENERATOR_PROMPT`.
        - Gemini returns a structured JSON (Learning Path).
    4.  **Persistence:**
        - Frontend receives the JSON.
        - `savePathToFirestore` creates a new document in `users/{uid}/paths/`.
- **Primary Files:** `client/src/hooks/useGemini.ts`, `server/app/services/gemini_service.py`.

---

## 3. Lesson Content Generation
**Goal:** Generate detailed markdown lessons for specific modules.

- **Trigger:** User clicks on a module in the Learning Path.
- **Steps:**
    1.  System checks if module content already exists in Firestore.
    2.  If not:
        - **Frontend:** Calls `generateLesson(topic, description, userGoal)`.
        - **Backend:** `/generate-lesson` triggers Gemini with `LESSON_GENERATOR_PROMPT`.
        - Gemini returns full markdown content.
        - **Frontend:** `saveModule` persists the content to `users/{uid}/paths/{pathId}/modules/{moduleId}`.
- **Primary Files:** `client/src/hooks/useGemini.ts`, `server/app/services/gemini_service.py`.

---

## 4. Hierarchical AI Tutor (Chat)
**Goal:** Provide an interactive tutor that knows the specific context of the current lesson and the overall course.

- **Trigger:** User sends a message in the chat pane.
- **Context Injection:**
    - Current module markdown content.
    - Overall learning path syllabus.
    - Chat history (retrieved from Firestore).
- **Steps:**
    1.  **Frontend:** `contextChat` sends message + history + context to Backend.
    2.  **Backend:** `/chat` endpoint calls Gemini with `HIERARCHICAL_CHAT_PROMPT`.
    3.  **Persistence:**
        - `saveMessageToFirestore` stores the message in the subcollection (module-level or path-level).
- **Primary Files:** `client/src/hooks/useGemini.ts`, `server/app/routes/agent_routes.py`.

---

## 5. Course & Path Management
**Goal:** Allow users to manage their learning history.

- **Retrieval:** `getUserPaths` fetches all documents from `users/{uid}/paths/` ordered by date.
- **Deletion:**
    - **Frontend:** `deletePath(pathId, userId)`.
    - **Backend:** `/paths/{pathId}` (DELETE) executes a batch delete for the path, modules, and all message subcollections.
- **Regeneration:**
    - User provides feedback.
    - `/modules/{moduleId}/regenerate` clears chat history for that module and regenerates content using feedback.

---

## 6. Future: Persistent Storage Architecture (Phase 2 Evolution)
**Goal:** Move from in-memory parsing to persistent document storage.

- **Planned Change:** Use **Firebase Storage** to store uploaded files.
- **Reasoning:**
    - Enables "Document Library" feature.
    - Reduces re-parsing costs.
    - Allows for future RAG (Retrieval-Augmented Generation) implementations.
- **Implementation Hook:** `client/src/hooks/useUpload.ts` will be updated to handle actual Firebase Storage uploads instead of simulations.
