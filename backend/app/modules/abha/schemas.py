from typing import Optional
from pydantic import BaseModel


class GenerateAadhaarOtpRequest(BaseModel):
    aadhaar_number: str


class VerifyOtpRequest(BaseModel):
    txn_id: str
    otp: str


class AbhaCardResponse(BaseModel):
    abha_number: str
    abha_address: str
    name: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None


class AbhaEnrollRequest(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    aadhaar_number: str

