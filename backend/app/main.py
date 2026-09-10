from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import patients, visits, teleconsult, followup

app = FastAPI(
    title="AroLink (SwasthSetu) Backend API",
    description="FastAPI bridge connecting ASHA workers to ABDM (ABHA, PHR, HFR), WebRTC teleconsult & offline sync engine",
    version="1.0.0"
)

# Enable CORS for React Native, Expo, and Web Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(visits.router)
app.include_router(teleconsult.router)
app.include_router(followup.router)

@app.get("/")
def root():
    return {
        "service": "AroLink API Gateway",
        "status": "OPERATIONAL",
        "abdm_sandbox": "CONNECTED",
        "modules": ["ABHA Registry", "Triage CDSS", "Teleconsultation", "Followup Automation"],
        "supported_languages": ["en", "hi", "mr"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
