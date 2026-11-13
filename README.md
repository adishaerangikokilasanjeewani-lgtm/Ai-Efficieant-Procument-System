# 🏢 AI-Powered Efficient Procurement System

**Full-stack procurement management system** with AI demand forecasting, supplier risk prediction, and spend analysis.

> ⚠️ **Sample/Dummy Data** — This system uses synthetic data for demonstration purposes. All suppliers, products, purchase orders and performance records are artificially generated.

---

## 📦 Project Structure

```
efficient-procurement-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes (all endpoints)
│   │   ├── models.py        # SQLAlchemy database models
│   │   ├── database.py      # DB connection (MySQL or SQLite)
│   │   ├── auth.py          # JWT authentication
│   │   └── ml.py            # AI/ML models (demand forecast, risk, ranking)
│   ├── seed.py              # Dummy data seeder
│   ├── requirements.txt
│   └── .env                 # Environment configuration
└── frontend/
    ├── src/
    │   ├── pages/           # Dashboard, Products, Orders, AI pages
    │   ├── components/      # Shared UI components
    │   ├── context/         # Auth context
    │   └── services/api.js  # Axios API calls
    └── package.json
```

---

## 🚀 Quick Start

### Option 1: SQLite (Default — No MySQL needed)

The `.env` file already has `USE_SQLITE=true`. Just run:

```powershell
# Terminal 1 — Backend
cd backend
py -m pip install -r requirements.txt
py seed.py
py -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Option 2: MySQL

1. Start MySQL service (as Administrator)
2. Create database: `CREATE DATABASE procurement_db;`
3. In `backend/.env`, set `USE_SQLITE=false` and fill in your MySQL password
4. Then run the same commands above

---

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Manager** | `manager` | `manager123` |
| **Officer** | `officer1` | `officer123` |

---

## 🧠 AI Features

| Feature | Model | Description |
|---------|-------|-------------|
| **Demand Forecast** | Random Forest Regressor | Predicts next month demand per product |
| **Supplier Risk** | Weighted scoring | Classifies suppliers as Low/Medium/High risk |
| **Supplier Ranking** | Multi-criteria scoring | Ranks suppliers by delivery, quality, price, response |
| **Spend Analysis** | Statistical analysis | Monthly trends, category breakdown, top suppliers |

---

## 📊 System Modules

1. **Dashboard** — KPIs, spend chart, low-stock alerts, AI insights
2. **Products & Inventory** — Product catalog, stock levels, reorder alerts
3. **Suppliers** — Supplier management, performance scores, risk levels
4. **Purchase Orders** — Create, approve, receive orders; status tracking
5. **AI Demand Forecast** — Next-month predictions with reorder recommendations
6. **Supplier Risk & Ranking** — Risk assessment + radar chart + supplier recommendations
7. **Spend Analysis** — Monthly trend, category pie, top supplier bar charts

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Recharts |
| Backend | Python 3.12 + FastAPI |
| Database | SQLite (default) / MySQL 8.0 |
| AI/ML | Scikit-learn (RandomForest) |
| Auth | JWT (python-jose) + bcrypt |

---

## 🔄 Switching to MySQL (Production)

When MySQL is available and running:

```env
# backend/.env
USE_SQLITE=false
DB_HOST=localhost
DB_PORT=3306
DB_NAME=procurement_db
DB_USER=root
DB_PASSWORD=your_password_here
```

Then restart the backend. The app will connect to MySQL automatically.
