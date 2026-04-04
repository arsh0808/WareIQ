@echo off
echo ============================================
echo RESTARTING SMART WAREHOUSE DEV SERVER
echo ============================================
echo.
echo Killing any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting fresh dev server...
echo.
cd /d "%~dp0"
call npm run dev
