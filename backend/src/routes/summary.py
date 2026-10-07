import logging
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from src.models import database
from sqlalchemy import text
from src.schemas.summary import AnalyticsSummary
from src.cache import ttl_cached

router = APIRouter()

@router.get("/api/analytics/summary", tags=["Analytics"], response_model=AnalyticsSummary)
@ttl_cached("analytics_summary")
def analytics_summary(db=Depends(database.get_db)):
    logger = logging.getLogger("api")
    try:
        # Return counts for companies and directors
        company_count = db.execute(text("SELECT COUNT(*) FROM company_det")).scalar() or 0
        director_count = db.execute(text("SELECT COUNT(*) FROM director_det")).scalar() or 0
        return {
            "total_companies": int(company_count),
            "total_directors": int(director_count)
        }
    except Exception as e:
        logger.exception("Failed to compute analytics summary")
        # Fallback: try to read last verification report for cached counts
        try:
            root = Path(__file__).resolve().parents[3]
            report_path = root / "verification_report.json"
            if report_path.exists():
                data = json.loads(report_path.read_text())
                counts = data.get("data_summary", {})
                return {
                    "total_companies": int(counts.get("total_companies", 0)),
                    "total_directors": int(counts.get("total_directors", 0)),
                    "stale": True,
                    "source": "verification_report.json",
                    "as_of": data.get("timestamp"),
                    "warning": f"Live DB unavailable; returning last saved counts. Root cause: {e}"
                }
        except Exception:
            pass
        # If no fallback, return an explicit 503
        raise HTTPException(status_code=503, detail=f"Analytics summary failed: {e}")
