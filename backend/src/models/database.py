import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load env from current working directory, backend/.env, and repo root .env
try:
    load_dotenv()  # CWD
    backend_env = Path(__file__).resolve().parents[2] / ".env"
    if backend_env.exists():
        load_dotenv(backend_env)
    root_env = Path(__file__).resolve().parents[3] / ".env"
    if root_env.exists():
        load_dotenv(root_env)
except Exception:
    pass
DATABASE_URL = os.getenv("DATABASE_URL") or (
    f"postgresql://{os.getenv('DB_USER','bdata_user')}:{os.getenv('DB_PASSWORD','bdata_password')}@"
    f"{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','5432')}/{os.getenv('DB_NAME','bdata_db')}"
)

def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# Postgres is shared with other apps: cap connections per worker and kill
# runaway queries server-side so one heavy request cannot hog the database.
_statement_timeout_ms = _int_env("DB_STATEMENT_TIMEOUT_MS", 60000)
_idle_tx_timeout_ms = _int_env("DB_IDLE_IN_TX_TIMEOUT_MS", 60000)
_pg_options = f"-c statement_timeout={_statement_timeout_ms} -c idle_in_transaction_session_timeout={_idle_tx_timeout_ms}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=_int_env("DB_POOL_SIZE", 5),
    max_overflow=_int_env("DB_MAX_OVERFLOW", 5),
    pool_timeout=_int_env("DB_POOL_TIMEOUT", 30),
    pool_recycle=_int_env("DB_POOL_RECYCLE", 1800),
    connect_args={
        "connect_timeout": 10,
        "application_name": os.getenv("DB_APPLICATION_NAME", "bda_analytics"),
        "options": _pg_options,
        "keepalives": 1,
        "keepalives_idle": 60,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
