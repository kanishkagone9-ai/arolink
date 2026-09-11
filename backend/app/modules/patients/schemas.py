from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.modules.visits.schemas import VisitResponse


class PatientBase(BaseModel):
    abha_id: Optional[str] = None
    name: str
    village: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    abha_id: Optional[str] = None
    name: Optional[str] = None
    village: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class PatientResponse(PatientBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PatientWithVisitsResponse(PatientResponse):
    visits: List[VisitResponse] = []
    patient: Optional[PatientResponse] = None
    profile: Optional[PatientResponse] = None

    model_config = ConfigDict(from_attributes=True)

