"""
Aushadham ML Training Pipeline: Inventory & Demand Anomaly Detection
Trains an unsupervised IsolationForest model to flag:
- Unusual demand spikes
- Abnormal demand drops
- Discrepancies between historical velocity and current transactions
"""

import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

ANOMALY_FEATURE_COLS = [
    "units_sold", "rolling_mean_7", "rolling_std_7", "rolling_mean_30",
    "velocity_ratio", "closing_stock", "days_of_supply"
]

def train_anomaly_detector():
    train_df = pd.read_csv(os.path.join(DATA_DIR, "train.csv"))
    test_df = pd.read_csv(os.path.join(DATA_DIR, "test.csv"))

    X_train = train_df[ANOMALY_FEATURE_COLS].values
    X_test = test_df[ANOMALY_FEATURE_COLS].values

    print("\n--- Training Isolation Forest for Inventory Anomalies ---")
    # Setting contamination to ~4% to match realistic pharmacy anomaly rates
    iso_forest = IsolationForest(
        n_estimators=100, 
        contamination=0.04, 
        random_state=42, 
        n_jobs=-1
    )
    iso_forest.fit(X_train)

    # Anomaly predictions: -1 for anomaly, 1 for normal
    test_preds = iso_forest.predict(X_test)
    test_scores = iso_forest.decision_function(X_test)

    num_anomalies = int(np.sum(test_preds == -1))
    pct_anomalies = round(float(num_anomalies / len(test_preds) * 100), 2)
    print(f"Test Set Anomaly Detections: {num_anomalies}/{len(test_preds)} ({pct_anomalies}%)")

    # Save artifact
    artifact_path = os.path.join(MODELS_DIR, "inventory_anomaly_model.joblib")
    artifacts = {
        "model": iso_forest,
        "feature_cols": ANOMALY_FEATURE_COLS
    }
    joblib.dump(artifacts, artifact_path)
    print(f"Saved anomaly model to {artifact_path}")

    meta = {
        "model_name": "Aushadham Inventory Anomaly Detector",
        "algorithm": "IsolationForest",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "features": ANOMALY_FEATURE_COLS,
        "contamination": 0.04,
        "test_detected_anomalies": num_anomalies,
        "test_anomaly_rate_pct": pct_anomalies
    }

    meta_path = os.path.join(MODELS_DIR, "anomaly_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print("Anomaly detector trained and serialized successfully.")

if __name__ == "__main__":
    train_anomaly_detector()
