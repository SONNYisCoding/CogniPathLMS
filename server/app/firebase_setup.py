import firebase_admin
from firebase_admin import credentials, firestore
import os

def initialize_firebase():
    """
    Initializes Firebase Admin SDK using Application Default Credentials
    or a service account key if provided.
    """
    try:
        # Check if already initialized to avoid errors on re-import
        if not firebase_admin._apps:
            # Use Application Default Credentials (ADC)
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")
        return False
    return True

# Initialize immediately
is_initialized = initialize_firebase()

# Export Firestore client (or None if failed)
db = None
if is_initialized:
    try:
        db = firestore.client()
    except Exception as e:
        print(f"Error creating Firestore client: {e}")
