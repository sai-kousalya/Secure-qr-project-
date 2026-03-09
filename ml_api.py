"""
Flask ML API for Phishing Detection Model
Loads pre-trained model and scaler, provides prediction endpoint
"""

import os
import json
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global model and scaler variables
model = None
scaler = None

def load_model_and_scaler():
    """Load pre-trained model and scaler from disk"""
    global model, scaler
    
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load model
        model_path = os.path.join(script_dir, 'best_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Load scaler
        scaler_path = os.path.join(script_dir, 'scaler.pkl')
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        print("✓ Model and scaler loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error loading model/scaler: {str(e)}")
        return False

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict phishing classification
    
    Request JSON:
    {
        "features": [feature1, feature2, ...]
    }
    
    Response JSON:
    {
        "prediction": "Phishing" or "Legitimate",
        "confidence": probability_score
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({
                "error": "Missing 'features' in request"
            }), 400
        
        features = data['features']
        
        # Validate features
        if not isinstance(features, list) or len(features) == 0:
            return jsonify({
                "error": "Features must be a non-empty list"
            }), 400
        
        # Convert to numpy array
        features_array = np.array(features).reshape(1, -1)
        
        # Scale features
        scaled_features = scaler.transform(features_array)
        
        # Make prediction
        prediction_class = model.predict(scaled_features)[0]
        
        # Get prediction probability
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(scaled_features)[0]
            confidence = float(max(probabilities))
        else:
            # For models without predict_proba (e.g., some SVM), use decision function
            confidence = abs(model.decision_function(scaled_features)[0])
            confidence = 1 / (1 + np.exp(-confidence))  # Sigmoid normalization
        
        # Map prediction class to label
        prediction_label = "Phishing" if prediction_class == 1 else "Legitimate"
        
        return jsonify({
            "prediction": prediction_label,
            "confidence": round(confidence, 4)
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": f"Prediction error: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    }), 200

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get model evaluation metrics"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        metrics_path = os.path.join(script_dir, 'metrics.json')
        
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({
            "error": f"Could not load metrics: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Load model and scaler on startup
    if load_model_and_scaler():
        print("Starting Flask ML API server on port 5000...")
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        print("Failed to load model. Exiting.")
        exit(1)
