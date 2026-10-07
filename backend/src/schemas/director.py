from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

class Director(BaseModel):
    din: str
    director_name: Optional[str] = None
    designation: Optional[str] = None
    date_joined: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    companyname: Optional[str] = None
    cin: Optional[str] = None
    city: Optional[str] = None

class DirectorDetail(Director):
    contacted: Optional[bool] = None
    updated_at: Optional[datetime] = None
