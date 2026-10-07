# Business Data API (FastAPI + SQLAlchemy)

## Quickstart

1. Copy `.env.example` to `.env` and edit as needed.
2. Install dependencies:
   ```powershell
   python -m venv .venv
   . .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
3. Run the API server:
   ```powershell
   uvicorn src.main:app --reload
   ```

## Endpoints
- `GET /api/health` — Health check
- `GET /api/health/db` — Database connectivity check
- `GET /api/analytics/summary` — Company & director counts
- `GET /api/companies` — List companies (pagination, filters, sort)
- `GET /api/companies/{cin}` — Company details + directors
- `GET /api/directors` — List directors (pagination, filters, sort)
- `GET /api/directors/{din}` — Director details + associated companies
- `GET /api/export/companies.csv` — Export companies to CSV (filterable)
- `GET /api/export/companies.xlsx` — Export companies to Excel (requires pandas/xlsxwriter)

## Structure
- `src/models/` — SQLAlchemy models
- `src/routes/` — API endpoints
- `src/config/` — Config helpers

## Config
Environment variables:
- `DATABASE_URL` (or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD)
- `API_KEY` (optional; if set, required via `X-API-Key` header)
- `CORS_ALLOW_ORIGINS` (comma-separated, default `*`)
- `CORS_ALLOW_METHODS` (comma-separated, default `*`)
- `CORS_ALLOW_HEADERS` (comma-separated, default `*`)
