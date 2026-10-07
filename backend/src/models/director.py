from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DirectorDet(Base):
    __tablename__ = "director_det"
    din = Column(String, primary_key=True)
    cin = Column(String)
    director_name = Column(String)
    date_joined = Column(DateTime)
    designation = Column(String)
    mobile_1 = Column(String)
    mobile_2 = Column(String)
    mobile_3 = Column(String)
    mobile_4 = Column(String)
    mobile_5 = Column(String)
    mobile_6 = Column(String)
    mobile_7 = Column(String)
    email_1 = Column(String)
    email_2 = Column(String)
    email_3 = Column(String)
    email_4 = Column(String)
    contacted = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
