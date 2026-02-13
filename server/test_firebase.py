try:
    from app.firebase_setup import db
    print("Attempting to connect to Firestore...")
    
    # Try a simple read
    docs = db.collection('test').limit(1).stream()
    print("Connection successful! Streamed docs.")
    for doc in docs:
        print(f"Doc ID: {doc.id}")

except Exception as e:
    print(f"FATAL ERROR: Failed to connect to Firestore. {e}")
