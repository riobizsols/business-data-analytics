@echo off
SETLOCAL
cd /d D:\CursorPrograms\BDataUI\backend
set PYTHONPATH=D:\CursorPrograms\BDataUI\backend
REM Start FastAPI (production, no reload)
"D:\CursorPrograms\BDataUI\.venv\Scripts\python.exe" -m uvicorn src.main:app --host 0.0.0.0 --port 8000
ENDLOCAL
