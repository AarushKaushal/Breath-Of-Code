@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo  🚀 FINTECH SYSTEM - STARTUP
echo ========================================================

echo [1/4] Checking Prerequisites...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python and add it to PATH.
    pause
    exit /b 1
)

REM Check NPM
call npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] NPM/Node.js not found. 
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Prerequisites OK.

REM [2/4] Setup Python Environment
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create .venv
        pause
        exit /b 1
    )
)

set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
set "PIP_EXE=%~dp0.venv\Scripts\pip.exe"

echo Updating backend dependencies...
"%PIP_EXE%" install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

REM [3/4] Setup Frontend (NPM)
echo.
echo [3/4] Building Frontend...
pushd frontend

echo Installing/Updating frontend packages...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    popd
    pause
    exit /b 1
)

echo Building production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    popd
    pause
    exit /b 1
)
popd

REM [4/4] Launch System
echo.
echo [4/4] Starting Backend Server...

set "APP_PORT=5000"
REM Simple check if port is busy
"%PYTHON_EXE%" -c "import socket; s=socket.socket(); s.connect(('127.0.0.1', 5000))" >nul 2>&1
if %errorlevel% == 0 (
    echo Port 5000 is occupied, switching to 5001.
    set "APP_PORT=5001"
)

echo.
echo ========================================================
echo  ✅ SUCCESS: System is running!
echo  URL: http://localhost:%APP_PORT%
echo ========================================================
echo.

"%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port %APP_PORT%

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The backend crashed or failed to start.
    pause
)

pause
