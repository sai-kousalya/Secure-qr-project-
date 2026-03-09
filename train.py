"""
QR Code Phishing Detection - ML Training Pipeline
Trains SVM and Random Forest models with comprehensive evaluation metrics
"""

import pandas as pd
import numpy as np
import pickle
import sys
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, confusion_matrix, classification_report)

def load_and_prepare_data(dataset_path):
    """
    Load dataset and prepare features and labels
    """
    try:
        print("=" * 70)
        print("1. LOADING DATASET")
        print("=" * 70)
        
        # Load dataset
        df = pd.read_csv(dataset_path)
        print(f"✓ Dataset loaded successfully!")
        print(f"  - Shape: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"  - Column names: {list(df.columns)}")
        
        # Handle missing values
        print(f"\n  - Missing values before handling: {df.isnull().sum().sum()}")
        df = df.dropna()  # Drop rows with missing values
        print(f"  - Missing values after handling: {df.isnull().sum().sum()}")
        print(f"  - Dataset shape after cleaning: {df.shape}")
        
        # Separate features and labels
        # Assuming last column is the label
        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values
        
        print(f"\n✓ Features shape: {X.shape}")
        print(f"✓ Labels shape: {y.shape}")
        print(f"✓ Label distribution: {np.unique(y, return_counts=True)}")
        
        return X, y
    
    except Exception as e:
        print(f"✗ Error loading data: {str(e)}")
        sys.exit(1)

def split_data(X, y, test_size=0.2, random_state=42):
    """
    Split data into training and testing sets
    """
    print("\n" + "=" * 70)
    print("2. TRAIN-TEST SPLIT (80-20)")
    print("=" * 70)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    print(f"✓ Training set: {X_train.shape[0]} samples ({(1-test_size)*100:.0f}%)")
    print(f"✓ Testing set: {X_test.shape[0]} samples ({test_size*100:.0f}%)")
    print(f"✓ Training labels distribution: {np.unique(y_train, return_counts=True)}")
    print(f"✓ Testing labels distribution: {np.unique(y_test, return_counts=True)}")
    
    return X_train, X_test, y_train, y_test

def scale_features(X_train, X_test):
    """
    Apply feature scaling using StandardScaler
    """
    print("\n" + "=" * 70)
    print("3. FEATURE SCALING (StandardScaler)")
    print("=" * 70)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"✓ Scaler fitted on training data")
    print(f"  - Mean: {scaler.mean_[:5]}... (first 5 features)")
    print(f"  - Std: {scaler.scale_[:5]}... (first 5 features)")
    print(f"✓ Scaling applied to both train and test sets")
    
    return X_train_scaled, X_test_scaled, scaler

def train_svm(X_train, y_train):
    """
    Train Support Vector Machine with RBF kernel
    """
    print("\n" + "=" * 70)
    print("4. TRAINING SVM (Support Vector Machine)")
    print("=" * 70)
    
    print("  - Kernel: rbf")
    print("  - Probability: True")
    
    svm_model = SVC(kernel='rbf', probability=True, random_state=42, verbose=0)
    svm_model.fit(X_train, y_train)
    
    print(f"✓ SVM model trained successfully!")
    print(f"  - Number of support vectors: {len(svm_model.support_vectors_)}")
    
    return svm_model

def train_random_forest(X_train, y_train):
    """
    Train Random Forest Classifier
    """
    print("\n" + "=" * 70)
    print("5. TRAINING RANDOM FOREST")
    print("=" * 70)
    
    print("  - Estimators: 100")
    print("  - Random state: 42 (for reproducibility)")
    
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    
    print(f"✓ Random Forest model trained successfully!")
    print(f"  - Number of features: {rf_model.n_features_in_}")
    print(f"  - Feature importances (top 5): {np.argsort(rf_model.feature_importances_)[-5:]}")
    
    return rf_model

def evaluate_model(model, X_train, X_test, y_train, y_test, model_name):
    """
    Evaluate model on both training and testing sets
    """
    # Training predictions
    y_train_pred = model.predict(X_train)
    
    # Testing predictions
    y_test_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        'accuracy': accuracy_score(y_test, y_test_pred),
        'precision': precision_score(y_test, y_test_pred, average='weighted', zero_division=0),
        'recall': recall_score(y_test, y_test_pred, average='weighted', zero_division=0),
        'f1_score': f1_score(y_test, y_test_pred, average='weighted', zero_division=0),
        'confusion_matrix': confusion_matrix(y_test, y_test_pred),
        'classification_report': classification_report(y_test, y_test_pred, zero_division=0),
        'train_accuracy': accuracy_score(y_train, y_train_pred)
    }
    
    return metrics

def display_metrics(metrics, model_name):
    """
    Display evaluation metrics for a model
    """
    print("\n" + "=" * 70)
    print(f"6. EVALUATION METRICS - {model_name}")
    print("=" * 70)
    
    print(f"\nTest Set Performance:")
    print(f"  - Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  - Precision: {metrics['precision']:.4f}")
    print(f"  - Recall:    {metrics['recall']:.4f}")
    print(f"  - F1-Score:  {metrics['f1_score']:.4f}")
    
    print(f"\nTraining Accuracy: {metrics['train_accuracy']:.4f}")
    
    print(f"\nConfusion Matrix:")
    print(metrics['confusion_matrix'])
    
    print(f"\nClassification Report:")
    print(metrics['classification_report'])

def select_best_model(svm_metrics, rf_metrics):
    """
    Select the best model based on accuracy and F1-score
    """
    print("\n" + "=" * 70)
    print("7. MODEL COMPARISON & SELECTION")
    print("=" * 70)
    
    print(f"\nSVM:")
    print(f"  - Accuracy:  {svm_metrics['accuracy']:.4f}")
    print(f"  - F1-Score:  {svm_metrics['f1_score']:.4f}")
    
    print(f"\nRandom Forest:")
    print(f"  - Accuracy:  {rf_metrics['accuracy']:.4f}")
    print(f"  - F1-Score:  {rf_metrics['f1_score']:.4f}")
    
    # Select based on F1-score (balanced metric)
    if rf_metrics['f1_score'] >= svm_metrics['f1_score']:
        best_model_name = "Random Forest"
        best_metrics = rf_metrics
        print(f"\n✓ Best Model Selected: {best_model_name}")
        print(f"  (Based on F1-Score: {rf_metrics['f1_score']:.4f} vs {svm_metrics['f1_score']:.4f})")
        return best_model_name, best_metrics
    else:
        best_model_name = "SVM"
        best_metrics = svm_metrics
        print(f"\n✓ Best Model Selected: {best_model_name}")
        print(f"  (Based on F1-Score: {svm_metrics['f1_score']:.4f} vs {rf_metrics['f1_score']:.4f})")
        return best_model_name, best_metrics

def save_models(best_model, scaler, model_path='best_model.pkl', scaler_path='scaler.pkl'):
    """
    Save the best trained model and scaler
    """
    print("\n" + "=" * 70)
    print("8. SAVING MODELS")
    print("=" * 70)
    
    try:
        # Save the best model
        with open(model_path, 'wb') as f:
            pickle.dump(best_model, f)
        print(f"✓ Best model saved: {model_path}")
        
        # Save the scaler
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        print(f"✓ Scaler saved: {scaler_path}")
        
    except Exception as e:
        print(f"✗ Error saving models: {str(e)}")
        sys.exit(1)

def main():
    """
    Main training pipeline
    """
    print("\n")
    print("*" * 70)
    print("QR CODE PHISHING DETECTION - ML BACKEND")
    print("Training Pipeline with SVM & Random Forest")
    print("*" * 70)
    
    # Step 1: Load and prepare data
    X, y = load_and_prepare_data('dataset.csv')
    
    # Step 2: Split data
    X_train, X_test, y_train, y_test = split_data(X, y)
    
    # Step 3: Scale features
    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)
    
    # Step 4: Train SVM
    svm_model = train_svm(X_train_scaled, y_train)
    svm_metrics = evaluate_model(svm_model, X_train_scaled, X_test_scaled, y_train, y_test, "SVM")
    display_metrics(svm_metrics, "SVM")
    
    # Step 5: Train Random Forest
    rf_model = train_random_forest(X_train_scaled, y_train)
    rf_metrics = evaluate_model(rf_model, X_train_scaled, X_test_scaled, y_train, y_test, "Random Forest")
    display_metrics(rf_metrics, "Random Forest")
    
    # Step 6: Select best model
    best_model_name, best_metrics = select_best_model(svm_metrics, rf_metrics)
    best_model = svm_model if best_model_name == "SVM" else rf_model
    
    # Step 7: Save models
    save_models(best_model, scaler)
    
    print("\n" + "=" * 70)
    print("✓ TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print(f"\nNext steps:")
    print(f"1. Use predict.py to make predictions")
    print(f"2. Best model: {best_model_name}")
    print(f"3. Final Test Accuracy: {best_metrics['accuracy']:.4f}")
    print(f"4. Final F1-Score: {best_metrics['f1_score']:.4f}\n")

if __name__ == "__main__":
    main()
