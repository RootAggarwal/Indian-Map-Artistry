@echo off
setlocal
title GEOPIC - Stop
cd /d "%~dp0"

echo ============================================================
echo   GEOPIC - Stopping everything
echo ============================================================
echo.

echo Stopping app processes (server + client)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*india-map-artistry*' -and ($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo Stopping database + pgAdmin containers...
docker compose down

echo.
echo Done.
pause
endlocal
