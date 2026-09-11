from typing import List
import random
import string
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.patients.models import Patient
from app.modules.patients.schemas import PatientResponse
from app.modules.abha.schemas import AbhaEnrollRequest

router = APIRouter()



def _generate_unique_abha_id(db: Session) -> str:
    """Generate a unique ABHA ID in the format ABHA-{random 8 digits}."""
    while True:
        digits = "".join(random.choices(string.digits, k=8))
        candidate = f"ABHA-{digits}"
        existing = db.execute(
            select(Patient).where(Patient.abha_id == candidate)
        ).scalar_one_or_none()
        if not existing:
            return candidate


@router.get("/status")
def abha_status():
    """Check ABHA/ABDM module readiness."""
    return {
        "module": "abha",
        "status": "active",
        "abdm_gateway": "ready",
        "message": "ABHA module ready. Ready for abha-auth branch merge."
    }


@router.post("/enroll", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def enroll_patient(
    enroll_data: AbhaEnrollRequest,
    db: Session = Depends(get_db)
):
    """
    Enroll a new patient by generating an ABHA ID (format: ABHA-{random 8 digits}),
    saving to the patients table, and returning the patient profile.
    """
    abha_id = _generate_unique_abha_id(db)

    patient = Patient(
        abha_id=abha_id,
        name=enroll_data.name,
        age=enroll_data.age,
        gender=enroll_data.gender,
        village=enroll_data.village,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/lookup", response_model=List[PatientResponse])
def lookup_patients(
    q: str = Query(..., description="Search query matching name or village"),
    db: Session = Depends(get_db)
):
    """
    Search existing patients by name or village using case-insensitive partial matching.
    Results are limited to 10 patient profiles.
    """
    stmt = (
        select(Patient)
        .where(
            or_(
                Patient.name.ilike(f"%{q}%"),
                Patient.village.ilike(f"%{q}%"),
            )
        )
        .limit(10)
    )
    return db.execute(stmt).scalars().all()


