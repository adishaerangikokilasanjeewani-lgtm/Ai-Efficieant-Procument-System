"""
Dummy data seed script for AI-Powered Efficient Procurement System.
Run: py seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.database import engine, SessionLocal
from app.models import Base, User, Supplier, Product, PurchaseOrder, PurchaseOrderItem, SupplierPerformance, DemandHistory, Inventory, Contract, UserRole, OrderStatus, RiskLevel
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("🌱 Seeding database with dummy data...")

# ── Clear existing ────────────────────────────────────────────────
db.query(Contract).delete()
db.query(DemandHistory).delete()
db.query(Inventory).delete()
db.query(SupplierPerformance).delete()
db.query(PurchaseOrderItem).delete()
db.query(PurchaseOrder).delete()
db.query(Product).delete()
db.query(Supplier).delete()
db.query(User).delete()
db.commit()
print("✅ Cleared existing data")

# ── USERS ─────────────────────────────────────────────────────────
users_data = [
    {"username": "admin", "email": "admin@company.com", "password": "admin123", "full_name": "System Administrator", "role": UserRole.admin},
    {"username": "manager", "email": "manager@company.com", "password": "manager123", "full_name": "Procurement Manager", "role": UserRole.procurement_manager},
    {"username": "officer1", "email": "officer1@company.com", "password": "officer123", "full_name": "Kamal Perera", "role": UserRole.procurement_officer},
    {"username": "officer2", "email": "officer2@company.com", "password": "officer123", "full_name": "Nimal Silva", "role": UserRole.procurement_officer},
]
users = []
for ud in users_data:
    u = User(username=ud["username"], email=ud["email"], hashed_password=get_password_hash(ud["password"]),
             full_name=ud["full_name"], role=ud["role"])
    db.add(u)
    users.append(u)
db.commit()
print(f"✅ Created {len(users)} users")

# ── SUPPLIERS ─────────────────────────────────────────────────────
suppliers_raw = [
    ("TechStar Electronics", "Sunil Jayawardena", "sunil@techstar.lk", "+94 11 234 5678", "No. 45 Galle Rd, Colombo 03", "Electronics", "Net 30", 7),
    ("BuildMaster Supplies", "Rohan Fernando", "rohan@buildmaster.lk", "+94 11 345 6789", "128 Main St, Kandy", "Construction", "Net 45", 14),
    ("Lanka IT Solutions", "Amara Dissanayake", "amara@lankait.lk", "+94 11 456 7890", "56 Hospital Rd, Galle", "IT Equipment", "Net 30", 5),
    ("GlobalNet Traders", "Priya Mendis", "priya@globalnet.lk", "+94 11 567 8901", "89 Lake Rd, Negombo", "General Supplies", "Net 60", 21),
    ("Pacific Electro Co.", "Chaminda Rathnayake", "chaminda@pacific.lk", "+94 11 678 9012", "34 Union Pl, Colombo 02", "Electronics", "Net 30", 10),
    ("SriTech Components", "Dilrukshi Wijesinghe", "dilrukshi@sritech.lk", "+94 11 789 0123", "67 Galle Rd, Matara", "Electronics", "Net 15", 3),
    ("Mega Office Supplies", "Kumara Bandara", "kumara@megaoffice.lk", "+94 11 890 1234", "23 High St, Kurunegala", "Office Supplies", "Net 30", 7),
    ("CeylonPlast Industries", "Nimali Seneviratne", "nimali@ceylonplast.lk", "+94 11 901 2345", "12 Industrial Zone, Biyagama", "Plastics", "Net 45", 14),
    ("Island Furniture Ltd", "Asanka Gunasekera", "asanka@islandfurn.lk", "+94 11 012 3456", "78 Kandy Rd, Kiribathgoda", "Furniture", "Net 30", 21),
    ("Premier Stationery", "Tharaka Jayasena", "tharaka@premier.lk", "+94 11 123 4567", "45 Baseline Rd, Colombo 09", "Office Supplies", "Net 15", 5),
    ("NetGear Lanka", "Sachini Perera", "sachini@netgearlk.com", "+94 11 234 5679", "23 Union Pl, Colombo 02", "IT Equipment", "Net 30", 7),
    ("FastPrint Solutions", "Ruwan Silva", "ruwan@fastprint.lk", "+94 11 345 6780", "67 Maradana Rd, Colombo 10", "Printing", "Net 30", 10),
    ("Green Energy Supplies", "Chamari Jayawardena", "chamari@greenenergy.lk", "+94 11 456 7891", "89 Kotte Rd, Sri Jayawardenepura", "Electrical", "Net 45", 14),
    ("Atlas Hardware", "Janaka Kumara", "janaka@atlas.lk", "+94 11 567 8902", "56 Pettah Market, Colombo 11", "Hardware", "Net 30", 7),
    ("SwiftLogistics LK", "Madhavi Fernando", "madhavi@swiftlog.lk", "+94 11 678 9013", "34 Port City, Colombo 01", "Logistics", "Net 15", 3),
    ("CleanTech Supplies", "Isuru Rathnayake", "isuru@cleantech.lk", "+94 11 789 0124", "12 Industrial Rd, Horana", "Cleaning", "Net 30", 7),
    ("BioMed Lanka", "Thilini Dissanayake", "thilini@biomed.lk", "+94 11 890 1235", "45 Medical Centre Rd, Ragama", "Medical", "Net 45", 14),
    ("SafetyFirst Gear", "Kavinda Mendis", "kavinda@safetyfirst.lk", "+94 11 901 2346", "78 Ja-Ela Rd, Gampaha", "Safety Equipment", "Net 30", 10),
    ("Summit Telecom", "Oshadi Wijesinghe", "oshadi@summit.lk", "+94 11 012 3457", "23 Bauddhaloka Maw, Colombo 04", "Telecommunications", "Net 45", 21),
    ("SmartGen Technologies", "Pathum Bandara", "pathum@smartgen.lk", "+94 11 123 4568", "67 Nawala Rd, Rajagiriya", "IT Equipment", "Net 30", 7),
]

suppliers = []
for sd in suppliers_raw:
    s = Supplier(name=sd[0], contact_person=sd[1], email=sd[2], phone=sd[3], address=sd[4],
                 category=sd[5], payment_terms=sd[6], lead_time_days=sd[7])
    db.add(s)
    suppliers.append(s)
db.commit()
print(f"✅ Created {len(suppliers)} suppliers")

# ── PRODUCTS ──────────────────────────────────────────────────────
products_raw = [
    # Electronics
    ("EL-001", "Laptop Computer 15.6\"", "Electronics", "Business laptop i5 8GB RAM", "units", 185000, 12, 5, 50),
    ("EL-002", "Desktop Computer", "Electronics", "Office desktop computer", "units", 145000, 8, 3, 30),
    ("EL-003", "Monitor 24\"", "Electronics", "Full HD LED monitor", "units", 35000, 20, 8, 60),
    ("EL-004", "Wireless Keyboard & Mouse", "Electronics", "Combo set", "units", 4500, 45, 15, 150),
    ("EL-005", "UPS 1500VA", "Electronics", "Uninterruptible power supply", "units", 22000, 10, 4, 40),
    ("EL-006", "Network Switch 24-Port", "Electronics", "Managed L2 switch", "units", 65000, 5, 2, 20),
    ("EL-007", "IP Camera", "Electronics", "4MP surveillance camera", "units", 18500, 15, 5, 60),
    ("EL-008", "Printer Toner Black", "Electronics", "Compatible toner cartridge", "units", 8500, 30, 10, 120),
    # IT Equipment
    ("IT-001", "Network Cable Cat6 (100m)", "IT Equipment", "Cat6 UTP cable roll", "rolls", 5500, 18, 8, 80),
    ("IT-002", "Wi-Fi Router", "IT Equipment", "AC1200 dual-band router", "units", 12000, 12, 4, 50),
    ("IT-003", "Server HDD 4TB", "IT Equipment", "Enterprise SATA hard drive", "units", 28000, 8, 3, 30),
    ("IT-004", "RAM DDR4 16GB", "IT Equipment", "Server memory module", "units", 12500, 20, 8, 60),
    ("IT-005", "USB Hub 4-Port", "IT Equipment", "USB 3.0 hub", "units", 2800, 35, 15, 120),
    # Office Supplies
    ("OS-001", "A4 Paper (500 sheets)", "Office Supplies", "80gsm copy paper ream", "reams", 850, 120, 50, 500),
    ("OS-002", "Ballpoint Pens (Box 12)", "Office Supplies", "Blue ballpoint pens", "boxes", 320, 60, 20, 200),
    ("OS-003", "Stapler Heavy Duty", "Office Supplies", "25-sheet capacity stapler", "units", 1800, 25, 10, 80),
    ("OS-004", "File Folders (Box 50)", "Office Supplies", "Manilla folders", "boxes", 1200, 40, 15, 150),
    ("OS-005", "Whiteboard Markers Set", "Office Supplies", "4-color set", "sets", 680, 50, 20, 200),
    ("OS-006", "Correction Fluid", "Office Supplies", "Water-based correction fluid", "units", 180, 80, 30, 300),
    # Furniture
    ("FU-001", "Office Chair Ergonomic", "Furniture", "Adjustable ergonomic chair", "units", 28500, 15, 5, 60),
    ("FU-002", "Office Desk 1200x600", "Furniture", "Steel-frame office desk", "units", 18000, 8, 3, 30),
    ("FU-003", "Filing Cabinet 4-drawer", "Furniture", "Steel filing cabinet", "units", 32000, 5, 2, 20),
    ("FU-004", "Bookshelf 5-Tier", "Furniture", "Metal bookshelf", "units", 12500, 6, 3, 25),
    # Cleaning
    ("CL-001", "Floor Cleaner 5L", "Cleaning", "Industrial floor cleaner", "bottles", 2200, 25, 10, 100),
    ("CL-002", "Hand Sanitizer 500ml", "Cleaning", "70% alcohol sanitizer", "bottles", 680, 80, 30, 300),
    ("CL-003", "Garbage Bags Large (50pcs)", "Cleaning", "Heavy-duty black bags", "packs", 450, 40, 15, 150),
    ("CL-004", "Mop and Bucket Set", "Cleaning", "Industrial spin mop", "units", 3500, 8, 3, 30),
    # Safety Equipment
    ("SE-001", "Safety Helmet", "Safety Equipment", "ANSI-certified hard hat", "units", 2800, 25, 10, 80),
    ("SE-002", "Safety Gloves (Pair)", "Safety Equipment", "Cut-resistant work gloves", "pairs", 850, 50, 20, 200),
    ("SE-003", "First Aid Kit", "Safety Equipment", "50-piece first aid kit", "units", 4500, 12, 5, 50),
]

products = []
for pd_data in products_raw:
    p = Product(sku=pd_data[0], name=pd_data[1], category=pd_data[2], description=pd_data[3],
                unit=pd_data[4], unit_price=pd_data[5], current_stock=pd_data[6],
                reorder_level=pd_data[7], max_stock=pd_data[8])
    db.add(p)
    products.append(p)
db.commit()
print(f"✅ Created {len(products)} products")

# ── DEMAND HISTORY (12 months) ────────────────────────────────────
random.seed(42)
demand_count = 0
for product in products:
    base_demand = product.reorder_level * 3
    for month_offset in range(12):
        mo = 12 - month_offset
        yr = 2025 if mo > 0 else 2026
        mo = ((datetime.now().month - month_offset - 1) % 12) + 1
        yr = 2025 if month_offset >= datetime.now().month else 2026
        # Seasonality: boost Q4 purchases
        seasonal_factor = 1.3 if mo in [10, 11, 12] else (0.9 if mo in [1, 2] else 1.0)
        qty = max(1, base_demand * seasonal_factor * random.uniform(0.7, 1.4))
        dh = DemandHistory(product_id=product.id, year=2025 if month_offset > 5 else 2026,
                           month=mo, quantity_consumed=round(qty, 2))
        db.add(dh)
        demand_count += 1

db.commit()
print(f"✅ Created {demand_count} demand history records")

# ── PURCHASE ORDERS ───────────────────────────────────────────────
statuses = [OrderStatus.received, OrderStatus.received, OrderStatus.received, OrderStatus.approved, OrderStatus.pending, OrderStatus.cancelled]
order_count = 0
for i in range(200):
    supplier = random.choice(suppliers)
    requester = random.choice(users)
    days_ago = random.randint(1, 365)
    order_date = datetime.utcnow() - timedelta(days=days_ago)
    status = random.choice(statuses)
    expected_del = order_date + timedelta(days=supplier.lead_time_days + random.randint(-2, 5))
    actual_del = expected_del + timedelta(days=random.randint(-2, 7)) if status == OrderStatus.received else None

    # Pick 1-4 products
    selected_products = random.sample(products, k=random.randint(1, 4))
    total = 0
    items_data = []
    for prod in selected_products:
        qty = round(random.uniform(5, 50), 0)
        price = prod.unit_price * random.uniform(0.9, 1.1)
        total += qty * price
        items_data.append((prod, qty, price))

    order_num = f"PO-{str(i+1).zfill(6)}"
    order = PurchaseOrder(
        order_number=order_num, supplier_id=supplier.id, requested_by=requester.id,
        status=status, order_date=order_date, expected_delivery=expected_del,
        actual_delivery=actual_del, total_amount=round(total, 2),
        notes=f"Sample purchase order #{i+1}",
    )
    db.add(order)
    db.flush()
    for prod, qty, price in items_data:
        oi = PurchaseOrderItem(order_id=order.id, product_id=prod.id, quantity=qty,
                               unit_price=price, total_price=qty * price)
        db.add(oi)
    order_count += 1

db.commit()
print(f"✅ Created {order_count} purchase orders")

# ── SUPPLIER PERFORMANCE ──────────────────────────────────────────
perf_count = 0
for supplier in suppliers:
    # Base scores for this supplier (some good, some risky)
    base_delivery = random.uniform(55, 98)
    base_quality = random.uniform(60, 97)
    base_price = random.uniform(55, 95)
    base_response = random.uniform(65, 99)

    for _ in range(random.randint(3, 8)):
        delivery = min(100, max(0, base_delivery + random.uniform(-10, 10)))
        quality = min(100, max(0, base_quality + random.uniform(-8, 8)))
        price = min(100, max(0, base_price + random.uniform(-10, 10)))
        response = min(100, max(0, base_response + random.uniform(-5, 5)))
        delay = max(0, int(random.gauss(2 if delivery > 80 else 8, 2)))
        defect = max(0, round(random.gauss(1 if quality > 85 else 5, 1), 2))
        overall = delivery * 0.35 + quality * 0.30 + price * 0.20 + response * 0.15
        risk_score = (100 - delivery) * 0.40 + (100 - quality) * 0.30 + min(delay * 5, 100) * 0.20 + min(defect * 10, 100) * 0.10
        risk = RiskLevel.low if risk_score <= 20 else (RiskLevel.medium if risk_score <= 50 else RiskLevel.high)

        perf = SupplierPerformance(
            supplier_id=supplier.id, delivery_score=round(delivery, 2),
            quality_score=round(quality, 2), price_score=round(price, 2),
            response_score=round(response, 2), overall_score=round(overall, 2),
            risk_level=risk, delivery_delay_days=delay, defect_rate=defect,
            evaluated_at=datetime.utcnow() - timedelta(days=random.randint(1, 180)),
        )
        db.add(perf)
        perf_count += 1

db.commit()
print(f"✅ Created {perf_count} supplier performance records")

# ── CONTRACTS ─────────────────────────────────────────────────────
contract_count = 0
for i, supplier in enumerate(suppliers[:10]):
    start = datetime.utcnow() - timedelta(days=random.randint(30, 365))
    end = start + timedelta(days=365)
    contract = Contract(
        supplier_id=supplier.id, contract_number=f"CON-2025-{str(i+1).zfill(3)}",
        start_date=start, end_date=end, value=round(random.uniform(500000, 5000000), 2),
        payment_terms=supplier.payment_terms, delivery_terms=f"Deliver within {supplier.lead_time_days} days",
        penalty_clause="5% penalty per week for late delivery exceeding 7 days.",
        status="active" if end > datetime.utcnow() else "expired",
        notes=f"Annual supply contract with {supplier.name}",
    )
    db.add(contract)
    contract_count += 1

db.commit()
print(f"✅ Created {contract_count} contracts")

print("\n" + "="*50)
print("🎉 Database seeded successfully!")
print("="*50)
print("\n📋 Login Credentials:")
print("  Admin:   username=admin    | password=admin123")
print("  Manager: username=manager  | password=manager123")
print("  Officer: username=officer1 | password=officer123")
print("\n🚀 Start backend: uvicorn app.main:app --reload --port 8000")
