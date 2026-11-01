# Aushadham ML Model Evaluation Report

**Generated:** 2026-11-01T13:38:14.965301  
**Test Set Samples:** 963 held-out temporal observations  

---

## 1. Medicine Demand Forecasting (Multi-Horizon)
- **Algorithm:** RandomForest (Ensemble of Horizontally Tuned Trees)
- **Model Version:** 1.0.0
- **Overall Mean WAPE:** **8.79%**

| Horizon | Target | MAE (units) | RMSE (units) | WAPE (%) |
| :--- | :--- | :--- | :--- | :--- |
| **7-Day Demand** | `target_demand_7d` | 16.39 | 23.55 | **10.84%** |
| **14-Day Demand** | `target_demand_14d` | 27.17 | 40.12 | **8.96%** |
| **30-Day Demand** | `target_demand_30d` | 42.19 | 61.12 | **6.56%** |

---

## 2. Stockout Prediction & Risk Classification
- **Algorithm:** Random Forest Regressor & Multi-Class Classifier
- **Days to Stockout MAE:** **0.02 days**
- **Days to Stockout RMSE:** **0.16 days**
- **Risk Tier Accuracy:** **99.9%**
- **Weighted F1 Score:** **0.999**

### Risk Classification Thresholds
- **Critical:** Stockout expected within $\le 2$ days
- **High:** Stockout expected within $3 - 7$ days
- **Moderate:** Stockout expected within $8 - 14$ days
- **Healthy:** Sufficient stock based on lead-time demand ($> 14$ days)

---

## 3. Inventory & Demand Anomaly Detection
- **Algorithm:** Isolation Forest (Unsupervised)
- **Contamination Parameter:** 4%
- **Anomalies Detected in Test Set:** 17 (1.77%)

---
*Note: This evaluation report was produced using strict time-based splits to ensure zero future data leakage.*
