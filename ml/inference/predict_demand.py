"""
Aushadham ML Inference Engine: Demand Forecasting
Provides programmatic API to run real-time demand inference on live inputs.
"""

import os
import json
import numpy as np
import joblib

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

class DemandPredictor:
    def __init__(self):
        model_path = os.path.join(MODELS_DIR, "demand_forecast_model.joblib")
        meta_path = os.path.join(MODELS_DIR, "demand_model_meta.json")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Train the model first.")

        self.models = joblib.load(model_path)
        with open(meta_path) as f:
            self.metadata = json.load(f)
        self.feature_cols = self.metadata["feature_columns"]

    def predict(self, feature_dict: dict) -> dict:
        """
        Expects feature_dict with keys:
        lag_1, lag_2, lag_3, lag_7, lag_14, rolling_mean_7, rolling_std_7,
        rolling_mean_14, rolling_mean_30, velocity_ratio, closing_stock,
        days_of_supply, supplier_lead_time, safety_stock, day_of_week, month, is_weekend
        """
        # Vectorize features in exact order
        row = [float(feature_dict.get(col, 0.0)) for col in self.feature_cols]
        X = np.array([row])

        pred_7d = float(np.clip(self.models["target_demand_7d"].predict(X)[0], 0, None))
        pred_14d = float(np.clip(self.models["target_demand_14d"].predict(X)[0], 0, None))
        pred_30d = float(np.clip(self.models["target_demand_30d"].predict(X)[0], 0, None))

        return {
            "forecast_7d": round(pred_7d, 1),
            "forecast_14d": round(pred_14d, 1),
            "forecast_30d": round(pred_30d, 1),
            "model_version": self.metadata.get("version", "1.0.0"),
            "algorithm": self.metadata.get("algorithm", "RandomForest"),
            "inference_mode": "trained_ml_model"
        }

if __name__ == "__main__":
    predictor = DemandPredictor()
    sample = {
        "lag_1": 15, "lag_2": 14, "lag_3": 18, "lag_7": 12, "lag_14": 10,
        "rolling_mean_7": 16.0, "rolling_std_7": 2.5, "rolling_mean_14": 14.5, "rolling_mean_30": 13.0,
        "velocity_ratio": 1.23, "closing_stock": 25, "days_of_supply": 1.56,
        "supplier_lead_time": 4, "safety_stock": 20, "day_of_week": 3, "month": 11, "is_weekend": 0
    }
    print("Sample Inference Result:", predictor.predict(sample))
