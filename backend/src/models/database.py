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
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
