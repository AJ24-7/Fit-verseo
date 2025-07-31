@echo off
title Direct Agent Test - Debug Mode
echo =======================================
echo Direct Agent Test (Debug Mode)
echo =======================================
echo.

:: Change to the directory where this script is located
cd /d "%~dp0"
echo Working directory: %CD%
echo.

echo This will run the agent directly to test functionality
echo without using the Windows service.
echo.

:: Check if Node.js is available
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found in PATH
    echo INFO: Please install Node.js or add it to your PATH
    echo.
    echo Your current PATH:
    echo %PATH%
    goto END
)

echo SUCCESS: Node.js found
node --version
echo.

:: List all files in current directory
echo Files in current directory:
dir /b
echo.

:: Check if simple-agent.js exists
if not exist "simple-agent.js" (
    echo ERROR: simple-agent.js not found in current directory
    echo Current directory: %CD%
    echo.
    echo Looking for JS files:
    dir *.js 2>nul
    echo.
    echo INFO: Make sure you extracted the agent files and are running this from the agent folder
    goto END
)

echo SUCCESS: simple-agent.js found
echo.

:: Check if package.json exists
if not exist "package.json" (
    echo WARNING: package.json not found
    echo Creating basic package.json for dependencies...
    echo {> package.json
    echo   "name": "fitverse-biometric-agent",>> package.json
    echo   "version": "1.0.0",>> package.json
    echo   "dependencies": {>> package.json
    echo     "express": "^4.18.0",>> package.json
    echo     "cors": "^2.8.5">> package.json
    echo   }>> package.json
    echo }>> package.json
    echo SUCCESS: Basic package.json created
) else (
    echo SUCCESS: package.json found
)

echo.
echo Installing/checking dependencies...
echo This may take a moment...
npm install 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo.
    echo Error details:
    echo - Check internet connection
    echo - Make sure npm is working: npm --version
    echo - Try running: npm cache clean --force
    echo.
    echo Trying to continue anyway...
    timeout /t 3 /nobreak >nul
) else (
    echo SUCCESS: Dependencies installed
)

echo.
echo Testing simple-agent.js syntax...
node -c simple-agent.js
if errorlevel 1 (
    echo ERROR: Syntax error in simple-agent.js
    echo The agent code has syntax problems
    goto END
) else (
    echo SUCCESS: Agent syntax is valid
)

echo.
echo =======================================
echo Starting agent directly...
echo INFO: Watch for startup messages below
echo INFO: Press Ctrl+C to stop the agent
echo INFO: If it closes immediately, there's a startup error
echo =======================================
echo.

:: Run the agent directly with error capture
echo Starting: node simple-agent.js
echo.
node simple-agent.js 2>&1
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo =======================================
echo Agent process ended with exit code: %EXIT_CODE%
echo =======================================

if %EXIT_CODE% NEQ 0 (
    echo.
    echo ERROR: Agent failed to start or crashed
    echo.
    echo Common causes:
    echo 1. Port 5001 already in use by another service
    echo 2. Missing dependencies - run: npm install
    echo 3. Syntax error in simple-agent.js
    echo 4. Node.js version compatibility issue
    echo.
    echo To check what's using port 5001:
    echo netstat -ano ^| findstr :5001
    echo.
) else (
    echo.
    echo INFO: Agent stopped normally
)

:END
echo.
echo =======================================
echo Direct test completed
echo =======================================
echo.
echo If the agent closed immediately:
echo 1. Check the error messages above
echo 2. Missing dependencies (run: npm install)
echo 3. Port 5001 already in use by another service
echo 4. Check Windows Event Viewer for detailed errors
echo.
pause
pause
