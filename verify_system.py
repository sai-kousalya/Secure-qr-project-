#!/usr/bin/env python3
"""
System Verification Script
Checks if all required files exist and models are loadable
"""

import os
import sys
import json

print("=" * 60)
print("🔍 PHISHING DETECTION SYSTEM - VERIFICATION")
print("=" * 60)

# Define required files
required_files = {
    "Core Files": [
        "backend/ml/ml_api.py",
        "backend/ml/best_model.pkl",
        "backend/ml/scaler.pkl",
        "backend/ml/metrics.json",
        "backend/ml/requirements.txt",
        "server.js",
        "package.json",
        "frontend/index.html",
        "frontend/style.css",
        "frontend/script.js",
    ],
    "Documentation": [
        "SETUP_AND_RUN.md",
        "ML_ALGORITHM_ANALYSIS.md",
        "QUICK_START.md",
    ]
}

def check_files():
    """Check if all required files exist"""
    print("\n📁 Checking Files...")
    print("-" * 60)
    
    all_exist = True
    for category, files in required_files.items():
        print(f"\n{category}:")
        for file_path in files:
            exists = os.path.exists(file_path)
            status = "✓" if exists else "✗"
            print(f"  {status} {file_path}")
            if not exists:
                all_exist = False
    
    return all_exist

def check_metrics():
    """Check if metrics.json is valid"""
    print("\n\n📊 Checking Metrics...")
    print("-" * 60)
    
    try:
        with open("backend/ml/metrics.json", "r") as f:
            metrics = json.load(f)
        
        print(f"✓ Metrics.json is valid JSON")
        print(f"  Algorithm: {metrics.get('algorithm', 'Unknown')}")
        print(f"  Accuracy: {metrics.get('accuracy', 'N/A')}")
        print(f"  Precision: {metrics.get('precision', 'N/A')}")
        print(f"  Recall: {metrics.get('recall', 'N/A')}")
        print(f"  F1 Score: {metrics.get('f1_score', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"✗ Error reading metrics.json: {e}")
        return False

def check_model_files():
    """Check if model files exist and are readable"""
    print("\n\n🤖 Checking Model Files...")
    print("-" * 60)
    
    success = True
    
    # Check best_model.pkl
    try:
        size = os.path.getsize("backend/ml/best_model.pkl")
        print(f"✓ best_model.pkl exists ({size:,} bytes)")
    except Exception as e:
        print(f"✗ best_model.pkl: {e}")
        success = False
    
    # Check scaler.pkl
    try:
        size = os.path.getsize("backend/ml/scaler.pkl")
        print(f"✓ scaler.pkl exists ({size:,} bytes)")
    except Exception as e:
        print(f"✗ scaler.pkl: {e}")
        success = False
    
    return success

def check_python_packages():
    """Check if required Python packages are installed"""
    print("\n\n🐍 Checking Python Packages...")
    print("-" * 60)
    
    required_packages = ["flask", "flask_cors", "numpy", "sklearn"]
    all_installed = True
    
    for package in required_packages:
        try:
            if package == "sklearn":
                import sklearn
                version = sklearn.__version__
            else:
                mod = __import__(package.replace("_", ""))
                version = getattr(mod, "__version__", "Unknown")
            
            print(f"✓ {package} ({version})")
        except ImportError:
            print(f"✗ {package} (not installed)")
            all_installed = False
    
    if not all_installed:
        print("\n  Run: pip install -r backend/ml/requirements.txt")
    
    return all_installed

def print_summary(all_files, metrics_ok, models_ok, packages_ok):
    """Print verification summary"""
    print("\n\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    
    checks = {
        "Files exist": all_files,
        "Metrics valid": metrics_ok,
        "Model files ready": models_ok,
        "Python packages": packages_ok,
    }
    
    for check, result in checks.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {check}")
    
    all_pass = all(checks.values())
    
    print("\n" + "=" * 60)
    if all_pass:
        print("✅ SYSTEM READY - All checks passed!")
        print("\nNext steps:")
        print("  1. python backend/ml/ml_api.py")
        print("  2. node server.js")
        print("  3. Open http://localhost:3000/frontend/")
    else:
        failed = [k for k, v in checks.items() if not v]
        print(f"❌ ISSUES FOUND - {len(failed)} check(s) failed:")
        for item in failed:
            print(f"   - {item}")
        print("\nSee details above and fix issues before running.")
    
    print("=" * 60)
    return all_pass

if __name__ == "__main__":
    # Run all checks
    all_files = check_files()
    metrics_ok = check_metrics()
    models_ok = check_model_files()
    packages_ok = check_python_packages()
    
    # Print summary
    all_pass = print_summary(all_files, metrics_ok, models_ok, packages_ok)
    
    # Exit with appropriate code
    sys.exit(0 if all_pass else 1)
