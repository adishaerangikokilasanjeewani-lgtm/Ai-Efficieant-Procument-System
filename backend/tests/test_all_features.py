import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestEfficientProcurementSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login as admin to get token
        login_res = cls.client.post(
            "/auth/login",
            data={"username": "admin", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {token}"}

    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "ok")
        print("  [PASS] Health Check")

    def test_02_auth_me(self):
        res = self.client.get("/auth/me", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("username"), "admin")
        self.assertEqual(data.get("role"), "admin")
        print(f"  [PASS] Auth /me (User: {data.get('username')}, Role: {data.get('role')})")

    def test_03_dashboard_summary(self):
        res = self.client.get("/dashboard/summary", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_spend", data)
        self.assertIn("total_orders", data)
        self.assertIn("pending_orders", data)
        self.assertIn("total_suppliers", data)
        self.assertIn("low_stock_count", data)
        print(f"  [PASS] Dashboard Summary (Total Spend: ${data['total_spend']:,.2f}, Total Orders: {data['total_orders']}, Low Stock: {data['low_stock_count']})")

    def test_04_dashboard_monthly_spend(self):
        res = self.client.get("/dashboard/monthly-spend", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        print(f"  [PASS] Monthly Spend Trends ({len(data)} months tracked)")

    def test_05_dashboard_low_stock(self):
        res = self.client.get("/dashboard/low-stock", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        print(f"  [PASS] Low Stock Alerts ({len(data)} items low in stock)")

    def test_06_suppliers_module(self):
        res = self.client.get("/suppliers", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        suppliers = res.json()
        self.assertGreater(len(suppliers), 0)
        first_id = suppliers[0]["id"]

        detail_res = self.client.get(f"/suppliers/{first_id}", headers=self.headers)
        self.assertEqual(detail_res.status_code, 200)
        print(f"  [PASS] Suppliers Module ({len(suppliers)} suppliers loaded, detail view verified)")

    def test_07_products_and_categories(self):
        res = self.client.get("/products", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        products = res.json()
        self.assertGreater(len(products), 0)

        cat_res = self.client.get("/products/categories/list", headers=self.headers)
        self.assertEqual(cat_res.status_code, 200)
        categories = cat_res.json()
        print(f"  [PASS] Products Module ({len(products)} products across {len(categories)} categories)")

    def test_08_purchase_orders_workflow(self):
        res = self.client.get("/orders", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        orders = res.json()
        self.assertGreater(len(orders), 0)
        first_order = orders[0]
        order_detail = self.client.get(f"/orders/{first_order['id']}", headers=self.headers)
        self.assertEqual(order_detail.status_code, 200)
        print(f"  [PASS] Purchase Orders Module ({len(orders)} orders loaded, detail view verified)")

    def test_08b_order_receive_auto_updates_inventory(self):
        # 1. Get initial stock of product 1
        prod_before = self.client.get("/products/1", headers=self.headers).json()
        initial_stock = prod_before["current_stock"]

        # 2. Create a new purchase order for product 1 with quantity 25
        order_payload = {
            "supplier_id": 1,
            "expected_delivery": "2026-11-15T00:00:00",
            "notes": "Automated inventory test order",
            "items": [
                {"product_id": 1, "quantity": 25.0, "unit_price": prod_before["unit_price"]}
            ]
        }
        create_res = self.client.post("/orders", json=order_payload, headers=self.headers)
        self.assertEqual(create_res.status_code, 200)
        new_order_id = create_res.json()["id"]

        # 3. Approve order
        appr_res = self.client.put(f"/orders/{new_order_id}/approve", headers=self.headers)
        self.assertEqual(appr_res.status_code, 200)

        # 4. Receive order
        rec_res = self.client.put(f"/orders/{new_order_id}/receive", headers=self.headers)
        self.assertEqual(rec_res.status_code, 200)

        # 5. Verify product stock increased by 25
        prod_after = self.client.get("/products/1", headers=self.headers).json()
        self.assertEqual(prod_after["current_stock"], round(initial_stock + 25.0, 2))

        # 6. Verify duplicate receive is rejected
        dup_res = self.client.put(f"/orders/{new_order_id}/receive", headers=self.headers)
        self.assertEqual(dup_res.status_code, 400)

        print(f"  [PASS] Order Receive Auto-Updates Inventory (Stock: {initial_stock} -> {prod_after['current_stock']}, +25 units added)")

    def test_09_ai_demand_forecast(self):
        res = self.client.get("/ai/demand-forecast", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        forecasts = data.get("forecasts", [])
        self.assertGreater(len(forecasts), 0)
        sample = forecasts[0]
        self.assertIn("predicted_demand", sample)
        self.assertIn("recommended_order_qty", sample)
        print(f"  [PASS] AI Demand Forecasting (Generated ML predictions for {len(forecasts)} products)")

    def test_10_ai_supplier_risk(self):
        res = self.client.get("/ai/supplier-risk", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        risk_list = data.get("risk_assessments", [])
        self.assertGreater(len(risk_list), 0)
        sample = risk_list[0]
        self.assertIn("risk_level", sample)
        self.assertIn("risk_score", sample)
        print(f"  [PASS] AI Supplier Risk Assessment (Evaluated {len(risk_list)} suppliers with risk scores)")

    def test_11_ai_supplier_recommendations(self):
        res = self.client.get("/ai/supplier-recommendations", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        recs = data.get("recommendations", [])
        self.assertGreater(len(recs), 0)
        print(f"  [PASS] AI Supplier Ranking & Recommendations ({len(recs)} suppliers scored & ranked)")

    def test_12_ai_spend_analysis(self):
        res = self.client.get("/ai/spend-analysis", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        analysis = res.json()
        self.assertIn("monthly_trend", analysis)
        self.assertIn("category_breakdown", analysis)
        self.assertIn("top_suppliers", analysis)
        print(f"  [PASS] AI Spend Analysis (Trends, Categories & Top Suppliers verified)")

    def test_13_ai_dashboard_insights(self):
        res = self.client.get("/ai/dashboard-insights", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        insights = res.json()
        self.assertIn("supplier_risk_distribution", insights)
        self.assertIn("total_predictions", insights)
        print(f"  [PASS] AI Dashboard Insights (Risk distribution & Total predictions: {insights['total_predictions']})")

if __name__ == "__main__":
    print("\n================ SYSTEM FUNCTIONALITY CHECK ================\n")
    unittest.main(verbosity=2)
