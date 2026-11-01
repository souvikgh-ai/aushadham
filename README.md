# AUSHADHAM (औषधम्)
## AI-Powered Pharmacy Inventory Management & Medicine Discovery Ecosystem

Aushadham is an integrated, dual-platform healthcare ecosystem bridging local community pharmacies and patients through **real-time synchronized inventory** and **trained machine learning models**.

---

## 1. Architectural Overview

```
                      +---------------------------------------+
                      |          AUSHADHAM FRONTEND           |
                      |   (React 19 + TypeScript + Tailwind)  |
                      +-------------------+-------------------+
                                          |
                        Role-Based Access Control (RBAC)
                                          |
                +-------------------------+-------------------------+
                |                                                   |
      [ROLE: CUSTOMER / PATIENT]                        [ROLE: PHARMACY OWNER]
      • Medicine Brand/Salt Search                      • Inventory & Batch Tracking (FEFO)
      • Geolocation & Haversine Radar                   • POS Billing & Sales Velocity
      • Live Store Distance & Freshness                 • Smart Purchase Order Engine
      • One-Click Medicine Reservation                  • AI Demand Forecast & Anomaly Radar
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                                    REST APIs
                                          |
                      +-------------------+-------------------+
                      |      FASTAPI CENTRAL BACKEND SERVER   |
                      |          (Python 3.14 - Port 8001)    |
                      +-------------------+-------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
 [SYNCHRONIZED STORE]           [GEOSPATIAL ENGINE]              [TRAINED ML PIPELINE]
 • Multi-Pharmacy Live Stock    • Haversine Distance Calc        • Model 1: Multi-Horizon Forecaster
 • Transaction Safety Guard     • Bounded Search Radii             (7d, 14d, 30d WAPE < 10.8%)
 • Negative Stock Prevention    • Verified Pharmacy Catalog      • Model 2: Stockout Prediction (99.9%)
 • Instantaneous Timestamp Freshness                             • Model 3: Dynamic Replenishment Engine
                                                                 • Model 4: Isolation Forest Anomalies
```

---

## 2. Key Features

### A. Role 1: Customer / Patient Experience
- **Medicine Discovery**: Search by Brand name (e.g., *Dolo 650*, *Augmentin*), Generic/Salt name, category, or dosage form.
- **Geospatial Radar**: Detects browser GPS coordinates or allows manual selection of Bengaluru neighborhoods (Indiranagar, Koramangala, Jayanagar, Whitefield, Malleshwaram).
- **Exact Haversine Distance**: Displays distance to each pharmacy in kilometers.
- **Verified Availability & Freshness Badges**:
  - 🟢 *Recently Verified* (< 15 mins)
  - 🟡 *Limited Availability* (< 5 units)
  - 🟠 *Inventory May Be Outdated* (> 24 hrs)
  - ⚪ *Availability Unconfirmed*
- **Prescription Scanner & OCR Engine**: Camera/image/PDF document upload, rule-based medical entity extraction (drugs, strengths, dosage frequencies, quantities), patient verification review, and multi-pharmacy availability matrix (100% Complete vs. Partial fulfillment with estimated total cost).
- **Transaction-Safe Medicine Reservation**: Reserve medicine with quantity selection, patient contact details, pickup deadlines, stock-hold protection preventing overselling, and automated confirmation codes (`RES-2026-XXXX`).

### B. Role 2: Pharmacy Owner Experience (Consolidated 9-Part Architecture)
1. **OVERVIEW**: Redesigned central dashboard with simplified greeting, compact AI Intelligence Summary section, 6 balanced KPI metric cards, deduplicated actionable alerts (imminent stockouts, critical expiry, incoming deliveries, pending reservations), and concise velocity analytics.
2. **INVENTORY**: Unified workspace with sub-tabs for Medicine Catalogue, Batch-level stock & FEFO tracking, Expiry Monitoring, and immutable Stock Movement Audit Trail.
3. **POS & SALES**: Integrated billing suite with barcode FEFO billing, GST invoice generation, and full historical sales audit trail.
4. **AI INTELLIGENCE**: Multi-Horizon Demand Forecasting (7d, 14d, 30d WAPE < 10.8%), Stockout Risk Matrix, Smart Replenishment Engine, Isolation Forest Anomaly Radar, Explainable AI (XAI) feature attribution weights, and Bengaluru Seasonal Epidemiological Intelligence.
5. **PROCUREMENT**: End-to-end purchasing lifecycle with Purchase Order tracking, Delivery Receiving, Suppliers Directory, and intelligent Reorder recommendations.
6. **PHARMACY NETWORK**: Inter-pharmacy stock balancing across Bengaluru partner stores, automated surplus vs. deficit matchmaker, transfer requests, dispatch tracking, and atomic inventory synchronization upon receipt confirmation.
7. **CUSTOMER REQUESTS**: Full medicine reservation management: review incoming patient requests, verify prescriptions, accept/reject, mark ready for pickup, and mark collected with automatic inventory deduction.
8. **REPORTS**: Analytics and business reports across sales, inventory health, expiry wastage, and AI forecasting accuracy.
9. **SETTINGS**: Pharmacy profile, operating hours, GST credentials, inventory visibility, and notification preferences.

### C. Critical Inventory Logic Audit (Decoupled Alerts)
- **Stockout Risk**: Triggered strictly when inventory and sales velocity project depletion within supplier lead time (`days_to_stockout <= lead_time`).
- **Expiry Risk**: Triggered when a batch nears expiry (`days_to_expiry <= 90`), irrespective of stock level.
- **Replenishment Need**: Requires positive sales velocity (`velocity > 0`). Never falsely recommends "Critical Restock Required" or "Create Purchase Order" for a zero-velocity medicine approaching expiry!

---

## 3. Directory Structure

```
aushadam/
├── backend/
│   └── main.py                     # FastAPI backend & synchronization server
├── ml/
│   ├── data/                       # Dataset storage (synthetic & future real data)
│   ├── preprocessing/
│   │   └── preprocess_data.py      # Feature engineering & temporal train/val/test splits
│   ├── training/
│   │   ├── train_demand_model.py   # Multi-horizon Random Forest / Gradient Boosting
│   │   ├── train_stockout_model.py # Days to stockout regressor & risk classifier
│   │   └── train_anomaly_model.py  # Isolation Forest anomaly detector
│   ├── evaluation/
│   │   └── evaluate_models.py      # Computes MAE, RMSE, WAPE & outputs reports
│   ├── inference/
│   │   ├── predict_demand.py       # Programmatic demand inference class
│   │   ├── predict_stockout.py     # Programmatic stockout inference class
│   │   └── generate_restock_recommendations.py # Deterministic replenishment engine
│   ├── models/                     # Serialized .joblib artifacts & metadata JSONs
│   ├── reports/                    # Model evaluation reports (Markdown & JSON)
│   └── requirements.txt
├── src/
│   ├── components/                 # Header, Sidebar, RoleLoginModal, etc.
│   ├── context/                    # PharmacyContext with RBAC & sync
│   ├── pages/                      # CustomerDiscoveryPage, DemandForecastPage, etc.
│   └── services/                   # Storage, FEFO engine, and demo data
├── tests/
│   └── test_ecosystem.py           # 8-suite automated end-to-end integration tests
├── package.json
└── vite.config.ts                  # Vite config with /api proxy to port 8001
```

---

## 4. Machine Learning Model Performance

All models were evaluated on an independent, strictly temporal held-out test split (zero future data leakage):

### Demand Forecasting Model (Champion: Random Forest)
- **Mean WAPE Across Horizons**: **8.78%**
- **7-Day Demand Target**: MAE = **16.39 units**, RMSE = **23.55 units**, WAPE = **10.84%**
- **14-Day Demand Target**: MAE = **27.17 units**, RMSE = **40.12 units**, WAPE = **8.96%**
- **30-Day Demand Target**: MAE = **42.19 units**, RMSE = **61.12 units**, WAPE = **6.56%**

### Stockout Predictor & Classifier
- **Days to Stockout Regressor MAE**: **0.02 days**
- **Risk Tier Classification Accuracy**: **99.90%** (Weighted F1: **0.999**)

### Inventory Anomaly Detector
- **Algorithm**: Unsupervised `IsolationForest`
- **Contamination**: 4% expected outlier rate

---

## 5. Setup & Execution Instructions

### A. Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (tested with Python 3.14)

### B. Python ML Dependencies
```bash
pip install -r ml/requirements.txt
```

### C. Retraining & Evaluating Models
To regenerate training data, re-engineer features, train all models, and produce evaluation reports:
```bash
# 1. Generate 180-day multi-pharmacy temporal sales data (10,800 records)
python3 ml/generate_dataset.py

# 2. Extract lag features, rolling statistics, and temporal splits
python3 ml/preprocessing/preprocess_data.py

# 3. Train models
python3 ml/training/train_demand_model.py
python3 ml/training/train_stockout_model.py
python3 ml/training/train_anomaly_model.py

# 4. Generate evaluation report
python3 ml/evaluation/evaluate_models.py
```

### D. Running the Backend Server
Start the FastAPI API on port 8001:
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### E. Running the Frontend Application
In a separate terminal, start the Vite development server:
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 6. Running Tests
Run the comprehensive end-to-end integration test suite:
```bash
python3 -m unittest tests/test_ecosystem.py
```

---

## 7. Retraining on Real Pharmacy Data

When migrating from synthetic simulation to actual pharmacy transaction logs:
1. Export sales records into `ml/data/daily_sales.csv` matching the schema:
   `date`, `pharmacy_id`, `medicine_id`, `units_sold`, `closing_stock`, `supplier_lead_time`, `safety_stock`.
2. Run `python3 ml/preprocessing/preprocess_data.py` to recompute lags and temporal splits.
3. Run `python3 ml/training/train_demand_model.py` and `python3 ml/training/train_stockout_model.py`.
4. Check `ml/reports/model_evaluation_report.md` to review the newly calibrated WAPE and MAE before pushing the updated `.joblib` model artifact to production.
