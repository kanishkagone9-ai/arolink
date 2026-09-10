from fastapi import APIRouter, status

router = APIRouter()


@router.get("/status")
def auth_status():
    """Check authentication module readiness."""
    return {
        "module": "auth",
        "status": "active",
        "supported_roles": ["ASHA", "DOCTOR", "ADMIN"],
        "message": "Auth module ready. Ready for asha-login branch merge."
    }
