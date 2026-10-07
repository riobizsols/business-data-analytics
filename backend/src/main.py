import os
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.routes import health, summary
from src.routes import companies, directors
from src.routes import db_health
from src.routes import export
from src.routes import views
from src.routes import batch
from src.routes import auth

API_KEY = os.getenv("API_KEY")  # Optional. If set, required for protected routes

def require_api_key(x_api_key: str | None = Header(None)):
	if API_KEY and x_api_key != API_KEY:
		raise HTTPException(status_code=401, detail="Invalid or missing API key")
	return True

app = FastAPI(title="Business Data API")

# Set CORS_ALLOW_ORIGINS to the public site origin in production.
allow_origins = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if o.strip()]
allow_methods = [m.strip() for m in os.getenv("CORS_ALLOW_METHODS", "*").split(",") if m.strip()]
allow_headers = [h.strip() for h in os.getenv("CORS_ALLOW_HEADERS", "*").split(",") if h.strip()]

app.add_middleware(
	CORSMiddleware,
	allow_origins=allow_origins,
	allow_credentials="*" not in allow_origins,
	allow_methods=allow_methods,
	allow_headers=allow_headers,
)

app.include_router(health.router)
app.include_router(db_health.router)
app.include_router(auth.router)  # Auth routes don't require API key
app.include_router(summary.router, dependencies=[Depends(require_api_key)])
app.include_router(companies.router, dependencies=[Depends(require_api_key)])
app.include_router(directors.router, dependencies=[Depends(require_api_key)])
app.include_router(export.router, dependencies=[Depends(require_api_key)])
app.include_router(views.router, dependencies=[Depends(require_api_key)])
app.include_router(batch.router, dependencies=[Depends(require_api_key)])
