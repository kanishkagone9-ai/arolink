from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReferralBase(BaseModel):
    patient_id: int
    facility: str
    status: Optional[str] = "PENDING"


class ReferralCreate(ReferralBase):
    pass


class ReferralStatusUpdate(BaseModel):
    status: str


class ReferralResponse(BaseModel):
    id: int
    patient_id: int
    facility: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
