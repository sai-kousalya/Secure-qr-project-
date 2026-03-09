"""
QR Code Phishing Detection - Prediction Script
Loads trained model and scaler to make predictions
Optimized for Node.js child_process integration
"""

import pickle
import sys
import json
import numpy as np
from pathlib import Path

def load_model_and_scaler():
    """
    Load the saved model and scaler
    """
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent.absolute()
        model_path = script_dir / 'best_model.pkl'
        scaler_path = script_dir / 'scaler.pkl'
        
        # Load model
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Load scaler
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        return model, scaler
    
    except FileNotFoundError as e:
        result = {
            "error": f"Model or scaler file not found: {str(e)}",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    except Exception as e:
        result = {
            "error": f"Error loading model: {str(e)}",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)

def predict(model, scaler, features):
    """
    Make prediction with confidence probability
    """
    try:
        # Convert features to numpy array
        features_array = np.array(features, dtype=float).reshape(1, -1)
        
        # Check feature count
        if features_array.shape[1] != model.n_features_in_:
            result = {
                "error": f"Expected {model.n_features_in_} features, got {features_array.shape[1]}",
                "status": "FAILED"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Apply scaling
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Get confidence (max probability)
        confidence = float(np.max(probabilities))
        
        # Map prediction to label (assuming 0=Legitimate, 1=Phishing)
        # Adjust based on your actual label mapping
        prediction_label = "Phishing" if prediction == 1 else "Legitimate"
        
        result = {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "raw_prediction": int(prediction),
            "probabilities": {
                "class_0": round(float(probabilities[0]), 4),
                "class_1": round(float(probabilities[1]), 4) if len(probabilities) > 1 else None
            },
            "status": "SUCCESS"
        }
        
        return result
    
    except ValueError as e:
        result = {
            "error": f"Invalid feature values: {str(e)}",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    except Exception as e:
        result = {
            "error": f"Prediction error: {str(e)}",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)

def main():
    """
    Main prediction pipeline
    Accepts features as command line arguments
    """
    if len(sys.argv) < 2:
        result = {
            "error": "No features provided. Usage: python predict.py feature1 feature2 ...",
            "status": "FAILED",
            "example": "python predict.py 0.5 1.2 0.3 0.7 ..."
        }
        print(json.dumps(result))
        sys.exit(1)
    
    try:
        # Parse features from command line arguments
        features = [float(arg) for arg in sys.argv[1:]]
        
        # Load model and scaler
        model, scaler = load_model_and_scaler()
        
        # Make prediction
        result = predict(model, scaler, features)
        
        # Print ONLY the result in JSON format (for Node.js compatibility)
        print(json.dumps(result))
        
    except ValueError as e:
        result = {
            "error": f"Invalid feature format: {str(e)}. All features must be numbers.",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    except Exception as e:
        result = {
            "error": f"Unexpected error: {str(e)}",
            "status": "FAILED"
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
