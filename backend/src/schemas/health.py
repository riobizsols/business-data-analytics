from typing import Optional
from pydantic import BaseModel

class HealthStatus(BaseModel):
    status: str

class DBHealthStatus(BaseModel):
    db: str
    detail: Optional[str] = None
