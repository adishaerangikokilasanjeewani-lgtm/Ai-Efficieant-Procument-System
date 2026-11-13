from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    admin = "admin"
    procurement_manager = "procurement_manager"
    procurement_officer = "procurement_officer"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    ordered = "ordered"
    partially_received = "partially_received"
    received = "received"
    cancelled = "cancelled"

class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    role = Column(Enum(UserRole), default=UserRole.procurement_officer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(200))
    email = Column(String(200))
    phone = Column(String(50))
    address = Column(Text)
    category = Column(String(100))
    payment_terms = Column(String(100))
    lead_time_days = Column(Integer, default=7)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    performances = relationship("SupplierPerformance", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    unit = Column(String(50), default="units")
    unit_price = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0)
    reorder_level = Column(Float, default=10.0)
    max_stock = Column(Float, default=500.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    order_items = relationship("PurchaseOrderItem", back_populates="product")
    inventory_records = relationship("Inventory", back_populates="product")
    demand_history = relationship("DemandHistory", back_populates="product")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    requested_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    total_amount = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="order")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0.0)
    order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_change = Column(Float, nullable=False)
    transaction_type = Column(String(50))  # "purchase", "consumption", "adjustment"
    reference_id = Column(Integer, nullable=True)
    notes = Column(Text)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="inventory_records")

class SupplierPerformance(Base):
    __tablename__ = "supplier_performance"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    delivery_score = Column(Float, default=0.0)   # 0-100: on-time delivery
    quality_score = Column(Float, default=0.0)    # 0-100: quality rating
    price_score = Column(Float, default=0.0)      # 0-100: competitive pricing
    response_score = Column(Float, default=0.0)   # 0-100: responsiveness
    overall_score = Column(Float, default=0.0)    # computed weighted average
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.low)
    delivery_delay_days = Column(Integer, default=0)
    defect_rate = Column(Float, default=0.0)
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="performances")

class DemandHistory(Base):
    __tablename__ = "demand_history"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    year = Column(Integer)
    month = Column(Integer)
    quantity_consumed = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="demand_history")

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    contract_number = Column(String(100))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    value = Column(Float)
    payment_terms = Column(String(200))
    delivery_terms = Column(String(200))
    penalty_clause = Column(Text)
    status = Column(String(50), default="active")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
