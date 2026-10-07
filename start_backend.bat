@echo off
cd /d D:\CursorPrograms\BDataUI\backend
D:\CursorPrograms\BDataUI\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
pause
