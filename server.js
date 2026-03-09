import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const FLASK_API_URL = 'http://localhost:5000';

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

/**
 * URL Feature Extraction
 * Extract suspicious features from URL
 */
function extractUrlFeatures(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const protocol = urlObj.protocol;
    const search = urlObj.search;

    // Basic feature extraction
    const features = [];

    // Feature 1: URL length
    features.push(url.length);

    // Feature 2: Domain length
    features.push(hostname.length);

    // Feature 3: Has port
    features.push(urlObj.port ? 1 : 0);

    // Feature 4: Uses HTTPS
    features.push(protocol === 'https:' ? 1 : 0);

    // Feature 5: Has query parameters
    features.push(search.length > 0 ? 1 : 0);

    // Feature 6: Number of dots in domain
    features.push((hostname.match(/\./g) || []).length);

    // Feature 7: Has hyphen in domain (common in phishing)
    features.push((hostname.match(/-/g) || []).length);

    // Feature 8: Path length
    features.push(pathname.length);

    // Feature 9: Number of slashes
    features.push((pathname.match(/\//g) || []).length);

    // Feature 10: Has suspicious keywords
    const suspiciousWords = ['verify', 'confirm', 'signin', 'login', 'update', 'account', 'security'];
    let suspiciousCount = 0;
    suspiciousWords.forEach(word => {
      if (url.toLowerCase().includes(word)) suspiciousCount++;
    });
    features.push(suspiciousCount);

    return features;
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Node Backend' });
});

/**
 * Scan URL endpoint
 * POST /scan-url
 * Receives URL, extracts features, calls Flask API, returns result
 */
app.post('/scan-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL in request body'
      });
    }

    // Extract features from URL
    let features;
    try {
      features = extractUrlFeatures(url);
    } catch (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Call Flask ML API
    let mlResponse;
    try {
      mlResponse = await axios.post(`${FLASK_API_URL}/predict`, {
        features: features
      }, {
        timeout: 10000
      });
    } catch (error) {
      console.error('Flask API error:', error.message);
      return res.status(503).json({
        error: 'ML API unavailable. Make sure Flask server is running on port 5000.'
      });
    }

    // Extract prediction and confidence
    const { prediction, confidence } = mlResponse.data;

    // Determine status color and message
    const threshold = 0.7;
    let status;
    if (prediction === 'Phishing') {
      status = confidence > threshold ? 'DANGER' : 'WARNING';
    } else {
      status = 'SAFE';
    }

    // Return result
    return res.status(200).json({
      url: url,
      prediction: prediction,
      confidence: confidence,
      status: status,
      features_count: features.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scan URL error:', error);
    return res.status(500).json({
      error: 'Internal server error during URL scanning'
    });
  }
});

/**
 * Model Metrics endpoint
 * GET /model-metrics
 * Returns evaluation metrics from metrics.json
 */
app.get('/model-metrics', (req, res) => {
  try {
    const metricsPath = path.join(__dirname, 'backend', 'ml', 'metrics.json');
    const metricsData = fs.readFileSync(metricsPath, 'utf8');
    const metrics = JSON.parse(metricsData);

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Load metrics error:', error);
    return res.status(500).json({
      error: 'Could not load metrics'
    });
  }
});

/**
 * Flask ML API Health Check
 * GET /ml-api-status
 */
app.get('/ml-api-status', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`, {
      timeout: 5000
    });
    return res.status(200).json({
      status: 'ok',
      ml_api: response.data
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      message: 'Flask ML API is not responding'
    });
  }
});

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Node.js Backend Server Started       ║
║   http://localhost:${PORT}                  ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log(`  POST   /scan-url          - Scan URL for phishing`);
  console.log(`  GET    /model-metrics     - Get model evaluation metrics`);
  console.log(`  GET    /ml-api-status     - Check Flask ML API status`);
  console.log(`  GET    /health            - Health check`);
});
