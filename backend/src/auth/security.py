from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import bcrypt
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.models.database import get_db


# Security
security = HTTPBearer()

# Token settings
TOKEN_EXPIRE_HOURS = 24
MAX_FAILED_ATTEMPTS = 5


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def utc_now() -> datetime:
    """UTC now as a naive datetime, matching TIMESTAMP columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def as_utc_naive(value: datetime) -> datetime:
    """Normalize a DB timestamp so it can be compared with utc_now()."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def create_access_token(user_id: int, db: Session, ip_address: str = None, user_agent: str = None) -> str:
    """Create a new access token for a user"""
    token = generate_token()
    expires_at = utc_now() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    
    db.execute(
        text("""
            INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent)
            VALUES (:user_id, :token, :expires_at, :ip_address, :user_agent)
        """),
        {
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
            "ip_address": ip_address,
            "user_agent": user_agent
        }
    )
    db.commit()
    
    return token


def verify_token(token: str, db: Session) -> Optional[dict]:
    """Verify a token and return user info if valid"""
    result = db.execute(
        text("""
            SELECT 
                u.id, u.username, u.email, u.full_name, u.is_active, 
                u.is_locked, u.is_admin, u.created_at, u.updated_at,
                u.last_login, u.failed_login_attempts, u.can_download,
                s.expires_at
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = :token
        """),
        {"token": token}
    ).fetchone()
    
    if not result:
        return None
    
    # Check if token is expired. can_download sits at index 11; expires_at at 12.
    if as_utc_naive(result[12]) < utc_now():
        return None
    
    # Check if user is active
    if not result[4]:
        return None
    
    # Check if user is locked
    if result[5]:
        return None
    
    return {
        "id": result[0],
        "username": result[1],
        "email": result[2],
        "full_name": result[3],
        "is_active": result[4],
        "is_locked": result[5],
        "is_admin": result[6],
        "created_at": result[7],
        "updated_at": result[8],
        "last_login": result[9],
        "failed_login_attempts": result[10],
        "can_download": bool(result[11]),
    }


def revoke_token(token: str, db: Session):
    """Revoke a token (logout)"""
    db.execute(
        text("DELETE FROM user_sessions WHERE token = :token"),
        {"token": token}
    )
    db.commit()


def revoke_user_tokens(user_id: int, db: Session):
    """Revoke all tokens for a user"""
    db.execute(
        text("DELETE FROM user_sessions WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    db.commit()


def cleanup_expired_tokens(db: Session):
    """Remove expired tokens"""
    db.execute(
        text("DELETE FROM user_sessions WHERE expires_at < :now"),
        {"now": utc_now()}
    )
    db.commit()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """Get current authenticated user"""
    token = credentials.credentials
    user = verify_token(token, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def require_download_access(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow export only for accounts that are permitted to download."""
    if not current_user.get("can_download"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Download is not allowed for this account",
        )
    return current_user


def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current admin user"""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def record_login_attempt(username: str, success: bool, db: Session, ip_address: str = None):
    """Record login attempt and handle failed attempts"""
    if success:
        # Reset failed attempts and update last login
        db.execute(
            text("""
                UPDATE users 
                SET failed_login_attempts = 0, last_login = :now
                WHERE username = :username
            """),
            {"username": username, "now": utc_now()}
        )
    else:
        # Increment failed attempts
        result = db.execute(
            text("""
                UPDATE users 
                SET failed_login_attempts = failed_login_attempts + 1
                WHERE username = :username
                RETURNING failed_login_attempts
            """),
            {"username": username}
        ).fetchone()
        
        if result and result[0] >= MAX_FAILED_ATTEMPTS:
            # Lock the account
            db.execute(
                text("""
                    UPDATE users 
                    SET is_locked = true, locked_at = :now
                    WHERE username = :username
                """),
                {"username": username, "now": utc_now()}
            )
    
    db.commit()


def log_audit(
    user_id: Optional[int],
    action: str,
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Log an audit entry"""
    details_json = json.dumps(details) if details else None
    db.execute(
        text("""
            INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (:user_id, :action, :entity_type, :entity_id, CAST(:details AS jsonb), :ip_address)
        """),
        {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details_json,
            "ip_address": ip_address
        }
    )
    db.commit()

