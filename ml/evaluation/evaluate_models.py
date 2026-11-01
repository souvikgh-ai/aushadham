"""
Aushadham ML Evaluation Pipeline
Runs unified test-set evaluation across all trained models:
- Demand Forecaster (7d, 14d, 30d): MAE, RMSE, WAPE
- Stockout Predictor: Days MAE, RMSE, Risk Accuracy & F1
- Inventory Anomaly Detector: Anomaly scoring & outlier distribution
Generates comprehensive Markdown & JSON evaluation reports.
"""

import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, accuracy_score, f1_score

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def compute_wape(y_true, y_pred):
    denom = np.sum(y_true)
    return float(np.sum(np.abs(y_true - y_pred)) / denom) if denom != 0 else 0.0

def evaluate_all():
    test_df = pd.read_csv(os.path.join(DATA_DIR, "test.csv"))
    
    # Load Models
    demand_models = joblib.load(os.path.join(MODELS_DIR, "demand_forecast_model.joblib"))
    stockout_artifacts = joblib.load(os.path.join(MODELS_DIR, "stockout_prediction_model.joblib"))
    anomaly_artifacts = joblib.load(os.path.join(MODELS_DIR, "inventory_anomaly_model.joblib"))

    # Load Metadata
    with open(os.path.join(MODELS_DIR, "demand_model_meta.json")) as f:
        demand_meta = json.load(f)

    # 1. Evaluate Demand Forecaster
    demand_features = demand_meta["feature_columns"]
    X_demand = test_df[demand_features].values
    
    demand_eval = {}
    for horizon, col in [("7_day", "target_demand_7d"), ("14_day", "target_demand_14d"), ("30_day", "target_demand_30d")]:
        y_true = test_df[col].values
        y_pred = np.clip(demand_models[col].predict(X_demand), 0, None)
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        wape = compute_wape(y_true, y_pred)
        demand_eval[horizon] = {
            "target": col,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "wape": round(wape, 4),
            "wape_percentage": round(wape * 100, 2)
        }

    # 2. Evaluate Stockout Predictor
    stockout_reg = stockout_artifacts["regressor"]
    stockout_clf = stockout_artifacts["classifier"]
    stockout_features = stockout_artifacts["feature_cols"]
    X_stockout = test_df[stockout_features].values

    y_days_true = test_df["target_stockout_days"].values
    y_days_pred = stockout_reg.predict(X_stockout)
    days_mae = float(mean_absolute_error(y_days_true, y_days_pred))
    days_rmse = float(np.sqrt(mean_squared_error(y_days_true, y_days_pred)))

    y_risk_true = test_df["target_stockout_risk"].values
    y_risk_pred = stockout_clf.predict(X_stockout)
    risk_acc = float(accuracy_score(y_risk_true, y_risk_pred))
    risk_f1 = float(f1_score(y_risk_true, y_risk_pred, average="weighted"))

    # 3. Evaluate Anomaly Detector
    anomaly_model = anomaly_artifacts["model"]
    anomaly_features = anomaly_artifacts["feature_cols"]
    X_anomaly = test_df[anomaly_features].values
    anomaly_preds = anomaly_model.predict(X_anomaly)
    anomalies_found = int(np.sum(anomaly_preds == -1))

    report_data = {
        "report_generated_at": datetime.now().isoformat(),
        "test_dataset_size": len(test_df),
        "demand_forecast": {
            "algorithm": demand_meta.get("algorithm", "RandomForest"),
            "version": demand_meta.get("version", "1.0.0"),
            "horizons": demand_eval,
            "mean_wape_percentage": round(np.mean([d["wape_percentage"] for d in demand_eval.values()]), 2)
        },
        "stockout_prediction": {
            "algorithm": "RandomForestRegressor + Classifier",
            "days_mae": round(days_mae, 2),
            "days_rmse": round(days_rmse, 2),
            "risk_accuracy_percentage": round(risk_acc * 100, 2),
            "risk_f1_weighted": round(risk_f1, 4)
        },
        "anomaly_detection": {
            "algorithm": "IsolationForest",
            "test_anomalies_detected": anomalies_found,
            "anomaly_rate_percentage": round((anomalies_found / len(test_df)) * 100, 2)
        }
    }

    # Write JSON report
    json_path = os.path.join(REPORTS_DIR, "model_evaluation_report.json")
    with open(json_path, "w") as f:
        json.dump(report_data, f, indent=2)

    # Write Markdown report
    md_content = f"""# Aushadham ML Model Evaluation Report

**Generated:** {report_data["report_generated_at"]}  
**Test Set Samples:** {report_data["test_dataset_size"]} held-out temporal observations  

---

## 1. Medicine Demand Forecasting (Multi-Horizon)
- **Algorithm:** {report_data["demand_forecast"]["algorithm"]} (Ensemble of Horizontally Tuned Trees)
- **Model Version:** {report_data["demand_forecast"]["version"]}
- **Overall Mean WAPE:** **{report_data["demand_forecast"]["mean_wape_percentage"]}%**

| Horizon | Target | MAE (units) | RMSE (units) | WAPE (%) |
| :--- | :--- | :--- | :--- | :--- |
| **7-Day Demand** | `target_demand_7d` | {demand_eval["7_day"]["mae"]} | {demand_eval["7_day"]["rmse"]} | **{demand_eval["7_day"]["wape_percentage"]}%** |
| **14-Day Demand** | `target_demand_14d` | {demand_eval["14_day"]["mae"]} | {demand_eval["14_day"]["rmse"]} | **{demand_eval["14_day"]["wape_percentage"]}%** |
| **30-Day Demand** | `target_demand_30d` | {demand_eval["30_day"]["mae"]} | {demand_eval["30_day"]["rmse"]} | **{demand_eval["30_day"]["wape_percentage"]}%** |

---

## 2. Stockout Prediction & Risk Classification
- **Algorithm:** Random Forest Regressor & Multi-Class Classifier
- **Days to Stockout MAE:** **{report_data["stockout_prediction"]["days_mae"]} days**
- **Days to Stockout RMSE:** **{report_data["stockout_prediction"]["days_rmse"]} days**
- **Risk Tier Accuracy:** **{report_data["stockout_prediction"]["risk_accuracy_percentage"]}%**
- **Weighted F1 Score:** **{report_data["stockout_prediction"]["risk_f1_weighted"]}**

### Risk Classification Thresholds
- **Critical:** Stockout expected within $\\le 2$ days
- **High:** Stockout expected within $3 - 7$ days
- **Moderate:** Stockout expected within $8 - 14$ days
- **Healthy:** Sufficient stock based on lead-time demand ($> 14$ days)

---

## 3. Inventory & Demand Anomaly Detection
- **Algorithm:** Isolation Forest (Unsupervised)
- **Contamination Parameter:** 4%
- **Anomalies Detected in Test Set:** {report_data["anomaly_detection"]["test_anomalies_detected"]} ({report_data["anomaly_detection"]["anomaly_rate_percentage"]}%)

---
*Note: This evaluation report was produced using strict time-based splits to ensure zero future data leakage.*
"""

    md_path = os.path.join(REPORTS_DIR, "model_evaluation_report.md")
    with open(md_path, "w") as f:
        f.write(md_content)

    print(f"Evaluation report generated at {json_path} and {md_path}")

if __name__ == "__main__":
    evaluate_all()
