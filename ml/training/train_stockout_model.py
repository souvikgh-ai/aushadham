"""
Aushadham ML Training Pipeline: Stockout Prediction
Trains regression & classification models to forecast days until stockout and risk tiers.
Tiers:
- Critical: <= 2 days
- High: 3 - 7 days
- Moderate: 8 - 14 days
- Healthy: > 14 days
"""

import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, mean_squared_error, classification_report, accuracy_score

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    "closing_stock", "days_of_supply", "lag_1", "lag_7",
    "rolling_mean_7", "rolling_std_7", "rolling_mean_14", "rolling_mean_30",
    "velocity_ratio", "supplier_lead_time", "safety_stock", "day_of_week", "month"
]

def train_stockout_models():
    train_df = pd.read_csv(os.path.join(DATA_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(DATA_DIR, "val.csv"))
    test_df = pd.read_csv(os.path.join(DATA_DIR, "test.csv"))

    X_train = train_df[FEATURE_COLS].values
    X_val = val_df[FEATURE_COLS].values
    X_test = test_df[FEATURE_COLS].values

    y_days_train = train_df["target_stockout_days"].values
    y_days_val = val_df["target_stockout_days"].values
    y_days_test = test_df["target_stockout_days"].values

    y_risk_train = train_df["target_stockout_risk"].values
    y_risk_val = val_df["target_stockout_risk"].values
    y_risk_test = test_df["target_stockout_risk"].values

    # 1. Regressor for estimated days until stockout
    print("\n--- Training Days to Stockout Regressor ---")
    regressor = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    regressor.fit(X_train, y_days_train)

    val_days_pred = regressor.predict(X_val)
    reg_val_mae = mean_absolute_error(y_days_val, val_days_pred)
    reg_val_rmse = np.sqrt(mean_squared_error(y_days_val, val_days_pred))
    print(f"Validation Days to Stockout MAE: {reg_val_mae:.2f} days, RMSE: {reg_val_rmse:.2f} days")

    test_days_pred = regressor.predict(X_test)
    reg_test_mae = mean_absolute_error(y_days_test, test_days_pred)
    reg_test_rmse = np.sqrt(mean_squared_error(y_days_test, test_days_pred))
    print(f"Test Days to Stockout MAE: {reg_test_mae:.2f} days, RMSE: {reg_test_rmse:.2f} days")

    # 2. Classifier for Stockout Risk Tier
    print("\n--- Training Stockout Risk Classifier ---")
    classifier = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    classifier.fit(X_train, y_risk_train)

    val_risk_pred = classifier.predict(X_val)
    val_acc = accuracy_score(y_risk_val, val_risk_pred)
    print(f"Validation Risk Tier Accuracy: {val_acc*100:.2f}%")

    test_risk_pred = classifier.predict(X_test)
    test_acc = accuracy_score(y_risk_test, test_risk_pred)
    print(f"Test Risk Tier Accuracy: {test_acc*100:.2f}%")

    report_dict = classification_report(
        y_risk_test, 
        test_risk_pred, 
        target_names=["Healthy (>14d)", "Moderate (8-14d)", "High (3-7d)", "Critical (<=2d)"],
        output_dict=True
    )

    # Save artifacts
    artifacts = {
        "regressor": regressor,
        "classifier": classifier,
        "feature_cols": FEATURE_COLS
    }
    artifact_path = os.path.join(MODELS_DIR, "stockout_prediction_model.joblib")
    joblib.dump(artifacts, artifact_path)
    print(f"Saved stockout model artifacts to {artifact_path}")

    meta = {
        "model_name": "Aushadham Stockout Prediction Engine",
        "algorithm": "RandomForestRegressor + Classifier",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "features": FEATURE_COLS,
        "days_regressor_test_mae": round(float(reg_test_mae), 2),
        "days_regressor_test_rmse": round(float(reg_test_rmse), 2),
        "risk_classifier_test_accuracy": round(float(test_acc), 4),
        "risk_classification_report": report_dict,
        "risk_tiers": {
            3: "Critical: likely stockout within 2 days",
            2: "High: likely stockout within 7 days",
            1: "Moderate: likely stockout within 14 days",
            0: "Healthy: sufficient inventory"
        }
    }

    meta_path = os.path.join(MODELS_DIR, "stockout_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print("Stockout model training & serialization completed successfully.")

if __name__ == "__main__":
    train_stockout_models()
