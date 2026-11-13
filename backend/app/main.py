from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os

from .database import get_db, engine
from .models import Base, User, Supplier, Product, PurchaseOrder, PurchaseOrderItem, SupplierPerformance, DemandHistory, Inventory, Contract, UserRole, OrderStatus, RiskLevel
from .auth import verify_password, get_password_hash, create_access_token, decode_token
from .ml import train_demand_model, predict_supplier_risk, rank_suppliers, analyze_spending

# ── Create tables ────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Efficient Procurement API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Auth dependency ──────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ═══════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "procurement_officer"

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    payment_terms: Optional[str] = "Net 30"
    lead_time_days: int = 7

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    is_active: Optional[bool] = None

class ProductCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    unit: str = "units"
    unit_price: float = 0.0
    current_stock: float = 0.0
    reorder_level: float = 10.0
    max_stock: float = 500.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    current_stock: Optional[float] = None
    reorder_level: Optional[float] = None
    max_stock: Optional[float] = None

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    expected_delivery: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class PerformanceCreate(BaseModel):
    supplier_id: int
    order_id: Optional[int] = None
    delivery_score: float
    quality_score: float
    price_score: float
    response_score: float
    delivery_delay_days: int = 0
    defect_rate: float = 0.0

# ═══════════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════
@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = create_access_token({"sub": user.username, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "full_name": user.full_name, "role": user.role.value, "email": user.email}
    }

@app.post("/auth/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=UserRole(data.role),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "id": user.id}

@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "full_name": current_user.full_name, "role": current_user.role.value, "email": current_user.email}

# ═══════════════════════════════════════════════════════════════════
#  DASHBOARD
# ═══════════════════════════════════════════════════════════════════
@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from .database import USE_SQLITE
    total_suppliers = db.query(Supplier).filter(Supplier.is_active == True).count()
    total_products = db.query(Product).filter(Product.is_active == True).count()
    total_orders = db.query(PurchaseOrder).count()
    pending_orders = db.query(PurchaseOrder).filter(PurchaseOrder.status == OrderStatus.pending).count()
    approved_orders = db.query(PurchaseOrder).filter(PurchaseOrder.status == OrderStatus.approved).count()

    # Monthly spend (current month) — compatible with both SQLite and MySQL
    now = datetime.utcnow()
    if USE_SQLITE:
        from sqlalchemy import extract, cast, String
        monthly_spend = db.query(func.sum(PurchaseOrder.total_amount)).filter(
            func.strftime('%m', PurchaseOrder.order_date) == str(now.month).zfill(2),
            func.strftime('%Y', PurchaseOrder.order_date) == str(now.year)
        ).scalar() or 0
    else:
        monthly_spend = db.query(func.sum(PurchaseOrder.total_amount)).filter(
            func.month(PurchaseOrder.order_date) == now.month,
            func.year(PurchaseOrder.order_date) == now.year
        ).scalar() or 0

    # Low stock products
    low_stock = db.query(Product).filter(
        Product.current_stock <= Product.reorder_level,
        Product.is_active == True
    ).count()

    # Total spend (all time)
    total_spend = db.query(func.sum(PurchaseOrder.total_amount)).filter(
        PurchaseOrder.status != OrderStatus.cancelled
    ).scalar() or 0

    # High risk suppliers
    high_risk = db.query(SupplierPerformance).filter(
        SupplierPerformance.risk_level == RiskLevel.high
    ).count()

    # Avg supplier score
    avg_score = db.query(func.avg(SupplierPerformance.overall_score)).scalar() or 0

    # Recent orders
    recent_orders = db.query(PurchaseOrder).order_by(desc(PurchaseOrder.created_at)).limit(5).all()
    recent_list = []
    for o in recent_orders:
        sup = db.query(Supplier).filter(Supplier.id == o.supplier_id).first()
        recent_list.append({
            "id": o.id,
            "order_number": o.order_number,
            "supplier": sup.name if sup else "Unknown",
            "status": o.status.value,
            "total_amount": o.total_amount,
            "order_date": o.order_date.isoformat(),
        })

    return {
        "total_suppliers": total_suppliers,
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "approved_orders": approved_orders,
        "monthly_spend": round(float(monthly_spend), 2),
        "total_spend": round(float(total_spend), 2),
        "low_stock_count": low_stock,
        "high_risk_suppliers": high_risk,
        "avg_supplier_score": round(float(avg_score), 1),
        "recent_orders": recent_list,
    }

@app.get("/dashboard/monthly-spend")
def monthly_spend_chart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from .database import USE_SQLITE
    import calendar

    if USE_SQLITE:
        # SQLite: use strftime to group by year-month
        rows = db.query(
            func.strftime('%Y', PurchaseOrder.order_date).label("year_str"),
            func.strftime('%m', PurchaseOrder.order_date).label("month_str"),
            func.sum(PurchaseOrder.total_amount).label("total")
        ).filter(PurchaseOrder.status != OrderStatus.cancelled).group_by("year_str", "month_str").order_by("year_str", "month_str").all()
        result = []
        for r in rows:
            try:
                yr = int(r.year_str); mo = int(r.month_str)
                result.append({"month": f"{calendar.month_abbr[mo]} {yr}", "spend": round(float(r.total), 2)})
            except Exception:
                pass
        return result
    else:
        rows = db.query(
            func.year(PurchaseOrder.order_date).label("year"),
            func.month(PurchaseOrder.order_date).label("month"),
            func.sum(PurchaseOrder.total_amount).label("total")
        ).filter(PurchaseOrder.status != OrderStatus.cancelled).group_by("year", "month").order_by("year", "month").all()
        result = [{"month": f"{calendar.month_abbr[r.month]} {r.year}", "spend": round(float(r.total), 2)} for r in rows]
        return result


@app.get("/dashboard/low-stock")
def low_stock_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).filter(
        Product.current_stock <= Product.reorder_level,
        Product.is_active == True
    ).all()
    return [{"id": p.id, "sku": p.sku, "name": p.name, "category": p.category,
             "current_stock": p.current_stock, "reorder_level": p.reorder_level, "unit": p.unit} for p in products]

# ═══════════════════════════════════════════════════════════════════
#  SUPPLIERS
# ═══════════════════════════════════════════════════════════════════
@app.get("/suppliers")
def list_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).offset(skip).limit(limit).all()
    result = []
    for s in suppliers:
        perf = db.query(SupplierPerformance).filter(SupplierPerformance.supplier_id == s.id).order_by(desc(SupplierPerformance.evaluated_at)).first()
        result.append({
            "id": s.id, "name": s.name, "contact_person": s.contact_person,
            "email": s.email, "phone": s.phone, "category": s.category,
            "payment_terms": s.payment_terms, "lead_time_days": s.lead_time_days,
            "overall_score": perf.overall_score if perf else None,
            "risk_level": perf.risk_level.value if perf else "unknown",
            "created_at": s.created_at.isoformat(),
        })
    return result

@app.get("/suppliers/{supplier_id}")
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    perfs = db.query(SupplierPerformance).filter(SupplierPerformance.supplier_id == supplier_id).order_by(desc(SupplierPerformance.evaluated_at)).limit(10).all()
    orders = db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).order_by(desc(PurchaseOrder.order_date)).limit(10).all()
    return {
        "id": s.id, "name": s.name, "contact_person": s.contact_person,
        "email": s.email, "phone": s.phone, "address": s.address,
        "category": s.category, "payment_terms": s.payment_terms, "lead_time_days": s.lead_time_days,
        "performances": [{"delivery_score": p.delivery_score, "quality_score": p.quality_score,
                          "price_score": p.price_score, "response_score": p.response_score,
                          "overall_score": p.overall_score, "risk_level": p.risk_level.value,
                          "evaluated_at": p.evaluated_at.isoformat()} for p in perfs],
        "recent_orders": [{"order_number": o.order_number, "status": o.status.value,
                           "total_amount": o.total_amount, "order_date": o.order_date.isoformat()} for o in orders],
    }

@app.post("/suppliers")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    supplier = Supplier(**data.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return {"id": supplier.id, "message": "Supplier created successfully"}

@app.put("/suppliers/{supplier_id}")
def update_supplier(supplier_id: int, data: SupplierUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    return {"message": "Supplier updated"}

@app.post("/suppliers/performance")
def add_performance(data: PerformanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    overall = data.delivery_score * 0.35 + data.quality_score * 0.30 + data.price_score * 0.20 + data.response_score * 0.15
    risk_score = (100 - data.delivery_score) * 0.40 + (100 - data.quality_score) * 0.30 + min(data.delivery_delay_days * 5, 100) * 0.20 + min(data.defect_rate * 10, 100) * 0.10
    risk = RiskLevel.low if risk_score <= 20 else (RiskLevel.medium if risk_score <= 50 else RiskLevel.high)
    perf = SupplierPerformance(
        supplier_id=data.supplier_id, order_id=data.order_id,
        delivery_score=data.delivery_score, quality_score=data.quality_score,
        price_score=data.price_score, response_score=data.response_score,
        overall_score=round(overall, 2), risk_level=risk,
        delivery_delay_days=data.delivery_delay_days, defect_rate=data.defect_rate,
    )
    db.add(perf)
    db.commit()
    return {"message": "Performance recorded"}

# ═══════════════════════════════════════════════════════════════════
#  PRODUCTS / INVENTORY
# ═══════════════════════════════════════════════════════════════════
@app.get("/products")
def list_products(skip: int = 0, limit: int = 100, category: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Product).filter(Product.is_active == True)
    if category:
        q = q.filter(Product.category == category)
    products = q.offset(skip).limit(limit).all()
    return [{"id": p.id, "sku": p.sku, "name": p.name, "category": p.category,
             "unit": p.unit, "unit_price": p.unit_price, "current_stock": p.current_stock,
             "reorder_level": p.reorder_level, "max_stock": p.max_stock,
             "stock_status": "low" if p.current_stock <= p.reorder_level else ("ok" if p.current_stock < p.max_stock * 0.8 else "excess")} for p in products]

@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    demand = db.query(DemandHistory).filter(DemandHistory.product_id == product_id).order_by(DemandHistory.year, DemandHistory.month).all()
    return {"id": p.id, "sku": p.sku, "name": p.name, "category": p.category,
            "unit": p.unit, "unit_price": p.unit_price, "current_stock": p.current_stock,
            "reorder_level": p.reorder_level, "max_stock": p.max_stock,
            "demand_history": [{"year": d.year, "month": d.month, "quantity": d.quantity_consumed} for d in demand]}

@app.post("/products")
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = Product(**data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"id": product.id, "message": "Product created"}

@app.put("/products/{product_id}")
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    return {"message": "Product updated"}

@app.get("/products/categories/list")
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cats = db.query(Product.category).distinct().all()
    return [c[0] for c in cats if c[0]]

# ═══════════════════════════════════════════════════════════════════
#  PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════════════
@app.get("/orders")
def list_orders(skip: int = 0, limit: int = 50, status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(PurchaseOrder)
    if status:
        q = q.filter(PurchaseOrder.status == OrderStatus(status))
    orders = q.order_by(desc(PurchaseOrder.created_at)).offset(skip).limit(limit).all()
    result = []
    for o in orders:
        sup = db.query(Supplier).filter(Supplier.id == o.supplier_id).first()
        req = db.query(User).filter(User.id == o.requested_by).first()
        result.append({
            "id": o.id, "order_number": o.order_number,
            "supplier": sup.name if sup else "Unknown",
            "supplier_id": o.supplier_id,
            "requested_by": req.full_name if req else "Unknown",
            "status": o.status.value,
            "order_date": o.order_date.isoformat(),
            "expected_delivery": o.expected_delivery.isoformat() if o.expected_delivery else None,
            "total_amount": o.total_amount,
            "notes": o.notes,
        })
    return result

@app.get("/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    sup = db.query(Supplier).filter(Supplier.id == o.supplier_id).first()
    items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.order_id == order_id).all()
    item_list = []
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        item_list.append({"id": item.id, "product_id": item.product_id,
                          "product_name": prod.name if prod else "Unknown",
                          "sku": prod.sku if prod else "",
                          "quantity": item.quantity, "unit_price": item.unit_price,
                          "total_price": item.total_price, "received_quantity": item.received_quantity})
    return {"id": o.id, "order_number": o.order_number, "supplier": sup.name if sup else "Unknown",
            "status": o.status.value, "order_date": o.order_date.isoformat(),
            "expected_delivery": o.expected_delivery.isoformat() if o.expected_delivery else None,
            "actual_delivery": o.actual_delivery.isoformat() if o.actual_delivery else None,
            "total_amount": o.total_amount, "notes": o.notes, "items": item_list}

@app.post("/orders")
def create_order(data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import random, string
    order_num = "PO-" + ''.join(random.choices(string.digits, k=6))
    total = sum(item.quantity * item.unit_price for item in data.items)
    exp_del = datetime.fromisoformat(data.expected_delivery) if data.expected_delivery else None
    order = PurchaseOrder(
        order_number=order_num, supplier_id=data.supplier_id,
        requested_by=current_user.id, status=OrderStatus.pending,
        expected_delivery=exp_del, total_amount=total, notes=data.notes,
    )
    db.add(order)
    db.flush()
    for item in data.items:
        oi = PurchaseOrderItem(
            order_id=order.id, product_id=item.product_id,
            quantity=item.quantity, unit_price=item.unit_price,
            total_price=item.quantity * item.unit_price,
        )
        db.add(oi)
    db.commit()
    return {"id": order.id, "order_number": order_num, "message": "Purchase order created"}

@app.put("/orders/{order_id}/approve")
def approve_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.admin, UserRole.procurement_manager]:
        raise HTTPException(status_code=403, detail="Not authorized to approve orders")
    o = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    o.status = OrderStatus.approved
    o.approved_by = current_user.id
    db.commit()
    return {"message": "Order approved"}

@app.put("/orders/{order_id}/receive")
def receive_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if o.status == OrderStatus.received:
        raise HTTPException(status_code=400, detail="Order has already been marked as received")
    if o.status == OrderStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cannot receive a cancelled order")
    o.status = OrderStatus.received
    if not o.approved_by:
        o.approved_by = current_user.id
    o.actual_delivery = datetime.utcnow()
    # Update inventory automatically
    items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.order_id == order_id).all()
    for item in items:
        item.received_quantity = item.quantity
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            prod.current_stock = round(float(prod.current_stock + item.quantity), 2)
            inv = Inventory(product_id=item.product_id, quantity_change=item.quantity,
                            transaction_type="purchase", reference_id=order_id,
                            notes=f"Received Purchase Order {o.order_number}")
            db.add(inv)
    db.commit()
    return {"message": "Order marked as received, inventory auto-updated successfully"}

@app.put("/orders/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    o.status = OrderStatus.cancelled
    db.commit()
    return {"message": "Order cancelled"}

# ═══════════════════════════════════════════════════════════════════
#  AI / ML ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
@app.get("/ai/demand-forecast")
def demand_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(DemandHistory).all()
    demand_data = [{"product_id": r.product_id, "year": r.year, "month": r.month, "quantity_consumed": r.quantity_consumed} for r in records]
    predictions = train_demand_model(demand_data)

    result = []
    for product_id, predicted_qty in predictions.items():
        prod = db.query(Product).filter(Product.id == int(product_id)).first()
        if prod:
            shortage = max(0, predicted_qty - prod.current_stock)
            result.append({
                "product_id": product_id,
                "product_name": prod.name,
                "sku": prod.sku,
                "category": prod.category,
                "current_stock": prod.current_stock,
                "predicted_demand": predicted_qty,
                "recommended_order_qty": round(shortage * 1.1, 2),  # 10% buffer
                "needs_reorder": shortage > 0 or prod.current_stock <= prod.reorder_level,
            })
    result.sort(key=lambda x: x["predicted_demand"], reverse=True)
    return {"forecasts": result, "generated_at": datetime.utcnow().isoformat()}

@app.get("/ai/supplier-risk")
def supplier_risk(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    perf_data = []
    for s in suppliers:
        perfs = db.query(SupplierPerformance).filter(SupplierPerformance.supplier_id == s.id).all()
        if perfs:
            perf_data.append({
                "supplier_id": s.id,
                "supplier_name": s.name,
                "delivery_score": sum(p.delivery_score for p in perfs) / len(perfs),
                "quality_score": sum(p.quality_score for p in perfs) / len(perfs),
                "price_score": sum(p.price_score for p in perfs) / len(perfs),
                "response_score": sum(p.response_score for p in perfs) / len(perfs),
                "avg_delay_days": sum(p.delivery_delay_days for p in perfs) / len(perfs),
                "defect_rate": sum(p.defect_rate for p in perfs) / len(perfs),
            })
        else:
            perf_data.append({"supplier_id": s.id, "supplier_name": s.name,
                              "delivery_score": 75, "quality_score": 75, "price_score": 75,
                              "response_score": 75, "avg_delay_days": 2, "defect_rate": 1})

    risk_results = predict_supplier_risk(perf_data)
    # Add supplier names
    for r in risk_results:
        s = db.query(Supplier).filter(Supplier.id == r["supplier_id"]).first()
        r["supplier_name"] = s.name if s else "Unknown"
        r["category"] = s.category if s else ""

    return {"risk_assessments": risk_results, "generated_at": datetime.utcnow().isoformat()}

@app.get("/ai/supplier-recommendations")
def supplier_recommendations(product_category: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suppliers = db.query(Supplier).filter(Supplier.is_active == True)
    if product_category:
        suppliers = suppliers.filter(Supplier.category == product_category)
    suppliers = suppliers.all()

    supplier_data = []
    for s in suppliers:
        perfs = db.query(SupplierPerformance).filter(SupplierPerformance.supplier_id == s.id).all()
        if perfs:
            avg_perf = {
                "supplier_id": s.id,
                "supplier_name": s.name,
                "category": s.category,
                "lead_time_days": s.lead_time_days,
                "delivery_score": sum(p.delivery_score for p in perfs) / len(perfs),
                "quality_score": sum(p.quality_score for p in perfs) / len(perfs),
                "price_score": sum(p.price_score for p in perfs) / len(perfs),
                "response_score": sum(p.response_score for p in perfs) / len(perfs),
                "risk_score": sum(p.overall_score for p in perfs) / len(perfs),
            }
        else:
            avg_perf = {"supplier_id": s.id, "supplier_name": s.name, "category": s.category,
                        "lead_time_days": s.lead_time_days, "delivery_score": 70, "quality_score": 70,
                        "price_score": 70, "response_score": 70, "risk_score": 70}
        supplier_data.append(avg_perf)

    ranked = rank_suppliers(supplier_data, product_category)
    return {"recommendations": ranked, "generated_at": datetime.utcnow().isoformat()}

@app.get("/ai/spend-analysis")
def spend_analysis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(PurchaseOrder).filter(PurchaseOrder.status != OrderStatus.cancelled).all()
    order_data = []
    for o in orders:
        sup = db.query(Supplier).filter(Supplier.id == o.supplier_id).first()
        order_data.append({
            "order_date": o.order_date.isoformat(),
            "total_amount": o.total_amount,
            "supplier_name": sup.name if sup else "Unknown",
            "category": sup.category if sup else "Unknown",
        })
    analysis = analyze_spending(order_data)
    return analysis

@app.get("/ai/dashboard-insights")
def ai_dashboard_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Quick AI insights for the dashboard"""
    # Count risk levels
    all_perfs = db.query(SupplierPerformance).all()
    supplier_risks = {"low": 0, "medium": 0, "high": 0}
    for p in all_perfs:
        supplier_risks[p.risk_level.value] = supplier_risks.get(p.risk_level.value, 0) + 1

    # Demand forecast count needing reorder
    records = db.query(DemandHistory).all()
    demand_data = [{"product_id": r.product_id, "year": r.year, "month": r.month, "quantity_consumed": r.quantity_consumed} for r in records]
    predictions = train_demand_model(demand_data)
    needs_reorder = sum(1 for pid, qty in predictions.items()
                        if (prod := db.query(Product).filter(Product.id == pid).first()) and qty > prod.current_stock)

    return {
        "supplier_risk_distribution": supplier_risks,
        "products_needing_reorder": needs_reorder,
        "total_predictions": len(predictions),
    }

# ═══════════════════════════════════════════════════════════════════
#  USERS
# ═══════════════════════════════════════════════════════════════════
@app.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "full_name": u.full_name, "role": u.role.value, "is_active": u.is_active} for u in users]

@app.get("/health")
def health():
    return {"status": "ok", "service": "Efficient Procurement API", "version": "1.0.0"}
