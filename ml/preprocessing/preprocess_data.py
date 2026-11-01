"""
Aushadham ML Data Preprocessing & Feature Engineering Pipeline
Extracts time-series lag features, rolling statistics, calendar indicators,
and multi-horizon target variables (7d, 14d, 30d demand and stockout risk).
Implements strict temporal train/validation/test split to prevent data leakage.
"""

import os
import json
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def build_features():
    sales_file = os.path.join(DATA_DIR, "daily_sales.csv")
    if not os.path.exists(sales_file):
        raise FileNotFoundError(f"Missing {sales_file}. Run generate_dataset.py first.")

    df = pd.read_csv(sales_file)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(by=["pharmacy_id", "medicine_id", "date"]).reset_index(drop=True)

    processed_dfs = []

    # Process each series independently
    grouped = df.groupby(["pharmacy_id", "medicine_id"])

    for (pharm_id, med_id), group in grouped:
        g = group.copy().reset_index(drop=True)

        # Lags
        g["lag_1"] = g["units_sold"].shift(1)
        g["lag_2"] = g["units_sold"].shift(2)
        g["lag_3"] = g["units_sold"].shift(3)
        g["lag_7"] = g["units_sold"].shift(7)
        g["lag_14"] = g["units_sold"].shift(14)

        # Rolling statistics (using closed='left' so today's target is not in the window)
        g["rolling_mean_7"] = g["units_sold"].shift(1).rolling(window=7, min_periods=1).mean()
        g["rolling_std_7"] = g["units_sold"].shift(1).rolling(window=7, min_periods=1).std().fillna(0)
        g["rolling_mean_14"] = g["units_sold"].shift(1).rolling(window=14, min_periods=1).mean()
        g["rolling_mean_30"] = g["units_sold"].shift(1).rolling(window=30, min_periods=1).mean()

        # Demand velocity / spike indicator
        g["velocity_ratio"] = g["rolling_mean_7"] / (g["rolling_mean_30"] + 0.1)

        # Stock coverage indicator
        g["days_of_supply"] = g["closing_stock"] / (g["rolling_mean_7"] + 0.1)

        # Targets: Future sums over 7, 14, 30 days
        # We compute future rolling sums on units_sold shifted backwards
        future_7 = g["units_sold"].iloc[::-1].rolling(window=7, min_periods=7).sum().iloc[::-1].shift(-7)
        future_14 = g["units_sold"].iloc[::-1].rolling(window=14, min_periods=14).sum().iloc[::-1].shift(-14)
        future_30 = g["units_sold"].iloc[::-1].rolling(window=30, min_periods=30).sum().iloc[::-1].shift(-30)

        g["target_demand_7d"] = future_7
        g["target_demand_14d"] = future_14
        g["target_demand_30d"] = future_30

        # Stockout target: Calculate simulated days until stock exhaust
        # Based on closing stock and rolling demand
        estimated_stockout_days = np.clip(
            g["closing_stock"] / (g["rolling_mean_7"] + 0.05), 
            0, 
            30
        )
        g["target_stockout_days"] = estimated_stockout_days.round(1)

        # Categorical risk: 3=Critical (<=2d), 2=High (3-7d), 1=Moderate (8-14d), 0=Healthy (>14d)
        conditions = [
            (g["target_stockout_days"] <= 2.0),
            (g["target_stockout_days"] <= 7.0),
            (g["target_stockout_days"] <= 14.0)
        ]
        choices = [3, 2, 1]
        g["target_stockout_risk"] = np.select(conditions, choices, default=0)

        processed_dfs.append(g)

    all_features = pd.concat(processed_dfs, ignore_index=True)

    # Drop rows with NaN targets due to 30d future horizon or initial lag window
    valid_features = all_features.dropna(subset=[
        "target_demand_7d", "target_demand_14d", "target_demand_30d",
        "lag_7", "lag_14", "rolling_mean_30"
    ]).copy()

    # Sort strictly by date for time-based split
    valid_features = valid_features.sort_values(by="date").reset_index(drop=True)

    # Save complete features
    features_path = os.path.join(DATA_DIR, "processed_features.csv")
    valid_features.to_csv(features_path, index=False)
    print(f"Generated {len(valid_features)} preprocessed feature rows.")

    # Time-based train / val / test split
    total_len = len(valid_features)
    train_end = int(total_len * 0.70)
    val_end = int(total_len * 0.85)

    df_train = valid_features.iloc[:train_end]
    df_val = valid_features.iloc[train_end:val_end]
    df_test = valid_features.iloc[val_end:]

    df_train.to_csv(os.path.join(DATA_DIR, "train.csv"), index=False)
    df_val.to_csv(os.path.join(DATA_DIR, "val.csv"), index=False)
    df_test.to_csv(os.path.join(DATA_DIR, "test.csv"), index=False)

    meta = {
        "num_total_samples": total_len,
        "train_samples": len(df_train),
        "val_samples": len(df_val),
        "test_samples": len(df_test),
        "train_date_range": [str(df_train["date"].min()), str(df_train["date"].max())],
        "val_date_range": [str(df_val["date"].min()), str(df_val["date"].max())],
        "test_date_range": [str(df_test["date"].min()), str(df_test["date"].max())],
        "feature_columns": [
            "lag_1", "lag_2", "lag_3", "lag_7", "lag_14",
            "rolling_mean_7", "rolling_std_7", "rolling_mean_14", "rolling_mean_30",
            "velocity_ratio", "closing_stock", "days_of_supply",
            "supplier_lead_time", "safety_stock", "day_of_week", "month", "is_weekend"
        ],
        "demand_targets": ["target_demand_7d", "target_demand_14d", "target_demand_30d"],
        "stockout_targets": ["target_stockout_days", "target_stockout_risk"]
    }

    with open(os.path.join(DATA_DIR, "preprocessing_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Temporal splits saved: Train={len(df_train)}, Val={len(df_val)}, Test={len(df_test)}")

if __name__ == "__main__":
    build_features()
