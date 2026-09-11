from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.modules.patients.models import Patient
from app.modules.referrals.models import Referral
from app.modules.referrals.schemas import ReferralCreate, ReferralResponse, ReferralStatusUpdate

router = APIRouter()


@router.post("/", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(referral_in: ReferralCreate, db: Session = Depends(get_db)):
    """Create a patient referral to a secondary or tertiary facility."""
    patient = db.get(Patient, referral_in.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {referral_in.patient_id} does not exist."
        )

    referral = Referral(**referral_in.model_dump())
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


@router.get("/", response_model=List[ReferralResponse])
def list_referrals(
    patient_id: Optional[int] = Query(None, description="Filter referrals by patient ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by referral status"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List referrals with optional filters for patient or status."""
    query = select(Referral)
    if patient_id is not None:
        query = query.where(Referral.patient_id == patient_id)
    if status_filter:
        query = query.where(Referral.status.ilike(status_filter))
    query = query.order_by(Referral.created_at.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.get("/{referral_id}", response_model=ReferralResponse)
def get_referral(referral_id: int, db: Session = Depends(get_db)):
    """Get referral details by ID."""
    referral = db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referral with ID {referral_id} not found."
        )
    return referral


@router.patch("/{referral_id}/status", response_model=ReferralResponse)
def update_referral_status(
    referral_id: int,
    status_in: ReferralStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update referral status (e.g., PENDING, ACCEPTED, COMPLETED, REJECTED)."""
    referral = db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referral with ID {referral_id} not found."
        )

    referral.status = status_in.status
    db.commit()
    db.refresh(referral)
    return referral
