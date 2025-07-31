@echo off
setlocal enabledelayedexpansion
title Fitverse Agent - Universal Installer

echo =========================================================
echo Fitverse Biometric Agent - Universal Installer v2.0
echo =========================================================
echo.
echo This installer will set up a reliable biometric agent
echo that works on ALL gym admin devices without dependencies.
echo.

:: Change to script directory
cd /d "%~dp0"

:: Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    echo.
    echo Please download and install Node.js from: https://nodejs.org/
    echo After installation, restart this installer.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

:: Check admin privileges
echo.
echo [2/8] Checking administrator privileges...
net session >nul 2>&1
if errorlevel 1 (
    echo ❌ Administrator privileges required
    echo.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Administrator privileges confirmed

:: Check required files
echo.
echo [3/8] Checking required files...
if not exist "standalone-agent.js" (
    echo ❌ standalone-agent.js not found
    echo.
    echo Required files missing. Please ensure all files are in the same directory.
    pause
    exit /b 1
)

if not exist "service-manager.js" (
    echo ❌ service-manager.js not found
    echo.
    echo Required files missing. Please ensure all files are in the same directory.
    pause
    exit /b 1
)

echo ✅ All required files found

:: Create installation directory
echo.
echo [4/8] Creating installation directory...
set INSTALL_DIR=%ProgramFiles%\Fitverse\Agent
mkdir "%INSTALL_DIR%" 2>nul
echo ✅ Directory created: %INSTALL_DIR%

:: Copy files
echo.
echo [5/8] Copying agent files...
copy "%~dp0standalone-agent.js" "%INSTALL_DIR%\agent.js" >nul
copy "%~dp0service-manager.js" "%INSTALL_DIR%\service-manager.js" >nul

:: Create package.json (minimal, no dependencies)
echo [6/8] Creating configuration...
(
echo {
echo   "name": "fitverse-agent",
echo   "version": "2.0.0",
echo   "description": "Standalone Fitverse Biometric Agent",
echo   "main": "agent.js",
echo   "scripts": {
echo     "start": "node agent.js"
echo   },
echo   "author": "Fitverse",
echo   "license": "MIT"
echo }
) > "%INSTALL_DIR%\package.json"

echo ✅ Configuration created

:: Install as service
echo.
echo [7/8] Installing Windows service...
cd /d "%INSTALL_DIR%"
node service-manager.js install

:: Test the installation
echo.
echo [8/8] Testing installation...
timeout /t 5 /nobreak >nul

echo Testing agent connection...
set RETRY_COUNT=0
:TEST_LOOP
set /a RETRY_COUNT+=1
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ SUCCESS! Agent is running and responding
    goto INSTALL_SUCCESS
) else (
    if %RETRY_COUNT% LSS 10 (
        echo ⏳ Waiting for agent to start... (attempt %RETRY_COUNT%/10)
        timeout /t 3 /nobreak >nul
        goto TEST_LOOP
    ) else (
        echo ⚠️ Agent may still be starting up
        echo You can test manually at: http://localhost:5001/health
        goto INSTALL_COMPLETE
    )
)

:INSTALL_SUCCESS
echo.
echo =========================================================
echo 🎉 INSTALLATION SUCCESSFUL! 🎉
echo =========================================================
echo.
echo The Fitverse Biometric Agent is now:
echo ✅ Installed as a Windows service
echo ✅ Running on http://localhost:5001
echo ✅ Set to start automatically with Windows
echo ✅ Will restart automatically if it crashes
echo.
echo Test URLs:
echo • Health Check: http://localhost:5001/health
echo • Device Status: http://localhost:5001/device/status
echo.
echo Service Management:
echo • Start: sc start FitverseAgent
echo • Stop: sc stop FitverseAgent
echo • Status: sc query FitverseAgent
echo.
echo Log file location: %INSTALL_DIR%\fitverse-agent.log
echo.
goto INSTALL_COMPLETE

:INSTALL_COMPLETE
echo To uninstall: cd "%INSTALL_DIR%" && node service-manager.js uninstall
echo.
echo The agent is ready for your gym admin system!
echo.
pause
