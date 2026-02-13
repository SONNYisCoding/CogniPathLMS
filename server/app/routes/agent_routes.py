from flask import Blueprint, request, jsonify
from app.services.gemini_service import generate_path, chat

agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/generate-path', methods=['POST'])
def generate_path_route():
    # Handle both JSON and FormData
    if request.is_json:
        data = request.json
        files = None
    else:
        # FormData
        data = request.form
        files = request.files.getlist('files')

    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    result = generate_path(data, files)
    return jsonify(result)

@agent_bp.route('/chat', methods=['POST'])
def chat_route():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    history = data.get('history', [])
    message = data.get('message')
    context = data.get('context', {}) # hierarchy context
    
    response_text = chat(history, message, context)
    return jsonify({"role": "model", "text": response_text})

@agent_bp.route('/generate-lesson', methods=['POST'])
def generate_lesson_route():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    topic = data.get('topic')
    description = data.get('description')
    user_goal = data.get('userGoal')
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
        
    from app.services.gemini_service import generate_lesson_content
    content = generate_lesson_content(topic, description, user_goal)
    
    return jsonify({"content": content})

@agent_bp.route('/paths/<path_id>', methods=['DELETE'])
def delete_path_route(path_id):
    try:
        from app.firebase_setup import db
        import logging
        
        if db is None:
            print("Error: Firestore database not initialized (Backend).")
            return jsonify({"error": "Backend database not connected. Please check server logs."}), 503
        
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({"error": "userId is required"}), 400

        # Start a batch
        batch = db.batch()
        
        # 1. Path Reference
        path_ref = db.collection('users').document(user_id).collection('paths').document(path_id)
        
        # 2. Delete Subcollections (Modules & Messages) - Firestore requires manual deletion of subcollections
        # Note: This is a simplified approach. For large collections, use a recursive delete function.
        # Checking modules
        modules_ref = path_ref.collection('modules')
        modules = modules_ref.limit(50).stream()
        for module in modules:
            # Delete messages within module
            messages_ref = module.reference.collection('messages')
            messages = messages_ref.limit(50).stream()
            for msg in messages:
                batch.delete(msg.reference)
            batch.delete(module.reference)
            
        # Delete path-level messages
        path_messages_ref = path_ref.collection('messages')
        path_msgs = path_messages_ref.limit(50).stream()
        for msg in path_msgs:
            batch.delete(msg.reference)

        # 3. Delete Path Document
        batch.delete(path_ref)
        
        batch.commit()
        
        return jsonify({"message": "Path deleted successfully"})
    except Exception as e:
        print(f"Error deleting path: {e}")
        return jsonify({"error": str(e)}), 500

@agent_bp.route('/modules/<module_id>/regenerate', methods=['POST'])
def regenerate_lesson_endpoint(module_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    topic = data.get('topic')
    description = data.get('description')
    user_goal = data.get('userGoal')
    feedback = data.get('feedback', []) # Listen to feedback array
    path_id = data.get('pathId')
    user_id = data.get('userId')
    
    if not topic or not path_id or not user_id:
        return jsonify({"error": "Missing required fields"}), 400
        
    try:
        from app.services.gemini_service import generate_lesson_content
        from app.firebase_setup import db
        
        if db is None:
            return jsonify({"error": "Backend database not connected."}), 503
        
        # 1. Delete Chat History for this module
        messages_ref = db.collection('users').document(user_id).collection('paths').document(path_id).collection('modules').document(module_id).collection('messages')
        messages = messages_ref.limit(100).stream()
        for msg in messages:
            msg.reference.delete()
            
        # 2. Regenerate Content
        content = generate_lesson_content(topic, description, user_goal, feedback)
        
        return jsonify({"content": content})
    except Exception as e:
        print(f"Error regenerating lesson: {e}")
        return jsonify({"error": str(e)}), 500
