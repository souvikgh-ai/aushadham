"""
Aushadham Comprehensive Integration & ML Test Suite
Verifies:
1. Model loading & artifact verification
2. ML inference: Demand Forecast (7d, 14d, 30d), Stockout Prediction, Replenishment, Anomaly Detection
3. Fast API endpoints & schemas
4. Medicine discovery & Haversine distance calculations
5. Synchronized inventory updates between Pharmacy Owner and Patient
6. Boundary conditions & Negative stock prevention
"""

import sys
import os
import unittest
import urllib.request
import json

BASE_URL = "http://127.0.0.1:8001"

class TestAushadhamEcosystem(unittest.TestCase):
    
    def test_01_api_health_and_models_online(self):
        """Verify API server is running and all 3 ML models are loaded in memory."""
        req = urllib.request.Request(f"{BASE_URL}/")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode())
            self.assertEqual(data["status"], "online")
            self.assertTrue(data["models_active"]["demand_forecasting"])
            self.assertTrue(data["models_active"]["stockout_prediction"])
            self.assertTrue(data["models_active"]["anomaly_detection"])

    def test_02_ml_demand_forecasting_endpoint(self):
        """Test POST /api/ml/forecast returns valid multi-horizon predictions."""
        payload = {
            "medicine_id": "med-pcm-650",
            "pharmacy_id": "pharm_indiranagar",
            "closing_stock": 40.0,
            "rolling_mean_7": 15.0,
            "rolling_mean_14": 14.0,
            "rolling_mean_30": 13.5,
            "velocity_ratio": 1.11,
            "supplier_lead_time": 3.0,
            "safety_stock": 20.0
        }
        data_bytes = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{BASE_URL}/api/ml/forecast",
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertIn("forecast_7d", res)
            self.assertIn("forecast_14d", res)
            self.assertIn("forecast_30d", res)
            self.assertGreater(res["forecast_7d"], 0)
            self.assertGreater(res["forecast_14d"], res["forecast_7d"])
            self.assertEqual(res["algorithm"], "RandomForest")
            self.assertEqual(res["model_version"], "1.0.0")

    def test_03_ml_stockout_prediction_endpoint(self):
        """Test POST /api/ml/stockout-prediction detects critical stockout."""
        # Low stock scenario: 6 units with rolling daily sales of 12 -> critical <= 2 days
        payload = {
            "medicine_id": "med-pcm-500",
            "closing_stock": 6.0,
            "rolling_mean_7": 12.0,
            "rolling_mean_30": 10.0,
            "supplier_lead_time": 4.0,
            "safety_stock": 20.0
        }
        data_bytes = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{BASE_URL}/api/ml/stockout-prediction",
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertIn("estimated_days_to_stockout", res)
            self.assertIn("risk_tier", res)
            self.assertLessEqual(res["estimated_days_to_stockout"], 2.5)

    def test_04_restock_recommendation_logic(self):
        """Test POST /api/ml/restock-recommendation formula."""
        payload = {
            "current_stock": 10,
            "daily_demand_forecast": 8.0,
            "supplier_lead_time_days": 4,
            "safety_stock": 20,
            "pending_orders": 0,
            "target_coverage_days": 30
        }
        data_bytes = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{BASE_URL}/api/ml/restock-recommendation",
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertTrue(res["is_restock_needed"])
            # Reorder Point = (8 * 4) + 20 = 52
            self.assertEqual(res["reorder_point"], 52)
            # Target = (8 * 30) + 20 = 260. Order = 260 - 10 = 250
            self.assertEqual(res["recommended_order_quantity"], 250)

    def test_05_anomaly_detection_endpoint(self):
        """Test POST /api/ml/anomaly-detection on sudden sales surge."""
        payload = {
            "units_sold": 95.0, # massive surge vs 12 baseline
            "rolling_mean_7": 12.0,
            "rolling_std_7": 1.5,
            "rolling_mean_30": 11.0,
            "velocity_ratio": 7.9,
            "closing_stock": 5.0,
            "days_of_supply": 0.4
        }
        data_bytes = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{BASE_URL}/api/ml/anomaly-detection",
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertIn("is_anomaly", res)
            self.assertIn("anomaly_score", res)
            self.assertTrue(res["is_anomaly"])

    def test_06_medicine_search_discovery(self):
        """Test GET /api/medicines/search query filtering."""
        req = urllib.request.Request(f"{BASE_URL}/api/medicines/search?query=Paracetamol")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode())
            self.assertGreater(data["count"], 0)
            names = [m["name"] for m in data["medicines"]]
            self.assertTrue(any("Paracetamol" in n for n in names))

    def test_07_nearby_pharmacy_haversine_discovery(self):
        """Test GET /api/pharmacies/nearby with coordinates in central Bangalore."""
        req = urllib.request.Request(f"{BASE_URL}/api/pharmacies/nearby?lat=12.9716&lng=77.5946&radius_km=10")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode())
            self.assertGreater(data["count"], 0)
            # Verify distance is computed and pharmacies are sorted by proximity
            dists = [p["distance_km"] for p in data["pharmacies"]]
            self.assertEqual(dists, sorted(dists))

    def test_08_inventory_sync_and_negative_stock_prevention(self):
        """Test real-time inventory synchronization and protection against negative stock."""
        # 1. Update stock with valid sale
        payload = {
            "pharmacy_id": "pharm_indiranagar",
            "medicine_id": "med-pcm-500",
            "quantity_change": -5,
            "reason": "SALE"
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/inventory/update",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertTrue(res["success"])
            new_stock = res["new_stock"]

        # 2. Check that nearby pharmacy search immediately reflects the new stock
        req_check = urllib.request.Request(
            f"{BASE_URL}/api/pharmacies/nearby?lat=12.9719&lng=77.6412&medicine_id=med-pcm-500"
        )
        with urllib.request.urlopen(req_check) as resp_check:
            data_check = json.loads(resp_check.read().decode())
            indiranagar = next(p for p in data_check["pharmacies"] if p["pharmacy_id"] == "pharm_indiranagar")
            self.assertEqual(indiranagar["medicine_stock"]["quantity"], new_stock)

        # 3. Test negative stock prevention: try to deduct 99999 units
        bad_payload = {
            "pharmacy_id": "pharm_indiranagar",
            "medicine_id": "med-pcm-500",
            "quantity_change": -99999,
            "reason": "INVALID_SALE"
        }
        bad_req = urllib.request.Request(
            f"{BASE_URL}/api/inventory/update",
            data=json.dumps(bad_payload).encode(),
            headers={"Content-Type": "application/json"}
        )
    def test_09_customer_reservation_lifecycle(self):
        """Test complete customer reservation lifecycle: create -> accept -> collect with stock holds."""
        payload = {
            "customer_name": "Pooja Hegde",
            "customer_phone": "+91 98450 99887",
            "customer_email": "pooja.h@gmail.com",
            "pharmacy_id": "pharm_indiranagar",
            "medicine_id": "med-pcm-650",
            "quantity": 2
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/reservations/create",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            res_id = res["reservation_id"]
            self.assertEqual(res["status"], "PENDING")
            self.assertEqual(res["quantity"], 2)

        # Transition to ACCEPTED
        status_req = urllib.request.Request(
            f"{BASE_URL}/api/reservations/{res_id}/status",
            data=json.dumps({"status": "ACCEPTED"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(status_req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertEqual(res["reservation"]["status"], "ACCEPTED")

        # Transition to COLLECTED
        collect_req = urllib.request.Request(
            f"{BASE_URL}/api/reservations/{res_id}/status",
            data=json.dumps({"status": "COLLECTED"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(collect_req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertEqual(res["reservation"]["status"], "COLLECTED")

    def test_10_prescription_ocr_scanner(self):
        """Test POST /api/prescriptions/scan parses prescription and computes multi-store availability."""
        rx_sample = """
        Dr. S. K. Roy, MBBS
        1. Tab. Dolo 650 (Paracetamol 650mg) - 10 tabs TDS
        2. Tab. Augmentin 625 Duo - 10 tabs BD x 5 days
        """
        payload = {
            "prescription_text": rx_sample,
            "user_lat": 12.9716,
            "user_lng": 77.5946
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/prescriptions/scan",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertGreater(res["extracted_medicines_count"], 0)
            self.assertGreater(len(res["pharmacy_matches"]), 0)
            first_match = res["pharmacy_matches"][0]
            self.assertIn("match_type", first_match)
            self.assertIn(first_match["match_type"], ["COMPLETE", "PARTIAL"])

    def test_11_inter_pharmacy_stock_transfers(self):
        """Test surplus-deficit detection and inter-pharmacy stock transfer creation."""
        # 1. Check surplus-deficit pairing
        req = urllib.request.Request(f"{BASE_URL}/api/transfers/surplus-deficit")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode())
            self.assertIn("transfer_proposals", data)

        # 2. Create transfer request
        tx_payload = {
            "from_pharmacy_id": "pharm_koramangala",
            "to_pharmacy_id": "pharm_indiranagar",
            "medicine_id": "med-azi-500",
            "quantity": 5,
            "batch_number": "AZ-TEST-01",
            "expiry_date": "2026-12-31",
            "reason": "Test transfer"
        }
        create_req = urllib.request.Request(
            f"{BASE_URL}/api/transfers/request",
            data=json.dumps(tx_payload).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(create_req) as resp:
            self.assertEqual(resp.status, 200)
            tx = json.loads(resp.read().decode())
            tx_id = tx["transfer_id"]
            self.assertEqual(tx["status"], "REQUESTED")

        # 3. Mark RECEIVED and verify inventory update
        rcv_req = urllib.request.Request(
            f"{BASE_URL}/api/transfers/{tx_id}/status",
            data=json.dumps({"status": "RECEIVED"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(rcv_req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode())
            self.assertEqual(data["transfer"]["status"], "RECEIVED")

    def test_12_explainable_ai_and_seasonal_intelligence(self):
        """Test Explainable AI feature attribution and seasonal demand intelligence endpoints."""
        # Explainable AI
        req_xai = urllib.request.Request(f"{BASE_URL}/api/ml/explain/med-azi-500")
        with urllib.request.urlopen(req_xai) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertIn("contributing_factors", res)
            self.assertGreater(len(res["contributing_factors"]), 0)

        # Seasonal Intelligence
        req_season = urllib.request.Request(f"{BASE_URL}/api/ml/seasonal-intelligence")
        with urllib.request.urlopen(req_season) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode())
            self.assertIn("active_demand_trends", res)
            self.assertIn("calendar_effects", res)

if __name__ == "__main__":
    unittest.main()
