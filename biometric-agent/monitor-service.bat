@echo off
title Fitverse Biometric Agent Service Monitor

:CHECK_SERVICE
cls
echo ===============================================
echo Fitverse Biometric Agent Service Monitor
echo ===============================================
echo.

:: Check if service exists
sc query "Fitverse Biometric Agent" >nul 2>&1
if errorlevel 1 (
    echo ❌ Service not found! Please install the agent first.
    echo.
    echo To install, run install-simple-agent.bat as administrator
    pause
    exit /b 1
)

:: Check service status
for /f "tokens=3 delims=: " %%H in ('sc query "Fitverse Biometric Agent" ^| findstr "        STATE"') do (
    set "SERVICE_STATE=%%H"
)

echo Service Status: %SERVICE_STATE%
echo.

if "%SERVICE_STATE%"=="RUNNING" (
    echo ✅ Service is running
    
    :: Test if the agent is responding
    curl -s http://localhost:5001/health >nul 2>&1
    if errorlevel 1 (
        echo ⚠️ Service running but not responding on port 5001
        echo 🔄 Restarting service...
        sc stop "Fitverse Biometric Agent" >nul
        timeout /t 3 /nobreak >nul
        sc start "Fitverse Biometric Agent" >nul
        echo ✅ Service restarted
    ) else (
        echo ✅ Agent responding correctly on http://localhost:5001
    )
) else (
    echo ❌ Service is not running
    echo 🚀 Starting service...
    sc start "Fitverse Biometric Agent" >nul
    timeout /t 5 /nobreak >nul
    
    :: Check if it started successfully
    for /f "tokens=3 delims=: " %%H in ('sc query "Fitverse Biometric Agent" ^| findstr "        STATE"') do (
        set "NEW_STATE=%%H"
    )
    
    if "%NEW_STATE%"=="RUNNING" (
        echo ✅ Service started successfully
    ) else (
        echo ❌ Failed to start service
        echo.
        echo Checking event logs for errors...
        echo You may need to:
        echo 1. Run this as administrator
        echo 2. Check Windows Event Viewer
        echo 3. Reinstall the service
    )
)

echo.
echo ===============================================
echo Commands:
echo R - Restart service
echo S - Stop service
echo Q - Quit monitor
echo A - Auto-monitor (check every 30 seconds)
echo ===============================================
set /p choice="Enter choice (R/S/Q/A): "

if /i "%choice%"=="R" (
    echo 🔄 Restarting service...
    sc stop "Fitverse Biometric Agent" >nul
    timeout /t 3 /nobreak >nul
    sc start "Fitverse Biometric Agent" >nul
    echo ✅ Service restarted
    timeout /t 2 /nobreak >nul
    goto CHECK_SERVICE
)

if /i "%choice%"=="S" (
    echo 🛑 Stopping service...
    sc stop "Fitverse Biometric Agent" >nul
    echo ✅ Service stopped
    timeout /t 2 /nobreak >nul
    goto CHECK_SERVICE
)

if /i "%choice%"=="A" (
    echo 🔄 Starting auto-monitor mode...
    echo Press Ctrl+C to stop monitoring
    echo.
    goto AUTO_MONITOR
)

if /i "%choice%"=="Q" (
    exit /b 0
)

goto CHECK_SERVICE

:AUTO_MONITOR
:: Check service status every 30 seconds
for /f "tokens=3 delims=: " %%H in ('sc query "Fitverse Biometric Agent" ^| findstr "        STATE"') do (
    set "SERVICE_STATE=%%H"
)

echo [%date% %time%] Service Status: %SERVICE_STATE%

if not "%SERVICE_STATE%"=="RUNNING" (
    echo [%date% %time%] ❌ Service not running - attempting restart...
    sc start "Fitverse Biometric Agent" >nul
    timeout /t 5 /nobreak >nul
) else (
    :: Test if responding
    curl -s http://localhost:5001/health >nul 2>&1
    if errorlevel 1 (
        echo [%date% %time%] ⚠️ Service not responding - restarting...
        sc stop "Fitverse Biometric Agent" >nul
        timeout /t 3 /nobreak >nul
        sc start "Fitverse Biometric Agent" >nul
    ) else (
        echo [%date% %time%] ✅ Service healthy
    )
)

timeout /t 30 /nobreak >nul
goto AUTO_MONITOR
