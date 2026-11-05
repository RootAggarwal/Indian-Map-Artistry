@echo off
setlocal EnableDelayedExpansion
title GEOPIC - Seismic Data Processing Atlas
cd /d "%~dp0"

echo ============================================================
echo   GEOPIC - Seismic Data Processing Atlas
echo   One-click launcher
echo ============================================================
echo.

REM ---------------------------------------------------------------
REM 1. Verify Docker Desktop is running
REM ---------------------------------------------------------------
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Desktop is not running.
  echo         Start Docker Desktop, wait for the whale icon, then run this again.
  echo.
  pause
  exit /b 1
)

REM ---------------------------------------------------------------
REM 2. Start the PostGIS database container
REM ---------------------------------------------------------------
echo [1/4] Starting PostGIS database...
docker compose up -d
if errorlevel 1 (
  echo [ERROR] "docker compose up -d" failed.
  pause
  exit /b 1
)

echo       Waiting for database to become healthy...
set /a tries=0
:waitdb
for /f "usebackq tokens=*" %%H in (`docker inspect --format "{{.State.Health.Status}}" geopic-postgres 2^>nul`) do set "HEALTH=%%H"
if /i "!HEALTH!"=="healthy" goto dbready
set /a tries+=1
if !tries! GEQ 60 (
  echo [ERROR] Database did not become healthy in time.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto waitdb
:dbready
echo       Database is ready.

REM ---------------------------------------------------------------
REM 3. Connection string. Host port 5433 maps to the container's 5432.
REM ---------------------------------------------------------------
set "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic"

REM ---------------------------------------------------------------
REM 4. Install dependencies on first run
REM ---------------------------------------------------------------
if not exist "node_modules" (
  echo [2/4] Installing root dependencies...
  call npm install
)
if not exist "server\node_modules" (
  echo [2/4] Installing server dependencies...
  call npm install --prefix server
)
if not exist "client\node_modules" (
  echo [2/4] Installing client dependencies...
  call npm install --prefix client
)

REM ---------------------------------------------------------------
REM 5. Launch. Open the browser a few seconds later, then run both apps.
REM ---------------------------------------------------------------
echo [3/4] Launching server :4000  and  client :3000 ...
start "GEOPIC Browser" /min cmd /c "ping -n 12 127.0.0.1 >nul & start http://localhost:3000"

echo [4/4] Starting... (keep this window open, press Ctrl+C to stop)
echo.
echo   Web app : http://localhost:3000
echo   API     : http://localhost:4000/api
echo   pgAdmin : http://localhost:5050   (admin@geopic.com / admin)
echo.
call npm run dev

endlocal
