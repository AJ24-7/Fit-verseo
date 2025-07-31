@echo off
setlocal enabledelayedexpansion
title Fitverse Agent Tester
echo =======================================
echo Fitverse Biometric Agent Tester
echo =======================================
echo.

echo Testing connection to http://localhost:5001...
echo.

:: Test basic connectivity
ping -n 1 localhost >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot reach localhost - network issue
    goto END
)

:: Test if port 5001 is open
netstat -an | findstr :5001 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Port 5001 is not open
    echo INFO: The agent is not running or not listening on port 5001
    echo.
    echo Checking if service exists...
    sc query "Fitverse Biometric Agent" >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Service not installed
        echo INFO: Run install-simple-agent.bat as administrator
    ) else (
        echo SUCCESS: Service exists
        echo Checking service status...
        for /f "tokens=3 delims=: " %%H in ('sc query "Fitverse Biometric Agent" ^| findstr "        STATE"') do (
            set "SERVICE_STATE=%%H"
        )
        echo Service Status: !SERVICE_STATE!
        if not "!SERVICE_STATE!"=="RUNNING" (
            echo INFO: Service not running - try: sc start "Fitverse Biometric Agent"
        )
    )
    goto END
) else (
    echo SUCCESS: Port 5001 is open
)

:: Test HTTP connection
echo Testing HTTP connection...
echo.

:: Try simple curl first
curl -s --connect-timeout 10 http://localhost:5001/health >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to agent via HTTP
    echo INFO: Agent may be starting up or blocked by firewall
    echo.
    echo Attempting detailed diagnosis...
    echo.
    
    :: Try telnet to test basic TCP connection
    echo Testing raw TCP connection to port 5001...
    echo quit | telnet localhost 5001 2>nul | findstr "Connected" >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Cannot establish TCP connection
        echo INFO: Service may not be listening or port blocked
    ) else (
        echo SUCCESS: TCP connection successful
        echo INFO: Port is open but HTTP not responding - possible service issue
    )
    
    echo.
    echo Checking what's using port 5001...
    netstat -ano | findstr :5001
    echo.
    
    :: Try different HTTP methods
    echo Trying alternative HTTP test...
    echo GET / HTTP/1.1 | ncat localhost 5001 --send-only --recv-only -w 3 2>nul >nul
    if errorlevel 1 (
        echo ERROR: Raw HTTP test failed
    ) else (
        echo WARNING: Raw HTTP partially successful
    )
    
) else (
    echo SUCCESS: HTTP connection successful
    
    :: Get agent status
    echo.
    echo Getting agent status...
    curl -s http://localhost:5001/health 2>nul
    if errorlevel 1 (
        echo ERROR: Failed to get status response
    ) else (
        echo.
        echo.
        echo SUCCESS: Agent is working correctly!
    )
)

:END
echo.
echo =======================================
echo Test completed
echo =======================================
echo.
echo If issues persist:
echo 1. Check Windows Services for "Fitverse Biometric Agent"
echo 2. Check Windows Firewall settings
echo 3. Try running: install-startup-agent.bat
echo 4. Check Windows Event Viewer for errors
echo 5. Run advanced-diagnostics.bat as administrator
echo.
pause
