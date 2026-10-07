from fastapi import APIRouter, Depends
from sqlalchemy import text
from src.models import database
from src.schemas.health import DBHealthStatus

router = APIRouter(tags=["Health"]) 

@router.get("/api/health/db", response_model=DBHealthStatus)
def db_health(db=Depends(database.get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as e:
        return {"db": "down", "detail": str(e)}
