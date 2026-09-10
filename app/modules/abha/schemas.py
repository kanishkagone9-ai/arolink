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
