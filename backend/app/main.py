from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import patients, visits

app = FastAPI(
    title=\"AroLink (SwasthSetu) Backend API\",
    description=\"FastAPI bridge connecting ASHA workers to ABDM (ABHA, PHR, HFR) & offline sync engine\",
    version=\"1.0.0\"
)

# Enable CORS for React Native, Expo, and Web Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[\"*\"],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

app.include_router(patients.router)
app.include_router(visits.router)

@app.get(\"/\")
def root():
    return {
        \"service\": \"AroLink API Gateway\",
        \"status\": \"OPERATIONAL\",
        \"abdm_sandbox\": \"CONNECTED\",
        \"supported_languages\": [\"en\", \"hi\", \"mr\"]
    }

@app.get(\"/health\")
def health_check():
    return {\"status\": \"healthy\"}
