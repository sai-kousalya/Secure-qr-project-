/**
 * Frontend Script for Phishing Detection System
 * Handles authentication, URL scanning, and metrics display
 */

const API_BASE_URL = 'http://localhost:3000';
const CONFIDENCE_THRESHOLD = 0.7;

// ============= AUTHENTICATION =============

function switchAuth(mode) {
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.querySelectorAll('.auth-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${mode}-form`).classList.add('active');
    document.querySelector(`[onclick="switchAuth('${mode}')"]`).classList.add('active');
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

    if (!username || !password) {
        errorEl.textContent = 'Please enter username and password';
        return;
    }

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify({
        username: username,
        email: email || '',
        loggedIn: true
    }));

    showDashboard(username);
}

function handleSignup() {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorEl = document.getElementById('signup-error');

    errorEl.textContent = '';

    if (!username || !email || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify({
        username: username,
        email: email,
        loggedIn: true
    }));

    showDashboard(username);
}

function handleLogout() {
    localStorage.removeItem('user');
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
}

function showDashboard(username) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'flex';
    document.getElementById('user-name').textContent = username;
}

// ============= URL SCANNING =============

async function scanUrl() {
    const urlInput = document.getElementById('url-input').value.trim();
    const errorEl = document.getElementById('error-message');
    const resultEl = document.getElementById('result-section');
    const loadingEl = document.getElementById('loading');

    errorEl.style.display = 'none';
    resultEl.style.display = 'none';

    if (!urlInput) {
        showError('Please enter a URL to scan');
        return;
    }

    // Validate URL format
    try {
        new URL(urlInput);
    } catch (error) {
        showError('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    // Show loading
    loadingEl.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/scan-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput })
        });

        loadingEl.style.display = 'none';

        if (!response.ok) {
            const errorData = await response.json();
            showError(errorData.error || 'Scan failed');
            return;
        }

        const result = await response.json();
        displayResult(result);
        resultEl.style.display = 'block';

    } catch (error) {
        loadingEl.style.display = 'none';
        showError('Error connecting to API. Ensure Node.js backend is running on port 3000.');
        console.error('Scan error:', error);
    }
}

function displayResult(result) {
    const resultCard = document.getElementById('result-card');
    const { url, prediction, confidence, status } = result;

    // Determine color and message
    let statusColor = 'safe';
    let statusMessage = '✓ SAFE';
    let statusIcon = '🟢';

    if (prediction === 'Phishing') {
        if (status === 'DANGER') {
            statusColor = 'danger';
            statusMessage = '✗ PHISHING DETECTED';
            statusIcon = '🔴';
        } else {
            statusColor = 'warning';
            statusMessage = '⚠ SUSPICIOUS';
            statusIcon = '🟡';
        }
    }

    // Determine explanation
    let explanation = '';
    if (prediction === 'Phishing') {
        explanation = `This URL shows characteristics of a phishing site with ${Math.round(confidence * 100)}% confidence. Be extremely cautious when clicking this link.`;
    } else {
        explanation = `This URL appears to be legitimate with ${Math.round(confidence * 100)}% confidence. However, always exercise caution when entering sensitive information.`;
    }

    // Create result HTML
    resultCard.innerHTML = `
        <h3>${statusIcon} ${statusMessage}</h3>
        <div class="result-grid">
            <div class="result-item">
                <label>Scanned URL</label>
                <p style="font-size: 14px; word-break: break-all; color: #333;">${escapeHtml(url)}</p>
            </div>
            <div class="result-item">
                <label>Prediction</label>
                <p class="value">${prediction}</p>
            </div>
            <div class="result-item">
                <label>Confidence Score</label>
                <p class="value ${statusColor}">${Math.round(confidence * 100)}%</p>
            </div>
            <div class="result-item">
                <label>Status</label>
                <p class="value ${statusColor}">${statusColor.toUpperCase()}</p>
            </div>
        </div>
        <div class="result-explanation">
            <p><strong>Analysis:</strong> ${explanation}</p>
        </div>
        <div class="result-actions">
            <button onclick="clearScan()">Scan Another URL</button>
            <button onclick="copyToClipboard('${escapeHtml(url)}')">Copy URL</button>
        </div>
    `;

    resultCard.className = `result-card ${statusColor}`;
}

function clearScan() {
    document.getElementById('url-input').value = '';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorEl.style.display = 'block';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('URL copied to clipboard');
    }).catch(() => {
        alert('Failed to copy');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============= METRICS DISPLAY =============

async function loadMetrics() {
    const metricsContainer = document.getElementById('metrics-container');
    const loadingEl = document.getElementById('metrics-loading');

    // Toggle display
    if (metricsContainer.style.display !== 'none') {
        metricsContainer.style.display = 'none';
        return;
    }

    loadingEl.style.display = 'flex';
    metricsContainer.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/model-metrics`);

        if (!response.ok) {
            throw new Error('Failed to load metrics');
        }

        const metrics = await response.json();
        displayMetrics(metrics);
        metricsContainer.style.display = 'block';
        loadingEl.style.display = 'none';

    } catch (error) {
        loadingEl.style.display = 'none';
        alert('Error loading metrics. Ensure Node.js backend is running.');
        console.error('Metrics error:', error);
    }
}

function displayMetrics(metrics) {
    // Update main metrics
    document.getElementById('metric-accuracy').textContent = 
        `${(metrics.accuracy * 100).toFixed(2)}%`;
    document.getElementById('metric-precision').textContent = 
        `${(metrics.precision * 100).toFixed(2)}%`;
    document.getElementById('metric-recall').textContent = 
        `${(metrics.recall * 100).toFixed(2)}%`;
    document.getElementById('metric-f1').textContent = 
        `${(metrics.f1_score * 100).toFixed(2)}%`;

    // Update algorithm info
    document.getElementById('algo-name').textContent = metrics.algorithm;
    document.getElementById('algo-reason').textContent = metrics.selected_model_reason;

    // Update confusion matrix
    const cm = metrics.confusion_matrix;
    document.getElementById('cm-tn').textContent = cm.true_negatives;
    document.getElementById('cm-fp').textContent = cm.false_positives;
    document.getElementById('cm-fn').textContent = cm.false_negatives;
    document.getElementById('cm-tp').textContent = cm.true_positives;

    // Update algorithm comparison
    const comparisonBody = document.getElementById('comparison-body');
    const algoComp = metrics.algorithm_comparison;
    
    const metricsToCompare = ['accuracy', 'precision', 'recall', 'f1_score'];
    const metricLabels = ['Accuracy', 'Precision', 'Recall', 'F1 Score'];

    comparisonBody.innerHTML = metricsToCompare.map((metric, idx) => {
        const svmValue = (algoComp.svm[metric] * 100).toFixed(2);
        const rfValue = (algoComp.random_forest[metric] * 100).toFixed(2);
        const winner = parseFloat(rfValue) > parseFloat(svmValue) ? 
            '<strong>Random Forest</strong>' : 
            parseFloat(svmValue) > parseFloat(rfValue) ? 
            '<strong>SVM</strong>' : 
            'Tie';

        return `
            <tr>
                <td>${metricLabels[idx]}</td>
                <td>${svmValue}%</td>
                <td>${rfValue}%</td>
                <td>${winner}</td>
            </tr>
        `;
    }).join('');
}

// ============= PAGE INITIALIZATION =============

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData.loggedIn) {
                showDashboard(userData.username);
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }

    // Allow Enter key to submit URL
    document.getElementById('url-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            scanUrl();
        }
    });
});
