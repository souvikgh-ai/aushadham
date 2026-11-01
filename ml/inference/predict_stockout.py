"""
Aushadham ML Inference Engine: Stockout Prediction
Forecasts estimated days until stockout and risk tier (Critical, High, Moderate, Healthy).
"""

import os
import json
import numpy as np
import joblib

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

TIER_LABELS = {
    3: {"code": "CRITICAL", "label": "Critical", "description": "Likely stockout within 2 days", "color": "red"},
    2: {"code": "HIGH", "label": "High", "description": "Likely stockout within 7 days", "color": "orange"},
    1: {"code": "MODERATE", "label": "Moderate", "description": "Likely stockout within 14 days", "color": "amber"},
    0: {"code": "HEALTHY", "label": "Healthy", "description": "Sufficient inventory based on forecast", "color": "emerald"},
}

class StockoutPredictor:
    def __init__(self):
        artifact_path = os.path.join(MODELS_DIR, "stockout_prediction_model.joblib")
        meta_path = os.path.join(MODELS_DIR, "stockout_model_meta.json")

        if not os.path.exists(artifact_path):
            raise FileNotFoundError(f"Model not found at {artifact_path}. Train the model first.")

        artifacts = joblib.load(artifact_path)
        self.regressor = artifacts["regressor"]
        self.classifier = artifacts["classifier"]
        self.feature_cols = artifacts["feature_cols"]

        with open(meta_path) as f:
            self.metadata = json.load(f)

    def predict(self, feature_dict: dict) -> dict:
        row = [float(feature_dict.get(col, 0.0)) for col in self.feature_cols]
        X = np.array([row])

        days_pred = float(np.clip(self.regressor.predict(X)[0], 0, 90))
        tier_code = int(self.classifier.predict(X)[0])
        tier_info = TIER_LABELS.get(tier_code, TIER_LABELS[0])

        return {
            "estimated_days_to_stockout": round(days_pred, 1),
            "risk_tier": tier_info["code"],
            "risk_label": tier_info["label"],
            "description": tier_info["description"],
            "color": tier_info["color"],
            "is_critical": (tier_code == 3),
            "algorithm": "RandomForest",
            "inference_mode": "trained_ml_model"
        }

if __name__ == "__main__":
    predictor = StockoutPredictor()
    sample = {
        "closing_stock": 14, "days_of_supply": 1.2, "lag_1": 12, "lag_7": 10,
        "rolling_mean_7": 11.5, "rolling_std_7": 1.5, "rolling_mean_14": 10.0, "rolling_mean_30": 9.5,
        "velocity_ratio": 1.21, "supplier_lead_time": 4, "safety_stock": 20, "day_of_week": 3, "month": 11
    }
    print("Stockout Prediction Result:", predictor.predict(sample))
