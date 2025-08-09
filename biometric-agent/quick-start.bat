@echo off
:: Quick Start Script for Enhanced Biometric Agent
:: This script helps you get started with the enhanced agent quickly

echo.
echo ========================================================
echo    Enhanced Fitverse Biometric Agent - Quick Start
echo ========================================================
echo.

set "AGENT_DIR=%~dp0"
cd /d "%AGENT_DIR%"

echo 🔍 Checking if agent is already running...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5001/health' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if %errorLevel% equ 0 (
    echo ✅ Agent is already running!
    echo 🌐 Opening agent web interface...
    start http://localhost:5001
    echo.
    echo 📋 Available options:
    echo 1. View status: http://localhost:5001/health
    echo 2. Check devices: http://localhost:5001/api/devices
    echo 3. Run tests: node enhanced-test-suite.js
    echo 4. Manage service: manage-service.bat
    echo.
    pause
    exit /b 0
)

echo 📝 Agent not running. Let's start it!
echo.

:: Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorLevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Starting Enhanced Biometric Agent...
echo 💡 This will run the agent in development mode
echo 🛑 Press Ctrl+C to stop the agent
echo.

:: Start the enhanced agent directly
node enhanced-agent.js

pause
