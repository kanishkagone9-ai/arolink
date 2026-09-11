from fastapi import APIRouter

from app.modules.patients.router import router as patients_router
from app.modules.visits.router import router as visits_router
from app.modules.referrals.router import router as referrals_router
from app.modules.stock.router import router as stock_router
from app.modules.auth.router import router as auth_router
from app.modules.abha.router import router as abha_router

api_router = APIRouter()

# Core Prototype Healthcare Endpoints
api_router.include_router(patients_router, prefix="/patients", tags=["Patients"])
api_router.include_router(visits_router, prefix="/visits", tags=["Visits"])
api_router.include_router(referrals_router, prefix="/referrals", tags=["Referrals"])
api_router.include_router(stock_router, prefix="/stock", tags=["Stock"])

# Modular Placeholders (Plug-and-play for parallel feature branches)
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(abha_router, prefix="/abha", tags=["ABHA"])
