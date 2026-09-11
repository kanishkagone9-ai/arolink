from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.modules.patients.models import Patient
from app.modules.visits.models import Visit
from app.modules.visits.schemas import VisitCreate, VisitResponse

router = APIRouter()


@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_visit(visit_in: VisitCreate, db: Session = Depends(get_db)):
    """Record a clinical visit with symptoms and triage decision ('local' or 'refer')."""
    patient = db.get(Patient, visit_in.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {visit_in.patient_id} does not exist."
        )

    # Normalize symptoms from list or string
    if isinstance(visit_in.symptoms, list):
        symptoms_text = ", ".join(str(s).strip() for s in visit_in.symptoms if s)
    elif visit_in.symptom_list:
        symptoms_text = ", ".join(str(s).strip() for s in visit_in.symptom_list if s)
    elif isinstance(visit_in.symptoms, str):
        symptoms_text = visit_in.symptoms.strip()
    else:
        symptoms_text = None

    visit_date = visit_in.date or date.today()

    visit = Visit(
        patient_id=visit_in.patient_id,
        date=visit_date,
        symptoms=symptoms_text,
        decision=visit_in.decision
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.get("/", response_model=List[VisitResponse])
def list_visits(
    patient_id: Optional[int] = Query(None, description="Filter visits by patient ID"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List clinical visits with optional patient filter."""
    query = select(Visit)
    if patient_id is not None:
        query = query.where(Visit.patient_id == patient_id)
    query = query.order_by(Visit.date.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(visit_id: int, db: Session = Depends(get_db)):
    """Get visit details by ID."""
    visit = db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit with ID {visit_id} not found."
        )
    return visit
