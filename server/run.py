from flask import Flask
from flask_cors import CORS
from app.routes.agent_routes import agent_bp
import os

app = Flask(__name__)

# Enable CORS for all routes
# CORS(app)

# Chỉ cho phép domain Firebase của bạn để tăng tính bảo mật
# Thay 'https://cognipath-xxx.web.app' bằng URL Firebase thật của bạn
CORS(app, origins=["https://cognipath-c16ea.web.app", "http://localhost:5173"])

app.register_blueprint(agent_bp, url_prefix='/api')

if __name__ == '__main__':
    # Lấy cổng từ biến môi trường của local, mặc định là 5000
    # port = int(os.environ.get('PORT', 5000))

    # Cloud Run sẽ tự động truyền biến PORT, mặc định là 8080
    port = int(os.environ.get("PORT", 8080))

    # Tắt debug=True để đảm bảo hiệu suất và bảo mật trên môi trường Live
    # app.run(debug=True, host='0.0.0.0', port=port)
    app.run(debug=False, host='0.0.0.0', port=port)
