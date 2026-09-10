from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.api.v1.router import api_router
from app.modules.patients.router import router as patients_router
from app.modules.visits.router import router as visits_router

# Import all models to ensure they are registered with SQLAlchemy Base.metadata
import app.modules.patients.models
import app.modules.visits.models
import app.modules.referrals.models
import app.modules.stock.models
import app.modules.auth.models
import app.modules.abha.models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("arolink")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    if settings.AUTO_CREATE_TABLES:
        try:
            logger.info("Auto-creating database tables if not exist...")
            create_tables()
            logger.info("Database tables initialized successfully.")
        except Exception as e:
            logger.warning(
                f"Database connection or table auto-creation skipped: {e}. "
                "Ensure PostgreSQL is running and DATABASE_URL is configured."
            )
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Arolink SIH Healthcare Backend Prototype API",
    lifespan=lifespan
)

# Enable CORS for frontend / mobile integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint required by deployment and monitoring."""
    return {"status": "ok"}


# Direct root endpoint access for patients and visits
app.include_router(patients_router, prefix="/patients", tags=["Patients"])
app.include_router(visits_router, prefix="/visits", tags=["Visits"])

# Mount modular API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
