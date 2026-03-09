# ⚡ Quick Start Guide - 5 Minutes to Phishing Detection

## 🎯 The Fastest Way to Get Running

### Prerequisites
- Python 3.8+
- Node.js 16.0+
- Terminal/Command Prompt

---

## 🚀 Step 1: Install Python Dependencies (30 seconds)

```bash
cd backend/ml
pip install flask flask-cors numpy scikit-learn
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

---

## 🚀 Step 2: Install Node Dependencies (30 seconds)

```bash
# From project root
npm install
```

---

## 🚀 Step 3: Start Flask ML API

**Open Terminal 1 and run:**

```bash
cd backend/ml
python ml_api.py
```

✅ **Success:** You should see:
```
✓ Model and scaler loaded successfully
Starting Flask ML API server on port 5000...
 * Running on http://0.0.0.0:5000
```

---

## 🚀 Step 4: Start Node.js Backend

**Open Terminal 2 and run:**

```bash
node server.js
```

✅ **Success:** You should see:
```
╔════════════════════════════════════════╗
║   Node.js Backend Server Started       ║
║   http://localhost:3000                ║
╚════════════════════════════════════════╝
```

---

## 🚀 Step 5: Open Frontend

**Open your browser and go to:**

```
http://localhost:3000/frontend/
```

---

## 🎮 Now Test It!

### Login
1. Use any username/password (it's localStorage-based)
2. Click "Login" or "Sign Up"

### Scan a URL
1. Enter any URL, e.g., `https://google.com`
2. Click "Scan URL"
3. Wait for result (shows SAFE/SUSPICIOUS/PHISHING)

### View Model Metrics
1. Click "Load Metrics" button
2. See:
   - Accuracy: 97.33%
   - Precision: 97.22%
   - Recall: 97.44%
   - F1 Score: 97.33%
   - Confusion Matrix
   - Algorithm Comparison

---

## 🐛 Troubleshooting (30 seconds)

### "Flask API not responding"
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill existing process (Windows)
taskkill /PID <PID> /F

# Restart Flask
python ml_api.py
```

### "Cannot connect to backend"
```bash
# Make sure Node is running on port 3000
curl http://localhost:3000/health

# Should return: {"status":"ok","service":"Node Backend"}
```

### "Module not found errors"
```bash
# Reinstall all Python dependencies
pip install --upgrade flask flask-cors numpy scikit-learn

# Reinstall Node dependencies
rm -rf node_modules
npm install
```

---

## ✅ Verify Everything Works

### Test 1: Check Flask Health
```bash
curl http://localhost:5000/health
```
Expected response:
```json
{"status":"ok","model_loaded":true,"scaler_loaded":true}
```

### Test 2: Check Node Health
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{"status":"ok","service":"Node Backend"}
```

### Test 3: Scan a URL
```bash
curl -X POST http://localhost:3000/scan-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```
Expected response:
```json
{
  "url": "https://example.com",
  "prediction": "Legitimate",
  "confidence": 0.9850,
  "status": "SAFE",
  "features_count": 10,
  "timestamp": "2026-02-23T10:30:00Z"
}
```

### Test 4: Get Metrics
```bash
curl http://localhost:3000/model-metrics
```
Should return model evaluation metrics.

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/ml/ml_api.py` | Flask ML API (loads model, makes predictions) |
| `backend/ml/best_model.pkl` | Pre-trained Random Forest model |
| `backend/ml/scaler.pkl` | Feature scaler |
| `backend/ml/metrics.json` | Evaluation metrics |
| `server.js` | Node.js Express backend |
| `frontend/index.html` | Web interface |
| `frontend/script.js` | Frontend logic |
| `package.json` | Node dependencies |

---

## 🎓 How It Works (30 seconds)

```
User enters URL
       ↓
Frontend sends to Node backend
       ↓
Node extracts 10 URL features
       ↓
Node sends features to Flask API
       ↓
Flask loads model + scaler
       ↓
Flask predicts: Phishing or Legitimate
       ↓
Flask returns confidence score
       ↓
Node formats response
       ↓
Frontend displays result (colors: Red/Yellow/Green)
```

---

## 🎯 What's Inside

### Flask ML API
- Loads pre-trained Random Forest model
- FastScaler for feature normalization
- Probability predictions with confidence scores
- CORS enabled for cross-origin requests
- Health check endpoint
- Metrics serving endpoint

### Node.js Backend
- Express web server
- URL feature extraction (10 features)
- HTTP calls to Flask API
- JSON API responses
- Metrics.json serving
- Production error handling

### Frontend
- Beautiful responsive UI
- Authentication (localStorage)
- URL input with validation
- Real-time scanning results
- Color-coded threat levels (Green/Yellow/Red)
- Model performance display
- Confusion matrix visualization
- Algorithm comparison table

---

## 💡 URLs to Remember

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000/frontend/ |
| **Node Backend** | http://localhost:3000 |
| **Flask ML API** | http://localhost:5000 |
| **Flask Health** | http://localhost:5000/health |
| **Flask Metrics** | http://localhost:5000/metrics |
| **Node Health** | http://localhost:3000/health |
| **Node Metrics** | http://localhost:3000/model-metrics |

---

## 🎉 That's It!

You now have a complete, production-ready phishing detection system!

**Total setup time: ~5 minutes**
- Install Python deps: 30s
- Install Node deps: 30s
- Start Flask: 10s
- Start Node: 10s
- Open browser: 10s
- Test endpoints: 2m 30s

**Next steps:**
1. Try scanning different URLs
2. Check the model metrics
3. Read ML_ALGORITHM_ANALYSIS.md for deep dive
4. Read SETUP_AND_RUN.md for full documentation

Enjoy! 🚀
