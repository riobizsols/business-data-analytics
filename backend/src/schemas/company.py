from typing import Optional, Union
from datetime import datetime, date
from pydantic import BaseModel

class Company(BaseModel):
    cin: str
    companyname: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    a_capital: Optional[float] = None
    p_capital: Optional[float] = None
    company_email: Optional[str] = None
    phone: Optional[str] = None
    toc: Optional[Union[str, int]] = None
    created_at: Optional[datetime] = None
    mca_category: Optional[str] = None
    division_description: Optional[str] = None
    dor: Optional[str] = None
    contacted: Optional[bool] = None

class CompanyDetail(BaseModel):
    cin: str
    companyname: Optional[str] = None
    dor: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    a_capital: Optional[float] = None
    p_capital: Optional[float] = None
    toc: Optional[Union[str, int]] = None
    activity_code: Optional[str] = None
    activity_description: Optional[str] = None
    reg_off_addr: Optional[str] = None
    company_email: Optional[str] = None
    contacted: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
