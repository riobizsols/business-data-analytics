from sqlalchemy import Column, String, Integer, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CompanyDet(Base):
    __tablename__ = "company_det"
    cin = Column(String, primary_key=True)
    companyname = Column(String)
    dor = Column(DateTime)
    pincode = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    a_capital = Column(Float)
    p_capital = Column(Float)
    toc = Column(String)
    activity_code = Column(String)
    activity_description = Column(String)
    reg_off_addr = Column(String)
    company_email = Column(String)
    contacted = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
