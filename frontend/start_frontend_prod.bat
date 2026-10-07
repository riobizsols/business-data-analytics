@echo off
SETLOCAL
cd /d D:\CursorPrograms\BDataUI\frontend

REM Point frontend to the local API
set NEXT_PUBLIC_API_BASE=http://localhost:8000

REM Temporary: run in dev mode until production build issues are resolved
REM If you switch back to production, replace 'npm run dev' with 'npm run start'
set PORT=5173

REM Ensure logs directory exists and capture output
if not exist "D:\CursorPrograms\BDataUI\logs" mkdir "D:\CursorPrograms\BDataUI\logs"
"C:\Program Files\nodejs\npm.cmd" run dev >> "D:\CursorPrograms\BDataUI\logs\frontend-dev.log" 2>&1
if errorlevel 1 (
	echo Frontend dev exited with error. See logs\frontend-dev.log
	pause
)
ENDLOCAL
