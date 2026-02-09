import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY not found in environment variables.")
    exit(1)

print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")

try:
    client = genai.Client(api_key=api_key)
    print("\nRequesting available models...\n")
    
    # pagination might be needed but usually list returns an iterable handling it
    models = client.models.list() 
    
    found_any = False
    for m in models:
        # Check if the model supports content generation
        if "generateContent" in (m.supported_actions or []):
            print(f"- {m.name} (Display Name: {m.display_name})")
            found_any = True
            
    if not found_any:
        print("No models found that support 'generateContent'.")
        
except Exception as e:
    print(f"\nError listing models: {e}")
