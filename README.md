# Arolink

SIH Healthcare Prototype — FastAPI Backend

Modular, production-ready healthcare backend built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy 2.0**.

---

## 🚀 Features

- **Health Check**: `GET /health` returns `{"status": "ok"}` for uptime monitoring.
- **Patients Module**: Registration and search with `abha_id`, `name`, `village`, `age`, and `gender`.
- **Visits Module**: Clinical encounters recording `patient_id`, `date`, `symptoms`, and `decision`.
- **Referrals Module**: Facility referral tracking with `patient_id`, `facility`, `status`, and `created_at`.
- **Stock Module**: Medicine and medical supply tracking with `medicine_name`, `quantity`, and dispense/receive adjustment endpoints.
- **Pluggable Architecture**: Modular placeholders for **Authentication** (`/api/v1/auth`) and **ABHA / ABDM** (`/api/v1/abha`) to support seamless integration from parallel branches (`asha-login`, `abha-auth`).

---

## 📁 Modular Directory Structure

```
arolink/
├── .env.example              # Environment variables template
├── requirements.txt          # Python dependencies
├── alembic.ini               # Alembic database migration config
├── migrations/               # Alembic migration scripts
│   └── env.py                # Automatic discovery of all module models
├── tests/
│   └── test_api.py           # Automated test suite
└── app/
    ├── main.py               # FastAPI app factory, CORS, /health, router inclusion
    ├── core/
    │   ├── config.py         # Pydantic Settings (.env configuration)
    │   └── database.py       # SQLAlchemy engine, session maker, get_db
    ├── common/
    │   └── models.py         # Reusable TimestampMixin
    ├── modules/
    │   ├── patients/         # Patient models, schemas, router
    │   ├── visits/           # Visit models, schemas, router
    │   ├── referrals/        # Referral models, schemas, router
    │   ├── stock/            # Inventory models, schemas, router
    │   ├── auth/             # Modular auth placeholder
    │   └── abha/             # Modular ABHA/ABDM placeholder
    └── api/
        └── v1/
            └── router.py     # Aggregated v1 API router
```

---

## 🛠️ Quickstart

### 1. Environment Setup
```powershell
# Activate virtual environment (Windows)
.venv\Scripts\Activate.ps1

# Or create a new one:
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure Database
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Set your PostgreSQL credentials in `.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/arolink_db
AUTO_CREATE_TABLES=True
```

### 3. Run Development Server
```powershell
uvicorn app.main:app --reload --port 8000
```

### 4. Interactive API Documentation
Open your browser to:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running Tests
```powershell
python tests/test_api.py
```
