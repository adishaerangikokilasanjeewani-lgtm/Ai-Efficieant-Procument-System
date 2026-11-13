import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────
#  DEMAND FORECASTING
# ─────────────────────────────────────────────
def train_demand_model(demand_records: list) -> dict:
    """
    Train a RandomForest demand forecasting model.
    demand_records: list of dicts with keys: product_id, year, month, quantity_consumed
    Returns: dict {product_id: predicted_next_month_qty}
    """
    if not demand_records or len(demand_records) < 6:
        return {}

    df = pd.DataFrame(demand_records)
    predictions = {}

    for product_id in df["product_id"].unique():
        pdf = df[df["product_id"] == product_id].copy()
        if len(pdf) < 3:
            # Simple average if not enough history
            predictions[int(product_id)] = float(pdf["quantity_consumed"].mean())
            continue

        pdf = pdf.sort_values(["year", "month"]).reset_index(drop=True)

        # Feature engineering
        pdf["time_idx"] = range(len(pdf))
        pdf["month_sin"] = np.sin(2 * np.pi * pdf["month"] / 12)
        pdf["month_cos"] = np.cos(2 * np.pi * pdf["month"] / 12)
        pdf["lag1"] = pdf["quantity_consumed"].shift(1).fillna(pdf["quantity_consumed"].mean())
        pdf["lag2"] = pdf["quantity_consumed"].shift(2).fillna(pdf["quantity_consumed"].mean())
        pdf["rolling_avg"] = pdf["quantity_consumed"].rolling(3, min_periods=1).mean()

        features = ["time_idx", "month_sin", "month_cos", "lag1", "lag2", "rolling_avg"]
        X = pdf[features]
        y = pdf["quantity_consumed"]

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)

        # Predict next month
        last_row = pdf.iloc[-1]
        next_month = (last_row["month"] % 12) + 1
        next_year = last_row["year"] + (1 if next_month == 1 else 0)
        next_idx = last_row["time_idx"] + 1

        next_features = pd.DataFrame([{
            "time_idx": next_idx,
            "month_sin": np.sin(2 * np.pi * next_month / 12),
            "month_cos": np.cos(2 * np.pi * next_month / 12),
            "lag1": last_row["quantity_consumed"],
            "lag2": last_row["lag1"],
            "rolling_avg": last_row["rolling_avg"],
        }])

        pred = model.predict(next_features)[0]
        predictions[int(product_id)] = max(0.0, round(float(pred), 2))

    return predictions


# ─────────────────────────────────────────────
#  SUPPLIER RISK PREDICTION
# ─────────────────────────────────────────────
def predict_supplier_risk(performance_records: list) -> list:
    """
    Predict risk level for suppliers.
    performance_records: list of dicts with supplier metrics
    Returns: list of dicts {supplier_id, risk_level, risk_score, overall_score}
    """
    results = []

    for rec in performance_records:
        delivery = rec.get("delivery_score", 80)
        quality = rec.get("quality_score", 80)
        price = rec.get("price_score", 80)
        response = rec.get("response_score", 80)
        delay_days = rec.get("avg_delay_days", 0)
        defect_rate = rec.get("defect_rate", 0)

        # Weighted overall score
        overall = (
            delivery * 0.35 +
            quality * 0.30 +
            price * 0.20 +
            response * 0.15
        )

        # Risk score (higher = more risky)
        risk_score = (
            (100 - delivery) * 0.40 +
            (100 - quality) * 0.30 +
            min(delay_days * 5, 100) * 0.20 +
            min(defect_rate * 10, 100) * 0.10
        )

        if risk_score <= 20:
            risk_level = "low"
        elif risk_score <= 50:
            risk_level = "medium"
        else:
            risk_level = "high"

        results.append({
            "supplier_id": rec["supplier_id"],
            "risk_level": risk_level,
            "risk_score": round(risk_score, 2),
            "overall_score": round(overall, 2),
            "delivery_score": delivery,
            "quality_score": quality,
            "price_score": price,
            "response_score": response,
        })

    return results


# ─────────────────────────────────────────────
#  SUPPLIER RECOMMENDATION
# ─────────────────────────────────────────────
def rank_suppliers(supplier_data: list, product_category: str = None) -> list:
    """
    Rank suppliers based on weighted scoring.
    supplier_data: list of dicts with supplier metrics
    Returns: sorted list with rank scores
    """
    if not supplier_data:
        return []

    ranked = []
    for s in supplier_data:
        delivery = s.get("delivery_score", 70)
        quality = s.get("quality_score", 70)
        price = s.get("price_score", 70)
        response = s.get("response_score", 70)
        risk_score = s.get("risk_score", 50)

        rank_score = (
            delivery * 0.30 +
            quality * 0.30 +
            price * 0.25 +
            response * 0.10 +
            (100 - risk_score) * 0.05
        )

        ranked.append({
            **s,
            "rank_score": round(rank_score, 2),
            "recommendation": "Recommended" if rank_score >= 75 else ("Consider" if rank_score >= 55 else "Avoid"),
        })

    ranked.sort(key=lambda x: x["rank_score"], reverse=True)
    for i, s in enumerate(ranked):
        s["rank"] = i + 1

    return ranked


# ─────────────────────────────────────────────
#  SPEND ANALYSIS
# ─────────────────────────────────────────────
def analyze_spending(order_records: list) -> dict:
    """
    Analyze purchasing spend patterns.
    Returns category spend, monthly trend, top suppliers by spend
    """
    if not order_records:
        return {}

    df = pd.DataFrame(order_records)

    # Monthly trend
    df["order_date"] = pd.to_datetime(df["order_date"])
    df["month"] = df["order_date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month")["total_amount"].sum().reset_index()
    monthly = monthly.sort_values("month")

    # By supplier
    supplier_spend = df.groupby("supplier_name")["total_amount"].sum().reset_index()
    supplier_spend = supplier_spend.sort_values("total_amount", ascending=False).head(10)

    # By category
    category_spend = {}
    if "category" in df.columns:
        category_spend = df.groupby("category")["total_amount"].sum().to_dict()

    return {
        "total_spend": float(df["total_amount"].sum()),
        "monthly_trend": monthly.to_dict(orient="records"),
        "top_suppliers": supplier_spend.to_dict(orient="records"),
        "category_breakdown": category_spend,
        "avg_order_value": float(df["total_amount"].mean()),
        "order_count": len(df),
    }
