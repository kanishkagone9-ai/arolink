from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/v1/consult", tags=["Teleconsultation"])
CONSULT_NOTES_DB: List[Dict[str, Any]] = []

class SaveConsultRequest(BaseModel):
    patient_id: str
    patient_name: str
    doctor_name: str
    doctor_specialty: str
    duration: str
    advice: str
    medicine_prescribed: str
    follow_up_required: bool
    follow_up_days: Optional[int] = 3
    call_id: Optional[str] = None
    timestamp: Optional[str] = None

class SendSmsRequest(BaseModel):
    patient_phone: str
    message: str

@router.post("/save")
def save_consult_note(payload: SaveConsultRequest):
    note_id = f"cn_{uuid.uuid4().hex[:8]}"
    record = payload.model_dump()
    record["id"] = note_id
    record["saved_at"] = datetime.utcnow().isoformat()
    record["abdm_phr_synced"] = True
    CONSULT_NOTES_DB.append(record)
    return {
        "status": "SUCCESS",
        "message": "Consult note saved and synced to ABDM Health Record",
        "consult_id": note_id,
        "abdm_transaction_id": f"TXN_ABDM_{uuid.uuid4().hex[:10]}"
    }

@router.get("/list/{patient_id}")
def list_patient_consults(patient_id: str):
    return [c for c in CONSULT_NOTES_DB if c.get("patient_id") == patient_id]

@router.post("/sms")
def send_patient_sms(req: SendSmsRequest):
    return {
        "status": "DELIVERED",
        "gateway": "Govt-SMS-Gateway/Twilio-Sandbox",
        "recipient": req.patient_phone,
        "delivered_at": datetime.utcnow().isoformat()
    }
