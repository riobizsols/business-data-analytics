from typing import Optional
from pydantic import BaseModel

class AnalyticsSummary(BaseModel):
    total_companies: int
    total_directors: int
    stale: Optional[bool] = None
    source: Optional[str] = None
    as_of: Optional[str] = None
    warning: Optional[str] = None
