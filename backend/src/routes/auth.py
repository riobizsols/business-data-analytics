from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from src.models.database import get_db
from ..schemas.auth import (
    User, UserCreate, UserUpdate, UserPasswordUpdate, 
    UserLogin, Token, UserLockToggle, AuditLog
)
from ..auth.security import (
    get_password_hash, verify_password, create_access_token,
    revoke_token, get_current_user, get_current_admin_user,
    record_login_attempt, log_audit, revoke_user_tokens
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login user and return access token"""
    try:
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        
        print(f"\n[LOGIN] Starting login for user: {credentials.username}")
        print(f"[LOGIN] Client IP: {client_ip}, User Agent: {user_agent}")
        
        # Get user from database
        result = db.execute(
            text("""
                SELECT 
                    id, username, email, password_hash, full_name, 
                    is_active, is_locked, is_admin, created_at, updated_at,
                    last_login, failed_login_attempts, can_download
                FROM users
                WHERE username = :username
            """),
            {"username": credentials.username}
        ).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Check if account is locked
        if result[6]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Contact administrator."
            )
        
        # Check if account is active
        if not result[5]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Contact administrator."
            )
        
        # Verify password
        if not verify_password(credentials.password, result[3]):
            record_login_attempt(credentials.username, False, db, client_ip)
            log_audit(
                result[0], "FAILED_LOGIN", db,
                details={"reason": "incorrect_password"},
                ip_address=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Successful login
        record_login_attempt(credentials.username, True, db, client_ip)
        
        # Create access token
        token = create_access_token(result[0], db, client_ip, user_agent)
        
        # Log successful login
        log_audit(
            result[0], "LOGIN", db,
            details={"user_agent": user_agent},
            ip_address=client_ip
        )
        
        user_dict = {
            "id": result[0],
            "username": result[1],
            "email": result[2],
            "full_name": result[4],
            "is_active": result[5],
            "is_locked": result[6],
            "is_admin": result[7],
            "created_at": result[8],
            "updated_at": result[9],
            "last_login": result[10],
            "failed_login_attempts": result[11],
            "can_download": bool(result[12]),
        }
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n[LOGIN ERROR] Exception occurred: {type(e).__name__}")
        print(f"[LOGIN ERROR] Message: {str(e)}")
        import traceback
        print("[LOGIN ERROR] Traceback:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and revoke token"""
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    
    if token:
        revoke_token(token, db)
        log_audit(
            current_user["id"], "LOGOUT", db,
            ip_address=request.client.host if request.client else None
        )
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user


# Admin-only routes
@router.get("/users", response_model=List[User])
async def list_users(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    result = db.execute(
        text("""
            SELECT 
                id, username, email, full_name, is_active, is_locked, 
                is_admin, can_download, created_at, updated_at, last_login, failed_login_attempts
            FROM users
            ORDER BY created_at DESC
        """)
    ).fetchall()
    
    users = []
    for row in result:
        users.append({
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "full_name": row[3],
            "is_active": row[4],
            "is_locked": row[5],
            "is_admin": row[6],
            "can_download": bool(row[7]),
            "created_at": row[8],
            "updated_at": row[9],
            "last_login": row[10],
            "failed_login_attempts": row[11]
        })
    
    return users


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if username already exists
    existing = db.execute(
        text("SELECT id FROM users WHERE username = :username"),
        {"username": user_data.username}
    ).fetchone()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": user_data.email}
    ).fetchone()
    
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Hash password
    password_hash = get_password_hash(user_data.password)
    
    # Create user
    result = db.execute(
        text("""
            INSERT INTO users (username, email, password_hash, full_name, is_admin, can_download)
            VALUES (:username, :email, :password_hash, :full_name, :is_admin, :can_download)
            RETURNING id, username, email, full_name, is_active, is_locked, 
                      is_admin, can_download, created_at, updated_at, last_login, failed_login_attempts
        """),
        {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "is_admin": user_data.is_admin,
            "can_download": user_data.is_admin,
        }
    ).fetchone()
    
    db.commit()
    
    # Log user creation
    log_audit(
        current_user["id"], "CREATE_USER", db,
        entity_type="user",
        entity_id=str(result[0]),
        details={"username": user_data.username, "is_admin": user_data.is_admin},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "id": result[0],
        "username": result[1],
        "email": result[2],
        "full_name": result[3],
        "is_active": result[4],
        "is_locked": result[5],
        "is_admin": result[6],
        "can_download": bool(result[7]),
        "created_at": result[8],
        "updated_at": result[9],
        "last_login": result[10],
        "failed_login_attempts": result[11]
    }


@router.patch("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user information (admin only)"""
    # Build update query dynamically
    updates = []
    params = {"user_id": user_id}
    
    if user_data.email is not None:
        updates.append("email = :email")
        params["email"] = user_data.email
    
    if user_data.full_name is not None:
        updates.append("full_name = :full_name")
        params["full_name"] = user_data.full_name
    
    if user_data.is_admin is not None:
        updates.append("is_admin = :is_admin")
        updates.append("can_download = :is_admin")
        params["is_admin"] = user_data.is_admin
    
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update user
    result = db.execute(
        text(f"""
            UPDATE users
            SET {', '.join(updates)}
            WHERE id = :user_id
            RETURNING id, username, email, full_name, is_active, is_locked, 
                      is_admin, can_download, created_at, updated_at, last_login, failed_login_attempts
        """),
        params
    ).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.commit()
    
    # Log update
    log_audit(
        current_user["id"], "UPDATE_USER", db,
        entity_type="user",
        entity_id=str(user_id),
        details=user_data.dict(exclude_none=True),
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "id": result[0],
        "username": result[1],
        "email": result[2],
        "full_name": result[3],
        "is_active": result[4],
        "is_locked": result[5],
        "is_admin": result[6],
        "can_download": bool(result[7]),
        "created_at": result[8],
        "updated_at": result[9],
        "last_login": result[10],
        "failed_login_attempts": result[11]
    }


@router.patch("/users/{user_id}/password")
async def update_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user password (admin only)"""
    password_hash = get_password_hash(password_data.password)
    
    result = db.execute(
        text("""
            UPDATE users
            SET password_hash = :password_hash, failed_login_attempts = 0
            WHERE id = :user_id
            RETURNING username
        """),
        {"user_id": user_id, "password_hash": password_hash}
    ).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.commit()
    
    # Revoke all existing sessions for this user
    revoke_user_tokens(user_id, db)
    
    # Log password change
    log_audit(
        current_user["id"], "CHANGE_PASSWORD", db,
        entity_type="user",
        entity_id=str(user_id),
        details={"username": result[0]},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Password updated successfully"}


@router.patch("/users/{user_id}/lock")
async def toggle_user_lock(
    user_id: int,
    lock_data: UserLockToggle,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Lock or unlock user account (admin only)"""
    # Prevent locking own account
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot lock your own account"
        )
    
    result = db.execute(
        text("""
            UPDATE users
            SET is_locked = :is_locked,
                locked_at = CASE WHEN :is_locked THEN CURRENT_TIMESTAMP ELSE NULL END,
                failed_login_attempts = 0
            WHERE id = :user_id
            RETURNING username
        """),
        {"user_id": user_id, "is_locked": lock_data.is_locked}
    ).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.commit()
    
    # Revoke all sessions if locking
    if lock_data.is_locked:
        revoke_user_tokens(user_id, db)
    
    # Log action
    action = "LOCK_USER" if lock_data.is_locked else "UNLOCK_USER"
    log_audit(
        current_user["id"], action, db,
        entity_type="user",
        entity_id=str(user_id),
        details={"username": result[0]},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "message": f"User {'locked' if lock_data.is_locked else 'unlocked'} successfully"
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    # Prevent deleting own account
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    result = db.execute(
        text("DELETE FROM users WHERE id = :user_id RETURNING username"),
        {"user_id": user_id}
    ).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.commit()
    
    # Log deletion
    log_audit(
        current_user["id"], "DELETE_USER", db,
        entity_type="user",
        entity_id=str(user_id),
        details={"username": result[0]},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "User deleted successfully"}


@router.get("/audit-log", response_model=List[AuditLog])
async def get_audit_log(
    limit: int = 100,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get audit log (admin only)"""
    result = db.execute(
        text("""
            SELECT 
                id, user_id, action, entity_type, entity_id, 
                details, ip_address, created_at
            FROM audit_log
            ORDER BY created_at DESC
            LIMIT :limit
        """),
        {"limit": limit}
    ).fetchall()
    
    logs = []
    for row in result:
        logs.append({
            "id": row[0],
            "user_id": row[1],
            "action": row[2],
            "entity_type": row[3],
            "entity_id": row[4],
            "details": row[5],
            "ip_address": row[6],
            "created_at": row[7]
        })
    
    return logs
