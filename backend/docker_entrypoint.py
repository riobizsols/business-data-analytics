"""Prepare the database, then start the API."""
import os
import time

from sqlalchemy import text

from src.auth.security import get_password_hash
from src.models.database import SessionLocal, engine


SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        is_locked BOOLEAN DEFAULT false,
        is_admin BOOLEAN DEFAULT false,
        can_download BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_at TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_download BOOLEAN DEFAULT false",
    "UPDATE users SET can_download = true WHERE is_admin = true AND can_download IS NOT TRUE",
    "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
    "CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)",
    "CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)",
    "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)",
    """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
    """,
    "DROP TRIGGER IF EXISTS update_users_updated_at ON users",
    """
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """,
]


def wait_for_database():
    last_error = None
    for _ in range(30):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as exc:
            last_error = exc
            time.sleep(2)
    raise SystemExit(f"Database did not become ready: {last_error}")


def apply_schema():
    with engine.begin() as conn:
        for statement in SCHEMA_STATEMENTS:
            conn.execute(text(statement))


def ensure_admin():
    username = os.getenv("ADMIN_USERNAME", "admin").strip()
    password = os.getenv("ADMIN_PASSWORD", "").strip()
    email = os.getenv("ADMIN_EMAIL", "admin@bdataui.com").strip()
    if not username or not password:
        print("ADMIN_PASSWORD is not set; skipping admin bootstrap")
        return

    db = SessionLocal()
    try:
        existing = db.execute(
            text("SELECT id FROM users WHERE username = :username"),
            {"username": username},
        ).fetchone()
        if existing:
            print(f"Admin user '{username}' already exists")
            return
        db.execute(
            text(
                """
                INSERT INTO users (
                    username, email, password_hash, full_name,
                    is_admin, can_download, is_active
                )
                VALUES (
                    :username, :email, :password_hash, :full_name,
                    true, true, true
                )
                """
            ),
            {
                "username": username,
                "email": email,
                "password_hash": get_password_hash(password),
                "full_name": "System Administrator",
            },
        )
        db.commit()
        print(f"Created admin user '{username}'")
    finally:
        db.close()


def main():
    wait_for_database()
    apply_schema()
    ensure_admin()
    workers = os.getenv("WEB_CONCURRENCY", "2")
    os.execvp(
        "uvicorn",
        [
            "uvicorn", "src.main:app",
            "--host", "0.0.0.0", "--port", "8000",
            "--workers", workers,
            "--proxy-headers", "--forwarded-allow-ips", "*",
            "--timeout-keep-alive", "15",
        ],
    )


if __name__ == "__main__":
    main()
