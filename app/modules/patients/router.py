from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.core.database import get_db
from app.modules.patients.models import Patient
from app.modules.visits.models import Visit
from app.modules.visits.schemas import VisitResponse
from app.modules.patients.schemas import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    PatientWithVisitsResponse,
)

router = APIRouter()


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    """Register a new patient."""
    if patient_in.abha_id:
        existing = db.execute(
            select(Patient).where(Patient.abha_id == patient_in.abha_id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Patient with ABHA ID '{patient_in.abha_id}' already exists."
            )

    patient = Patient(**patient_in.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name or ABHA ID"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve patients with optional search and pagination."""
    query = select(Patient)
    if search:
        query = query.where(
            or_(
                Patient.name.ilike(f"%{search}%"),
                Patient.abha_id.ilike(f"%{search}%"),
                Patient.village.ilike(f"%{search}%")
            )
        )
    query = query.offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.get("/{abha_id}", response_model=PatientWithVisitsResponse)
def get_patient_by_abha_id(abha_id: str, db: Session = Depends(get_db)):
    """Return the patient's profile and their last 5 visits by ABHA ID (or ID)."""
    patient = db.execute(
        select(Patient).where(Patient.abha_id == abha_id)
    ).scalar_one_or_none()

    # Fallback to integer primary key id if not matched by ABHA ID
    if not patient and abha_id.isdigit():
        patient = db.get(Patient, int(abha_id))

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ABHA ID '{abha_id}' not found."
        )

    # Fetch last 5 visits ordered by date desc, id desc
    recent_visits = db.execute(
        select(Visit)
        .where(Visit.patient_id == patient.id)
        .order_by(Visit.date.desc(), Visit.id.desc())
        .limit(5)
    ).scalars().all()

    visit_responses = [VisitResponse.model_validate(v) for v in recent_visits]
    profile_response = PatientResponse.model_validate(patient)

    return PatientWithVisitsResponse(
        id=patient.id,
        abha_id=patient.abha_id,
        name=patient.name,
        village=patient.village,
        age=patient.age,
        gender=patient.gender,
        visits=visit_responses,
        patient=profile_response,
        profile=profile_response
    )


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db)
):
    """Update patient details."""
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found."
        )

    update_data = patient_update.model_dump(exclude_unset=True)
    if "abha_id" in update_data and update_data["abha_id"] != patient.abha_id:
        existing = db.execute(
            select(Patient).where(Patient.abha_id == update_data["abha_id"])
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Patient with ABHA ID '{update_data['abha_id']}' already exists."
            )

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient
