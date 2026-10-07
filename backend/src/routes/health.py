from fastapi import APIRouter
from src.schemas.health import HealthStatus

router = APIRouter()

@router.get("/api/health", tags=["Health"], response_model=HealthStatus)
def health_check():
    return {"status": "ok"}
