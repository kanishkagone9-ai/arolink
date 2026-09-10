from fastapi import APIRouter, HTTPException
from typing import Dict
from ..schemas.models import PatientProfile, PastVisit

router = APIRouter(prefix=\"/api/v1/patients\", tags=[\"Patients\"])

# In-memory ABDM patient mock registry
MOCK_PATIENT_DB: Dict[str, PatientProfile] = {
    \"ABHA-1234-5678-9012\": PatientProfile(
        abhaId=\"ABHA-1234-5678-9012\",
        nameEn=\"Ramesh Kumar\",
        nameHi=\"रमेश कुमार\",
        nameMr=\"रमेश कुमार\",
        age=45,
        gender=\"Male\",
        village=\"Dharampur (धरमपूर)\",
        subCentre=\"Dharampur Sub-Centre\",
        phcAssigned=\"Warud PHC\",
        isAbhaVerified=True,
        pastVisits=[
            PastVisit(
                id=\"v_101\",
                date=\"2026-08-15\",
                symptoms=[\"fever\", \"cough\"],
                symptomsDisplay=\"Fever (ताप), Cough (खोकला)\",
                decision=\"LOCAL_CARE\",
                medicinesDispensed=\"Paracetamol 500mg (10 tabs), ORS (2 pkts)\",
                notes=\"Seasonal viral fever. Advised hydration.\"
            ),
            PastVisit(
                id=\"v_102\",
                date=\"2026-07-02\",
                symptoms=[\"vomiting\"],
                symptomsDisplay=\"Vomiting / Dehydration (उलट्या)\",
                decision=\"LOCAL_CARE\",
                medicinesDispensed=\"ORS Packets (4 pkts), Zinc 20mg\",
                notes=\"Mild gastroenteritis. Recovered well.\"
            ),
            PastVisit(
                id=\"v_103\",
                date=\"2026-05-18\",
                symptoms=[\"chest_pain\", \"breathlessness\"],
                symptomsDisplay=\"Chest pain (छातीत दुखणे), Breathlessness (श्वास घेण्यास त्रास)\",
                decision=\"REFERRED\",
                medicinesDispensed=\"Referred to Sub-District Hospital\",
                notes=\"Emergency cardiology referral triggered.\"
            )
        ]
    )
}

@router.get(\"/{abha_id}\", response_model=PatientProfile)
def get_patient_profile(abha_id: str):
    \"\"\"Fetches patient longitudinal records linked to ABHA ID\"\"\"
    if abha_id in MOCK_PATIENT_DB:
        return MOCK_PATIENT_DB[abha_id]
    
    # Generate on-demand mock if not found to ensure smooth demo
    return PatientProfile(
        abhaId=abha_id,
        nameEn=\"Anjali Jadhav\",
        nameHi=\"अंजलि जाधव\",
        nameMr=\"अंजली जाधव\",
        age=28,
        gender=\"Female\",
        village=\"Dharampur (धरमपूर)\",
        subCentre=\"Dharampur Sub-Centre\",
        phcAssigned=\"Warud PHC\",
        isAbhaVerified=True,
        pastVisits=[]
    )
