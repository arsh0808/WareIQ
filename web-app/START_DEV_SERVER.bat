@echo off
echo ============================================
echo Starting Smart Warehouse Dev Server
echo ============================================
echo.
echo Checking environment variables...
echo.

cd /d "%~dp0"

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with Firebase credentials
    pause
    exit /b 1
)

echo .env file found!
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting Next.js dev server...
echo.
echo Visit: http://localhost:3000
echo Login: http://localhost:3000/login
echo.
call npm run dev
