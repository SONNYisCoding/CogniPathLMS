from flask import Flask
from flask_cors import CORS
from app.routes.agent_routes import agent_bp
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

app.register_blueprint(agent_bp, url_prefix='/api')

if __name__ == '__main__':
    # Lấy cổng từ biến môi trường của local, mặc định là 5000
    port = int(os.environ.get('PORT', 5000))
    # Lấy cổng từ biến môi trường của Cloud Run, mặc định là 8080
    #port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host='0.0.0.0', port=port)
    # app.run(debug=ture, host='0.0.0.0', port=port)
