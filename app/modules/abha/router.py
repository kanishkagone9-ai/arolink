from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def abha_status():
    """Check ABHA/ABDM module readiness."""
    return {
        "module": "abha",
        "status": "active",
        "abdm_gateway": "ready",
        "message": "ABHA module ready. Ready for abha-auth branch merge."
    }
