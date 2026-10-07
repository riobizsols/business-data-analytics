from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    is_admin: bool = False


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_admin: Optional[bool] = None


class UserPasswordUpdate(BaseModel):
    password: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    is_active: bool
    is_locked: bool
    is_admin: bool
    can_download: bool = False
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    failed_login_attempts: int


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class UserLockToggle(BaseModel):
    is_locked: bool


class AuditLogCreate(BaseModel):
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[dict] = None


class AuditLog(AuditLogCreate):
    id: int
    user_id: Optional[int]
    ip_address: Optional[str]
    created_at: datetime
