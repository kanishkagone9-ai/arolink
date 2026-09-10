import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class VisitBase(BaseModel):
    patient_id: int
    date: Optional[datetime.date] = None
    symptoms: Optional[Union[List[str], str]] = None
    symptom_list: Optional[List[str]] = None
    decision: str

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if v_clean not in ("local", "refer"):
            raise ValueError("Triage decision must be either 'local' or 'refer'")
        return v_clean


class VisitCreate(VisitBase):
    pass


class VisitResponse(BaseModel):
    id: int
    patient_id: int
    date: datetime.date
    symptoms: Optional[str] = None
    symptom_list: Optional[List[str]] = None
    decision: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_symptom_list(self):
        if self.symptoms and not self.symptom_list:
            self.symptom_list = [s.strip() for s in self.symptoms.split(",") if s.strip()]
        return self
