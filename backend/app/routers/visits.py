import uuid
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..schemas.models import CreateVisitRequest, BatchSyncVisitsRequest, PastVisit
from .patients import MOCK_PATIENT_DB

router = APIRouter(prefix=\"/api/v1/visits\", tags=[\"Visits\"])

VISIT_LEDGER: List[Dict[str, Any]] = []

@router.post(\"\")
def create_visit(visit: CreateVisitRequest):
    \"\"\"Records a new visit from ASHA worker and appends to patient's ABHA PHR record\"\"\"
    visit_id = f\"v_{uuid.uuid4().hex[:8]}\"
    visit_record = visit.model_dump()
    visit_record[\"id\"] = visit_id
    VISIT_LEDGER.append(visit_record)

    # Append to patient's past visits if registered
    if visit.patientAbhaId in MOCK_PATIENT_DB:
        new_past_visit = PastVisit(
            id=visit_id,
            date=visit.date,
            symptoms=visit.symptoms,
            symptomsDisplay=visit.symptomsDisplay,
            decision=visit.decision,
            medicinesDispensed=visit.medicinesDispensed,
            notes=visit.notes
        )
        MOCK_PATIENT_DB[visit.patientAbhaId].pastVisits.insert(0, new_past_visit)

    return {
        \"status\": \"SUCCESS\",
        \"message\": \"Visit record successfully persisted to ABDM PHR\",
        \"visitId\": visit_id,
        \"synced\": True
    }

@router.post(\"/sync\")
def sync_offline_visits(payload: BatchSyncVisitsRequest):
    \"\"\"Batch endpoint to replay and persist offline-queued visits upon reconnection\"\"\"
    synced_ids = []
    for visit in payload.visits:
        visit_id = f\"v_{uuid.uuid4().hex[:8]}\"
        visit_record = visit.model_dump()
        visit_record[\"id\"] = visit_id
        VISIT_LEDGER.append(visit_record)

        if visit.patientAbhaId in MOCK_PATIENT_DB:
            new_past_visit = PastVisit(
                id=visit_id,
                date=visit.date,
                symptoms=visit.symptoms,
                symptomsDisplay=visit.symptomsDisplay,
                decision=visit.decision,
                medicinesDispensed=visit.medicinesDispensed,
                notes=visit.notes
            )
            MOCK_PATIENT_DB[visit.patientAbhaId].pastVisits.insert(0, new_past_visit)
        
        synced_ids.append(visit.offlineId or visit_id)

    return {
        \"status\": \"SUCCESS\",
        \"message\": f\"Successfully synced {len(synced_ids)} offline visits to ABDM registry\",
        \"syncedCount\": len(synced_ids),
        \"syncedOfflineIds\": synced_ids
    }
