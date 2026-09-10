from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, date

router = APIRouter(tags=["Follow-ups & High-Risk Tasks"])

FOLLOWUPS_DB: List[Dict[str, Any]] = [
    {
        "id": "f_1",
        "patient_id": "ABHA-1234-5678-9012",
        "patient_name": "Ramesh Kumar",
        "village": "Dharampur",
        "reason": "Maternal ANC follow-up check: High BP observed",
        "due_date": date.today().isoformat(),
        "priority": "HIGH",
        "status": "pending",
        "asha_id": "ASHA_01"
    }
]

PATIENT_FLAGS_DB: Dict[str, Dict[str, Any]] = {
    "ABHA-1234-5678-9012": {
        "high_risk_flag": True,
        "flag_reason": "maternal",
        "last_visit_date": "2026-08-15"
    }
}

class CreateFollowupRequest(BaseModel):
    patient_id: str
    reason: str
    due_date: str
    priority: Optional[str] = "HIGH"
    asha_id: Optional[str] = "ASHA_01"

class FlagPatientRequest(BaseModel):
    patient_id: str
    flag_reason: str

@router.post("/api/v1/followup/create")
def create_followup(req: CreateFollowupRequest):
    f_id = f"f_{uuid.uuid4().hex[:8]}"
    item = req.model_dump()
    item["id"] = f_id
    item["status"] = "pending"
    item["created_at"] = datetime.utcnow().isoformat()
    FOLLOWUPS_DB.append(item)
    return {
        "status": "SUCCESS",
        "message": "Follow-up successfully scheduled in ASHA morning task list",
        "followup_id": f_id
    }

@router.get("/api/v1/tasks/today")
def get_today_tasks(asha_id: str = "ASHA_01", lang: str = "mr"):
    today_str = date.today().isoformat()
    tasks = []
    
    for f in FOLLOWUPS_DB:
        if f.get("status") == "pending":
            tasks.append({
                "task_id": f["id"],
                "patient_id": f["patient_id"],
                "patient_name": f.get("patient_name", "Ramesh Kumar"),
                "village": f.get("village", "Dharampur"),
                "priority": f.get("priority", "HIGH"),
                "due_date": f["due_date"],
                "reason": f["reason"]
            })
            
    return {
        "date": today_str,
        "asha_id": asha_id,
        "total_tasks": len(tasks),
        "tasks": tasks
    }

@router.post("/api/v1/patients/flag")
def flag_patient(req: FlagPatientRequest):
    PATIENT_FLAGS_DB[req.patient_id] = {
        "high_risk_flag": True,
        "flag_reason": req.flag_reason,
        "flagged_at": datetime.utcnow().isoformat()
    }
    return {
        "status": "SUCCESS",
        "message": f"Patient {req.patient_id} flagged as HIGH RISK ({req.flag_reason})"
    }

@router.get("/api/v1/patients/high-risk")
def get_high_risk_patients(asha_id: str = "ASHA_01"):
    return [
        {"patient_id": pid, **details}
        for pid, details in PATIENT_FLAGS_DB.items()
        if details.get("high_risk_flag")
    ]
