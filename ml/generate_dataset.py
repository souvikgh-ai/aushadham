"""
Aushadham ML Data Generation Pipeline
Generates reproducible synthetic pharmacy sales & inventory dataset for model training.
Simulates multi-pharmacy operations across Bangalore with realistic temporal demand,
seasonal fluctuations, weekend effects, random surges, lead times, and stock replenishments.
"""

import os
import json
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Set deterministic seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Define Pharmacies with Bangalore coordinates
PHARMACIES = [
    {
        "pharmacy_id": "pharm_indiranagar",
        "name": "Aushadham Care - Indiranagar",
        "address": "100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
        "lat": 12.971891,
        "lng": 77.641151,
        "phone": "+91 98450 12001",
        "rating": 4.8,
        "verified": True,
        "traffic_multiplier": 1.25,
    },
    {
        "pharmacy_id": "pharm_koramangala",
        "name": "Aushadham Meds - Koramangala",
        "address": "80ft Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034",
        "lat": 12.934365,
        "lng": 77.624473,
        "phone": "+91 98450 12002",
        "rating": 4.9,
        "verified": True,
        "traffic_multiplier": 1.40,
    },
    {
        "pharmacy_id": "pharm_jayanagar",
        "name": "Aushadham Health - Jayanagar",
        "address": "11th Main, 4th Block, Jayanagar, Bengaluru, Karnataka 560011",
        "lat": 12.929869,
        "lng": 77.583313,
        "phone": "+91 98450 12003",
        "rating": 4.7,
        "verified": True,
        "traffic_multiplier": 1.10,
    },
    {
        "pharmacy_id": "pharm_whitefield",
        "name": "Aushadham Express - Whitefield",
        "address": "ITPB Main Road, Whitefield, Bengaluru, Karnataka 560066",
        "lat": 12.985698,
        "lng": 77.731422,
        "phone": "+91 98450 12004",
        "rating": 4.6,
        "verified": True,
        "traffic_multiplier": 1.30,
    },
    {
        "pharmacy_id": "pharm_malleshwaram",
        "name": "Aushadham Central - Malleshwaram",
        "address": "Sampige Road, Malleshwaram, Bengaluru, Karnataka 560003",
        "lat": 13.003120,
        "lng": 77.570180,
        "phone": "+91 98450 12005",
        "rating": 4.7,
        "verified": True,
        "traffic_multiplier": 1.05,
    },
]

# 2. Define Medicine Catalog matching real formulations
MEDICINES = [
    {
        "medicine_id": "med-pcm-500",
        "name": "Paracetamol 500mg",
        "generic_name": "Paracetamol / Acetaminophen",
        "category": "Analgesics / Antipyretics",
        "strength": "500 mg",
        "dosage_form": "Tablet",
        "pack_size": "10 tablets / strip",
        "mrp": 30.0,
        "selling_price": 25.0,
        "purchase_price": 15.0,
        "lead_time_days": 4,
        "safety_stock": 25,
        "base_daily_demand": 12,
        "seasonality": "monsoon_winter",  # higher in rainy/cold season
    },
    {
        "medicine_id": "med-pcm-650",
        "name": "Paracetamol 650mg",
        "generic_name": "Paracetamol",
        "category": "Analgesics / Antipyretics",
        "strength": "650 mg",
        "dosage_form": "Tablet",
        "pack_size": "15 tablets / strip",
        "mrp": 35.0,
        "selling_price": 31.0,
        "purchase_price": 18.0,
        "lead_time_days": 3,
        "safety_stock": 20,
        "base_daily_demand": 18,
        "seasonality": "monsoon_winter",
    },
    {
        "medicine_id": "med-azi-500",
        "name": "Azithromycin 500mg",
        "generic_name": "Azithromycin",
        "category": "Antibiotics",
        "strength": "500 mg",
        "dosage_form": "Tablet",
        "pack_size": "3 tablets / strip",
        "mrp": 120.0,
        "selling_price": 105.0,
        "purchase_price": 70.0,
        "lead_time_days": 5,
        "safety_stock": 15,
        "base_daily_demand": 6,
        "seasonality": "winter",
    },
    {
        "medicine_id": "med-amox-cv-625",
        "name": "Augmentin 625 Duo",
        "generic_name": "Amoxicillin + Clavulanic Acid",
        "category": "Antibiotics",
        "strength": "625 mg",
        "dosage_form": "Tablet",
        "pack_size": "10 tablets / strip",
        "mrp": 210.0,
        "selling_price": 189.0,
        "purchase_price": 130.0,
        "lead_time_days": 4,
        "safety_stock": 18,
        "base_daily_demand": 9,
        "seasonality": "monsoon_winter",
    },
    {
        "medicine_id": "med-cet-10",
        "name": "Cetirizine 10mg",
        "generic_name": "Cetirizine Hydrochloride",
        "category": "Antihistamines / Anti-Allergy",
        "strength": "10 mg",
        "dosage_form": "Tablet",
        "pack_size": "10 tablets / strip",
        "mrp": 22.0,
        "selling_price": 18.0,
        "purchase_price": 9.0,
        "lead_time_days": 2,
        "safety_stock": 20,
        "base_daily_demand": 14,
        "seasonality": "spring_monsoon",
    },
    {
        "medicine_id": "med-pan-40",
        "name": "Pantoprazole 40mg",
        "generic_name": "Pantoprazole Gastro-resistant",
        "category": "Gastrointestinal / Antacids",
        "strength": "40 mg",
        "dosage_form": "Tablet",
        "pack_size": "10 tablets / strip",
        "mrp": 95.0,
        "selling_price": 82.0,
        "purchase_price": 48.0,
        "lead_time_days": 3,
        "safety_stock": 22,
        "base_daily_demand": 15,
        "seasonality": "none",
    },
    {
        "medicine_id": "med-met-500",
        "name": "Metformin 500mg SR",
        "generic_name": "Metformin Hydrochloride",
        "category": "Diabetes Management",
        "strength": "500 mg",
        "dosage_form": "Tablet",
        "pack_size": "20 tablets / strip",
        "mrp": 45.0,
        "selling_price": 38.0,
        "purchase_price": 22.0,
        "lead_time_days": 4,
        "safety_stock": 30,
        "base_daily_demand": 22,
        "seasonality": "none",
    },
    {
        "medicine_id": "med-tel-40",
        "name": "Telmisartan 40mg",
        "generic_name": "Telmisartan",
        "category": "Cardiovascular / Hypertension",
        "strength": "40 mg",
        "dosage_form": "Tablet",
        "pack_size": "15 tablets / strip",
        "mrp": 115.0,
        "selling_price": 98.0,
        "purchase_price": 58.0,
        "lead_time_days": 3,
        "safety_stock": 25,
        "base_daily_demand": 16,
        "seasonality": "none",
    },
    {
        "medicine_id": "med-ator-10",
        "name": "Atorvastatin 10mg",
        "generic_name": "Atorvastatin Calcium",
        "category": "Cardiovascular / Statins",
        "strength": "10 mg",
        "dosage_form": "Tablet",
        "pack_size": "15 tablets / strip",
        "mrp": 135.0,
        "selling_price": 118.0,
        "purchase_price": 70.0,
        "lead_time_days": 4,
        "safety_stock": 20,
        "base_daily_demand": 13,
        "seasonality": "none",
    },
    {
        "medicine_id": "med-cough-syp",
        "name": "Ascoril-D Cough Syrup",
        "generic_name": "Dextromethorphan + Chlorpheniramine + Phenylephrine",
        "category": "Respiratory / Cough Syrups",
        "strength": "100 ml",
        "dosage_form": "Syrup",
        "pack_size": "1 bottle (100ml)",
        "mrp": 138.0,
        "selling_price": 122.0,
        "purchase_price": 82.0,
        "lead_time_days": 5,
        "safety_stock": 15,
        "base_daily_demand": 8,
        "seasonality": "monsoon_winter",
    },
    {
        "medicine_id": "med-ors-sachet",
        "name": "Electral ORS Powder",
        "generic_name": "Oral Rehydration Salts (WHO formula)",
        "category": "Nutrition / Electrolytes",
        "strength": "21.8 g",
        "dosage_form": "Powder",
        "pack_size": "Sachet (1 liter solution)",
        "mrp": 22.5,
        "selling_price": 20.0,
        "purchase_price": 12.0,
        "lead_time_days": 2,
        "safety_stock": 35,
        "base_daily_demand": 25,
        "seasonality": "summer",
    },
    {
        "medicine_id": "med-ibu-400",
        "name": "Brufen 400mg",
        "generic_name": "Ibuprofen",
        "category": "Analgesics / NSAID",
        "strength": "400 mg",
        "dosage_form": "Tablet",
        "pack_size": "15 tablets / strip",
        "mrp": 28.0,
        "selling_price": 24.0,
        "purchase_price": 14.0,
        "lead_time_days": 3,
        "safety_stock": 20,
        "base_daily_demand": 10,
        "seasonality": "none",
    },
]

def generate_daily_sales_dataset(num_days=180):
    """
    Generate synthetic daily time-series records for all medicines across all pharmacies
    covering 180 days up to the present.
    """
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=num_days)

    records = []
    
    for pharm in PHARMACIES:
        for med in MEDICINES:
            # Current inventory tracker for simulation
            current_stock = random.randint(30, 120)
            pending_restock_delivery = None  # (arrival_date, quantity)

            for d in range(num_days):
                curr_date = start_date + timedelta(days=d)
                day_of_week = curr_date.weekday()  # 0=Mon, 6=Sun
                month = curr_date.month

                # Check if pending restock arrived
                if pending_restock_delivery and pending_restock_delivery[0] <= curr_date:
                    current_stock += pending_restock_delivery[1]
                    pending_restock_delivery = None

                # Calculate demand factor
                # 1. Base demand
                demand = float(med["base_daily_demand"]) * pharm["traffic_multiplier"]

                # 2. Weekend boost (Sat/Sun pharmacies often see higher prescription volume)
                if day_of_week in (4, 5, 6):  # Fri, Sat, Sun
                    demand *= 1.22
                elif day_of_week == 0:  # Monday rush
                    demand *= 1.15

                # 3. Seasonal adjustments
                season = med["seasonality"]
                if season == "monsoon_winter" and month in (6, 7, 8, 9, 10, 11, 12, 1):
                    demand *= 1.35
                elif season == "winter" and month in (11, 12, 1, 2):
                    demand *= 1.40
                elif season == "summer" and month in (3, 4, 5):
                    demand *= 1.50
                elif season == "spring_monsoon" and month in (2, 3, 7, 8):
                    demand *= 1.30

                # 4. Stochastic noise and occasional demand surge (e.g. viral flu outbreak)
                noise = np.random.normal(loc=1.0, scale=0.18)
                is_surge = (random.random() < 0.035)  # 3.5% chance of a demand spike
                surge_factor = random.uniform(1.8, 2.6) if is_surge else 1.0

                total_demand = max(0, int(round(demand * noise * surge_factor)))
                
                # Sales is bounded by current stock
                actual_sales = min(current_stock, total_demand)
                stock_out = (current_stock <= 0)
                
                # Deduct sales from stock
                current_stock = max(0, current_stock - actual_sales)

                # Restock logic: if stock drops below reorder point and no pending order, trigger PO
                reorder_threshold = med["lead_time_days"] * med["base_daily_demand"] + med["safety_stock"]
                if current_stock <= reorder_threshold and pending_restock_delivery is None:
                    order_qty = int(med["base_daily_demand"] * 25 + med["safety_stock"])
                    delivery_date = curr_date + timedelta(days=med["lead_time_days"])
                    pending_restock_delivery = (delivery_date, order_qty)

                records.append({
                    "date": curr_date.isoformat(),
                    "pharmacy_id": pharm["pharmacy_id"],
                    "pharmacy_name": pharm["name"],
                    "medicine_id": med["medicine_id"],
                    "medicine_name": med["name"],
                    "generic_name": med["generic_name"],
                    "category": med["category"],
                    "strength": med["strength"],
                    "dosage_form": med["dosage_form"],
                    "units_sold": actual_sales,
                    "unmet_demand": max(0, total_demand - actual_sales),
                    "closing_stock": current_stock,
                    "is_stockout": int(stock_out),
                    "is_demand_surge": int(is_surge),
                    "selling_price": med["selling_price"],
                    "purchase_price": med["purchase_price"],
                    "supplier_lead_time": med["lead_time_days"],
                    "safety_stock": med["safety_stock"],
                    "day_of_week": day_of_week,
                    "month": month,
                    "is_weekend": int(day_of_week in (5, 6)),
                })

    df = pd.DataFrame(records)
    return df

def main():
    print(f"Generating synthetic pharmacy sales dataset...")
    df_sales = generate_daily_sales_dataset(num_days=180)
    
    # Save main dataset
    sales_path = os.path.join(DATA_DIR, "daily_sales.csv")
    df_sales.to_csv(sales_path, index=False)
    print(f"Saved {len(df_sales)} daily sales records to {sales_path}")

    # Save pharmacies catalog
    df_pharm = pd.DataFrame(PHARMACIES)
    pharm_path = os.path.join(DATA_DIR, "pharmacies.csv")
    df_pharm.to_csv(pharm_path, index=False)
    print(f"Saved {len(df_pharm)} pharmacies to {pharm_path}")

    # Save medicines catalog
    df_med = pd.DataFrame(MEDICINES)
    med_path = os.path.join(DATA_DIR, "medicines.csv")
    df_med.to_csv(med_path, index=False)
    print(f"Saved {len(df_med)} medicines to {med_path}")

    # Save metadata
    meta = {
        "dataset_name": "Aushadham Synthetic Multi-Pharmacy Dataset",
        "generated_at": datetime.now().isoformat(),
        "is_synthetic": True,
        "purpose": "Reproducible model training and evaluation for demand forecasting, stockout prediction, and anomaly detection",
        "num_records": len(df_sales),
        "num_pharmacies": len(PHARMACIES),
        "num_medicines": len(MEDICINES),
        "date_range_days": 180,
        "features": list(df_sales.columns),
        "future_retraining_supported": True
    }
    with open(os.path.join(DATA_DIR, "synthetic_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print("Dataset generation completed successfully.")

if __name__ == "__main__":
    main()
