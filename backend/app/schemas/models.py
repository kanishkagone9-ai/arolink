from pydantic import BaseModel, Field
from typing import List, Optional

class PastVisit(BaseModel):
    id: str
    date: str
    symptoms: List[str]
    symptomsDisplay: str
    decision: str
    medicinesDispensed: Optional[str] = None
    notes: Optional[str] = None

class PatientProfile(BaseModel):
    abhaId: str
    nameEn: str
    nameHi: Optional[str] = None
    nameMr: Optional[str] = None
    age: int
    gender: str
    village: str
    subCentre: str
    phcAssigned: str
    isAbhaVerified: bool = True
    pastVisits: List[PastVisit] = []

class CreateVisitRequest(BaseModel):
    patientAbhaId: str
    patientName: str
    date: str
    timestamp: str
    symptoms: List[str]
    symptomsDisplay: str
    duration: str
    decision: str
    urgency: str
    actionTaken: str
    medicinesDispensed: Optional[str] = None
    notes: Optional[str] = None
    ashaWorkerId: Optional[str] = \"ASHA_MH_PUNE_042\"
    offlineId: Optional[str] = None

class BatchSyncVisitsRequest(BaseModel):
    visits: List[CreateVisitRequest]
