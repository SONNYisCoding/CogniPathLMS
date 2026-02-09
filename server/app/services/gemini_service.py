import os
import json
from google import genai
from google.genai import types
from app.prompts.system_prompts import SOCRATIC_TUTOR_PROMPT, PATH_GENERATOR_PROMPT
from dotenv import load_dotenv

load_dotenv()

# Configure the client
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

# Model configurations
REASONING_MODEL_NAME = 'gemini-2.5-flash-lite'
CHAT_MODEL_NAME = 'gemini-2.5-flash-lite'

import io
from pypdf import PdfReader
from docx import Document

def extract_text_from_file(file_storage):
    """
    Extracts text from a FileStorage object (PDF or DOCX).
    """
    filename = file_storage.filename.lower()
    text = ""
    
    try:
        if filename.endswith('.pdf'):
            reader = PdfReader(file_storage)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith('.docx'):
            doc = Document(file_storage)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif filename.endswith('.txt') or filename.endswith('.md'):
             # Read as bytes then decode to ensure we handle encoding
            text = file_storage.read().decode('utf-8', errors='ignore')
            # Reset cursor just in case, though usually not needed if read once
            file_storage.seek(0)
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        return f"[Error reading file {filename}]"
        
    return text


def generate_path(profile, files=None):
    """
    Generates a personalized learning path using a reasoning model.
    """
    try:
        # 1. Helper function to extract text (defined above)
        
        # 2. Process files if any
        context_text = ""
        if files:
            context_text = "\n\nCONTEXT FROM UPLOADED FILES:\n"
            for file in files:
                file_text = extract_text_from_file(file)
                # Limit text length per file to avoid context window issues if needed, 
                # but Gemini has a large window so we might be fine for now.
                # Let's truncate reasonably just in case of massive files.
                if len(file_text) > 100000: 
                    file_text = file_text[:100000] + "...[truncated]"
                
                context_text += f"\n--- Start of {file.filename} ---\n{file_text}\n--- End of {file.filename} ---\n"

        # 3. Construct the user prompt
        user_prompt = f"""
        Create a learning path for:
        Student Name: {profile.get('name', 'Student')}
        Goal: {profile.get('goal', 'General improvement')}
        Current Level: {profile.get('level', 'Beginner')}
        
        {context_text}
        
        Tailor this specific curriculum to help the user achieve their goal: {profile.get('goal')}.
        Adjust difficulty and module topics accordingly to meet this specific mission.
        If context files are provided, YOU MUST incorporate their content into the learning path modules and topics.
        Refer to specific concepts found in the documents.
        """
        
        response = client.models.generate_content(
            model=REASONING_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=PATH_GENERATOR_PROMPT,
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "studentName": {"type": "STRING"},
                        "title": {"type": "STRING"},
                        "overallGoal": {"type": "STRING"},
                        "estimatedCompletionWeeks": {"type": "INTEGER"},
                        "modules": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "id": {"type": "STRING"},
                                    "title": {"type": "STRING"},
                                    "duration": {"type": "STRING"},
                                    "difficulty": {"type": "STRING"},
                                    "topics": {"type": "ARRAY", "items": {"type": "STRING"}},
                                    "description": {"type": "STRING"}
                                },
                                "required": ["id", "title", "duration", "difficulty", "topics", "description"]
                            }
                        }
                    },
                    "required": ["studentName", "title", "overallGoal", "estimatedCompletionWeeks", "modules"]
                }
            )
        )
        
        try:
            # Only try to load if it's a string, otherwise it might be a dict already if the SDK handles it
            if isinstance(response.text, str):
                return json.loads(response.text)
            return response.parsed
        except Exception as e:
            # Fallback for raw text parsing if schema fails or SDK differs
            text_response = response.text

            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0].strip()
            return json.loads(text_response)

    except Exception as e:
        print(f"Error generating path: {e}")
        return {"error": str(e)}

    except Exception as e:
        print(f"Error generating path: {e}")
        return {"error": str(e)}

def generate_lesson_content(topic, description, user_goal):
    """
    Generates detailed markdown lesson content using Gemini 1.5 Pro.
    """
    try:
        from app.prompts.system_prompts import LESSON_GENERATOR_PROMPT
        
        prompt = f"""
        Topic: {topic}
        Description: {description}
        User Context/Goal: {user_goal}
        
        Write the full lesson content now.
        """
        
        # Use a model with good reasoning/writing capabilities
        model_name = REASONING_MODEL_NAME
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=LESSON_GENERATOR_PROMPT,
                temperature=0.7 
            )
        )
        
        return response.text
    except Exception as e:
        print(f"Error generating lesson: {e}")
        return f"# Error Generating Lesson\n\nSorry, we encountered an error: {str(e)}"

def chat(history, message, context_data=None):
    """
    Continues a chat conversation with hierarchical context.
    history: List of previous messages
    message: Current user message
    context_data: Dict containing 'moduleContent', 'pathSyllabus', etc.
    """
    try:
        from app.prompts.system_prompts import HIERARCHICAL_CHAT_PROMPT
        
        # Construct system instruction with injected context
        system_instruction = HIERARCHICAL_CHAT_PROMPT
        
        if context_data:
            if context_data.get('moduleContent'):
                system_instruction += f"\n\n--- CURRENT MODULE CONTENT ---\n{context_data['moduleContent'][:20000]}..." # Truncate if too huge
            if context_data.get('pathSyllabus'):
                system_instruction += f"\n\n--- PATH SYLLABUS ---\n{context_data['pathSyllabus']}"
        
        # Convert history
        gemini_history = []
        for msg in history:
            role = 'user' if msg['role'] == 'user' else 'model'
            gemini_history.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg['text'])]
            ))
            
        chat_session = client.chats.create(
            model=CHAT_MODEL_NAME, # Flash is good for chat usually
            history=gemini_history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        response = chat_session.send_message(message)
        
        return response.text
    except Exception as e:
        print(f"Error in chat: {e}")
        return f"Error: {str(e)}"
