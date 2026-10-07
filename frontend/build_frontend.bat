@echo off
SETLOCAL
cd /d D:\CursorPrograms\BDataUI\frontend
call npm install
call npm run build
ENDLOCAL
