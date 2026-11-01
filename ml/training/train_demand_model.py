"""
Aushadham ML Training Pipeline: Medicine Demand Forecasting
Trains multiple candidate regression models (RandomForest, GradientBoosting)
Evaluates on validation data using MAE, RMSE, and WAPE.
Selects champion model, tests on held-out test split, and exports model artifacts + metadata.
"""

import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    "lag_1", "lag_2", "lag_3", "lag_7", "lag_14",
    "rolling_mean_7", "rolling_std_7", "rolling_mean_14", "rolling_mean_30",
    "velocity_ratio", "closing_stock", "days_of_supply",
    "supplier_lead_time", "safety_stock", "day_of_week", "month", "is_weekend"
]

TARGETS = ["target_demand_7d", "target_demand_14d", "target_demand_30d"]

def compute_wape(y_true, y_pred):
    """Weighted Absolute Percentage Error: sum(|y - y_hat|) / sum(y)"""
    denom = np.sum(y_true)
    if denom == 0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / denom)

def train_and_select():
    train_df = pd.read_csv(os.path.join(DATA_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(DATA_DIR, "val.csv"))
    test_df = pd.read_csv(os.path.join(DATA_DIR, "test.csv"))

    X_train = train_df[FEATURE_COLS].values
    X_val = val_df[FEATURE_COLS].values
    X_test = test_df[FEATURE_COLS].values

    candidate_models = {
        "RandomForest": {
            t: RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
            for t in TARGETS
        },
        "GradientBoosting": {
            t: GradientBoostingRegressor(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42)
            for t in TARGETS
        }
    }

    results = {}

    for model_name, models_dict in candidate_models.items():
        print(f"\n--- Training Candidate: {model_name} ---")
        val_metrics = {}
        fitted_models = {}

        for target in TARGETS:
            y_train = train_df[target].values
            y_val = val_df[target].values

            m = models_dict[target]
            m.fit(X_train, y_train)
            fitted_models[target] = m

            val_preds = m.predict(X_val)
            val_preds = np.clip(val_preds, 0, None)  # demand cannot be negative

            mae = float(mean_absolute_error(y_val, val_preds))
            rmse = float(np.sqrt(mean_squared_error(y_val, val_preds)))
            wape = compute_wape(y_val, val_preds)

            val_metrics[target] = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "wape": round(wape, 4),
                "wape_pct": round(wape * 100, 2)
            }
            print(f"[{target}] MAE: {mae:.2f}, RMSE: {rmse:.2f}, WAPE: {wape*100:.2f}%")

        # Average WAPE across horizons
        avg_wape = np.mean([val_metrics[t]["wape"] for t in TARGETS])
        results[model_name] = {
            "models": fitted_models,
            "metrics": val_metrics,
            "avg_wape": avg_wape
        }

    # Select champion model
    champion_name = min(results, key=lambda k: results[k]["avg_wape"])
    print(f"\nChampion Model Selected: {champion_name} (Lowest Avg WAPE: {results[champion_name]['avg_wape']*100:.2f}%)")

    # Final Evaluation on held-out Test Set
    champion = results[champion_name]
    test_metrics = {}

    for target in TARGETS:
        y_test = test_df[target].values
        test_preds = champion["models"][target].predict(X_test)
        test_preds = np.clip(test_preds, 0, None)

        mae = float(mean_absolute_error(y_test, test_preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
        wape = compute_wape(y_test, test_preds)

        test_metrics[target] = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "wape": round(wape, 4),
            "wape_pct": round(wape * 100, 2)
        }
        print(f"Test [{target}] MAE: {mae:.2f}, RMSE: {rmse:.2f}, WAPE: {wape*100:.2f}%")

    # Feature Importance for 7-day model
    feat_imp = {}
    if hasattr(champion["models"]["target_demand_7d"], "feature_importances_"):
        raw_imp = champion["models"]["target_demand_7d"].feature_importances_
        feat_imp = {col: round(float(imp), 4) for col, imp in sorted(zip(FEATURE_COLS, raw_imp), key=lambda x: x[1], reverse=True)}

    # Save artifacts
    artifact_path = os.path.join(MODELS_DIR, "demand_forecast_model.joblib")
    joblib.dump(champion["models"], artifact_path)
    print(f"Saved trained models to {artifact_path}")

    meta = {
        "model_name": "Aushadham Multi-Horizon Demand Forecaster",
        "algorithm": champion_name,
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "train_samples": len(train_df),
        "validation_samples": len(val_df),
        "test_samples": len(test_df),
        "feature_columns": FEATURE_COLS,
        "target_horizons": ["7_day", "14_day", "30_day"],
        "validation_metrics": champion["metrics"],
        "test_metrics": test_metrics,
        "feature_importance_7d": feat_imp,
        "model_file": "demand_forecast_model.joblib"
    }

    meta_path = os.path.join(MODELS_DIR, "demand_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print("Demand model training & serialization completed successfully.")

if __name__ == "__main__":
    train_and_select()
