import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db

# Use in-memory SQLite with StaticPool so memory is shared across connections
test_engine = create_engine(
    'sqlite:///:memory:',
    connect_args={'check_same_thread': False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# 1. Test /health
r = client.get('/health')
assert r.status_code == 200, f"Health check failed: {r.text}"
assert r.json() == {"status": "ok"}, f"Unexpected response: {r.json()}"
print("GET /health passed:", r.json())

# 2. Test POST /patients
new_patient_payload = {
    "abha_id": "14-5555-6666-7777",
    "name": "Sunita Sharma",
    "village": "Chandpur",
    "age": 29,
    "gender": "Female"
}
r = client.post('/patients/', json=new_patient_payload)
assert r.status_code == 201, f"POST /patients failed: {r.text}"
patient_data = r.json()
assert patient_data["name"] == "Sunita Sharma"
assert patient_data["abha_id"] == "14-5555-6666-7777"
patient_id = patient_data["id"]
print("POST /patients created patient successfully:", patient_data)

# Test duplicate abha_id rejected
r_dup = client.post('/patients/', json=new_patient_payload)
assert r_dup.status_code == 400, f"Expected 400 for duplicate ABHA ID, got: {r_dup.status_code}"
print("Duplicate ABHA ID check passed with 400 Bad Request.")

# 3. Test POST /visits with decision 'local'
visit_local_payload = {
    "patient_id": patient_id,
    "symptoms": ["mild fever", "headache", "sneezing"],
    "decision": "local"
}
res_local = client.post('/visits/', json=visit_local_payload)
assert res_local.status_code == 201, f"POST /visits with 'local' failed: {res_local.text}"
saved_visit_local = res_local.json()
print("POST /visits with decision 'local' returned:", saved_visit_local)

assert saved_visit_local["patient_id"] == patient_id
assert saved_visit_local["decision"] == "local"
assert "id" in saved_visit_local
assert "date" in saved_visit_local
assert "mild fever" in saved_visit_local["symptoms"]
assert "headache" in saved_visit_local["symptoms"]
if "symptom_list" in saved_visit_local:
    assert "mild fever" in saved_visit_local["symptom_list"]
print("Validation for 'local' decision visit passed!")

# 4. Test POST /visits with decision 'refer'
visit_refer_payload = {
    "patient_id": patient_id,
    "symptoms": ["acute chest pain", "shortness of breath", "high fever"],
    "decision": "refer"
}
res_refer = client.post('/visits/', json=visit_refer_payload)
assert res_refer.status_code == 201, f"POST /visits with 'refer' failed: {res_refer.text}"
saved_visit_refer = res_refer.json()
print("POST /visits with decision 'refer' returned:", saved_visit_refer)

assert saved_visit_refer["patient_id"] == patient_id
assert saved_visit_refer["decision"] == "refer"
assert "id" in saved_visit_refer
assert "date" in saved_visit_refer
assert "acute chest pain" in saved_visit_refer["symptoms"]
if "symptom_list" in saved_visit_refer:
    assert "acute chest pain" in saved_visit_refer["symptom_list"]
print("Validation for 'refer' decision visit passed!")

# 5. Test invalid decision rejected (must be 'local' or 'refer')
invalid_payload = {
    "patient_id": patient_id,
    "symptoms": ["cough"],
    "decision": "admit_to_icu"
}
res_invalid = client.post('/visits/', json=invalid_payload)
assert res_invalid.status_code == 422, f"Expected 422 for invalid decision, got: {res_invalid.status_code}"
print("Invalid decision rejection passed with 422 Unprocessable Entity.")

# 6. Test non-existent patient returns 404
res_no_patient = client.post('/visits/', json={
    "patient_id": 999999,
    "symptoms": ["cough"],
    "decision": "local"
})
assert res_no_patient.status_code == 404, f"Expected 404 for non-existent patient, got: {res_no_patient.status_code}"
print("Non-existent patient validation passed with 404 Not Found.")

# 7. Add additional visits to test last 5 visits on GET /patients/{abha_id}
additional_dates = [
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-05"
]

for d in additional_dates:
    client.post('/api/v1/visits/', json={
        "patient_id": patient_id,
        "date": d,
        "symptoms": ["cough"],
        "decision": "local"
    })

# 8. Test GET /patients/{abha_id}
r_get = client.get('/patients/14-5555-6666-7777')
assert r_get.status_code == 200, f"GET /patients/{{abha_id}} failed: {r_get.text}"
get_data = r_get.json()

assert get_data["name"] == "Sunita Sharma"
assert get_data["abha_id"] == "14-5555-6666-7777"
assert "visits" in get_data
assert len(get_data["visits"]) == 5, f"Expected exactly 5 visits, got {len(get_data['visits'])}"
print("GET /patients/{abha_id} returned exactly 5 most recent visits.")

# 9. Test Referrals and Stock endpoints
referral_res = client.post('/api/v1/referrals/', json={
    "patient_id": patient_id,
    "facility": "Sub-District Hospital",
    "status": "PENDING"
})
assert referral_res.status_code == 201

stock_res = client.post('/api/v1/stock/', json={
    "medicine_name": "Amoxicillin 500mg",
    "quantity": 50
})
assert stock_res.status_code == 201
stock_id = stock_res.json()["id"]

adjust_res = client.post(f"/api/v1/stock/{stock_id}/adjust", json={"delta": -5})
assert adjust_res.status_code == 200
assert adjust_res.json()["quantity"] == 45

# 10. Test POST /abha/enroll
import re

abha_enroll_payload = {
    "name": "Rajesh Patel",
    "age": 42,
    "gender": "Male",
    "village": "Madhupur",
    "aadhaar_number": "123456789012"
}
enroll_res = client.post('/abha/enroll', json=abha_enroll_payload)
assert enroll_res.status_code == 201, f"POST /abha/enroll failed: {enroll_res.text}"
enrolled_data = enroll_res.json()
print("POST /abha/enroll returned:", enrolled_data)

assert enrolled_data["name"] == "Rajesh Patel"
assert enrolled_data["age"] == 42
assert enrolled_data["gender"] == "Male"
assert enrolled_data["village"] == "Madhupur"
assert "id" in enrolled_data
assert "abha_id" in enrolled_data
assert re.match(r"^ABHA-\d{8}$", enrolled_data["abha_id"]), f"Invalid ABHA ID format: {enrolled_data['abha_id']}"

# Verify patient exists in database and can be fetched by generated abha_id
verify_patient_res = client.get(f"/patients/{enrolled_data['abha_id']}")
assert verify_patient_res.status_code == 200, f"Failed to fetch enrolled patient: {verify_patient_res.text}"
fetched_patient = verify_patient_res.json()
assert fetched_patient["name"] == "Rajesh Patel"
assert fetched_patient["abha_id"] == enrolled_data["abha_id"]
print(f"Verified patient correctly created with generated ABHA ID: {enrolled_data['abha_id']}")

# Verify /api/v1/abha/enroll also works seamlessly
api_v1_enroll_res = client.post('/api/v1/abha/enroll', json={
    "name": "Pooja Devi",
    "age": 31,
    "gender": "Female",
    "village": "Kalyanpur",
    "aadhaar_number": "987654321098"
})
assert api_v1_enroll_res.status_code == 201, f"POST /api/v1/abha/enroll failed: {api_v1_enroll_res.text}"
api_v1_data = api_v1_enroll_res.json()
assert re.match(r"^ABHA-\d{8}$", api_v1_data["abha_id"])
assert api_v1_data["name"] == "Pooja Devi"
print(f"Verified /api/v1/abha/enroll generated ABHA ID: {api_v1_data['abha_id']}")

# 11. Test GET /abha/lookup?q={query}
# 11a. Test search by name (partial and case-insensitive)
lookup_name_res = client.get('/abha/lookup?q=rAjEsH')
assert lookup_name_res.status_code == 200, f"GET /abha/lookup failed: {lookup_name_res.text}"
name_results = lookup_name_res.json()
assert len(name_results) >= 1
assert any(p["name"] == "Rajesh Patel" for p in name_results)
assert any(p["village"] == "Madhupur" for p in name_results)
print("11a. Case-insensitive name match passed:", [p["name"] for p in name_results])

lookup_partial_name = client.get('/abha/lookup?q=devi')
assert lookup_partial_name.status_code == 200
assert any(p["name"] == "Pooja Devi" for p in lookup_partial_name.json())
print("11b. Partial name match passed.")

# 11b. Test search by village (partial and case-insensitive)
lookup_village_res = client.get('/abha/lookup?q=kAlYaN')
assert lookup_village_res.status_code == 200
village_results = lookup_village_res.json()
assert any(p["name"] == "Pooja Devi" and p["village"] == "Kalyanpur" for p in village_results)
print("11c. Case-insensitive village match passed:", [p["village"] for p in village_results])

lookup_partial_village = client.get('/abha/lookup?q=madhu')
assert lookup_partial_village.status_code == 200
assert any(p["name"] == "Rajesh Patel" and p["village"] == "Madhupur" for p in lookup_partial_village.json())
print("11d. Partial village match passed.")

# 11c. Test results strictly capped at 10 items
# Create 15 patients in a common village
for i in range(15):
    client.post('/abha/enroll', json={
        "name": f"BatchPatient {i+1}",
        "age": 20 + i,
        "gender": "Other",
        "village": "CommonTestVillage",
        "aadhaar_number": f"99990000{i:04d}"
    })

lookup_capped_res = client.get('/abha/lookup?q=commontestvillage')
assert lookup_capped_res.status_code == 200
capped_results = lookup_capped_res.json()
assert len(capped_results) == 10, f"Expected exactly 10 results, got {len(capped_results)}"
print(f"11e. Result limit test passed: {len(capped_results)} patients returned (capped at 10).")

# 11d. Verify /api/v1/abha/lookup prefix also works
v1_lookup = client.get('/api/v1/abha/lookup?q=batchpatient')
assert v1_lookup.status_code == 200
assert len(v1_lookup.json()) == 10
print("11f. /api/v1/abha/lookup verified successfully.")

print("\n=======================================================")
print("ALL TESTS PASSED: ABHA ENROLLMENT AND LOOKUP VERIFIED!")
print("=======================================================")


