# BDataUI hosting

To run the full app on a server with Docker, use [SERVER.md](SERVER.md).

The rest of this file is the local Windows setup.

This sets up the backend (FastAPI), frontend (Next.js), and DB (Postgres/Redis) to run on this system.

## Ports
- Backend API: http://localhost:8000
- Frontend UI: http://localhost:5173
- Postgres: localhost:5432 (Docker)
- Redis: localhost:6379 (Docker)

## One-time setup
1. Ensure Docker Desktop is installed and starts with Windows (Settings > General > Start Docker Desktop when you log in).
2. Start the DB containers once (they use `restart: unless-stopped` so they will auto-start next time):
   - Open PowerShell and run:
     - `docker start bdata-postgres-1`
     - `docker start bdata-redis-1`
3. Build frontend:
   - `frontend/build_frontend.bat`

## Start services manually
- Backend: `backend/start_backend_prod.bat`
- Frontend: `frontend/start_frontend_prod.bat`

## Auto-start on logon
Run as Administrator once:
- `deploy/register-startup-tasks.ps1`
This registers three Scheduled Tasks that start Docker containers, backend, and frontend at user logon.

## Environment
- Frontend reads API base from `frontend/.env.local` (set to http://localhost:8000)
- Backend CORS is permissive by default; adjust in `backend/src/main.py` if needed.

## Firewall
If you need LAN access from other machines, allow inbound connections for ports 5173 and 8000 in Windows Defender Firewall.

## Troubleshooting
- Backend health: http://localhost:8000/api/health, DB: http://localhost:8000/api/health/db
- If Postgres is down, start Docker Desktop, then run:
  - `docker start bdata-postgres-1`
  - `docker start bdata-redis-1`
- If ports are conflicting, edit `frontend/package.json` (port) or `backend/start_backend_prod.bat`.
