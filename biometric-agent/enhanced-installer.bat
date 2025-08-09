@echo off
:: Enhanced Fitverse Biometric Agent Installer
:: Production-ready installation with comprehensive error handling
:: Version 2.0

setlocal EnableDelayedExpansion

echo.
echo ================================================================
echo       Enhanced Fitverse Biometric Agent Installer v2.0
echo ================================================================
echo.

:: Set variables
set "SERVICE_NAME=FitverseBiometricAgent"
set "INSTALL_DIR=%~dp0"
set "LOG_FILE=%INSTALL_DIR%installation.log"
set "ERROR_COUNT=0"

:: Initialize log file
echo [%date% %time%] Starting Enhanced Biometric Agent Installation > "%LOG_FILE%"

:: Function to log messages
:LOG
echo [%date% %time%] %~1 >> "%LOG_FILE%"
echo %~1
goto :eof

:: Check for administrator privileges
call :LOG "Checking administrator privileges..."
net session >nul 2>&1
if %errorLevel% neq 0 (
    call :LOG "ERROR: Administrator privileges required!"
    echo.
    echo ❌ This installer must be run as Administrator.
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)
call :LOG "✅ Administrator privileges confirmed"

:: Check if Node.js is installed
call :LOG "Checking Node.js installation..."
node --version >nul 2>&1
if %errorLevel% neq 0 (
    call :LOG "ERROR: Node.js not found!"
    echo.
    echo ❌ Node.js is not installed or not in PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x or higher
    echo.
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%a in ('node --version 2^>nul') do set "NODE_VERSION=%%a"
call :LOG "✅ Node.js version: %NODE_VERSION%"

:: Check npm
call :LOG "Checking npm..."
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    call :LOG "ERROR: npm not found!"
    echo ❌ npm is not available. Please reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version 2^>nul') do set "NPM_VERSION=%%a"
call :LOG "✅ npm version: %NPM_VERSION%"

:: Check if port 5001 is available
call :LOG "Checking port 5001 availability..."
netstat -ano | findstr ":5001" >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG "WARNING: Port 5001 appears to be in use"
    echo.
    echo ⚠️ Port 5001 is currently in use.
    echo This may indicate another biometric agent is running.
    echo.
    set /p "CONTINUE=Continue anyway? (y/N): "
    if /i "!CONTINUE!" neq "y" (
        call :LOG "Installation cancelled by user"
        echo Installation cancelled.
        pause
        exit /b 1
    )
) else (
    call :LOG "✅ Port 5001 is available"
)

:: Stop existing service if running
call :LOG "Checking for existing service..."
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG "Found existing service, stopping..."
    echo.
    echo 🛑 Stopping existing biometric agent service...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    
    echo 🗑️ Uninstalling existing service...
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
    call :LOG "Existing service removed"
)

:: Create necessary directories
call :LOG "Creating directories..."
if not exist "%INSTALL_DIR%logs" (
    mkdir "%INSTALL_DIR%logs" 2>nul
    call :LOG "Created logs directory"
)

if not exist "%INSTALL_DIR%config" (
    mkdir "%INSTALL_DIR%config" 2>nul
    call :LOG "Created config directory"
)

:: Check required files
call :LOG "Verifying required files..."
set "REQUIRED_FILES=enhanced-agent.js enhanced-service-manager.js"
for %%F in (%REQUIRED_FILES%) do (
    if not exist "%INSTALL_DIR%%%F" (
        call :LOG "ERROR: Required file missing: %%F"
        echo ❌ Required file not found: %%F
        echo Please ensure all files are in the installation directory.
        pause
        exit /b 1
    )
    call :LOG "✅ Found: %%F"
)

:: Install npm dependencies
call :LOG "Installing npm dependencies..."
echo.
echo 📦 Installing npm dependencies...
echo This may take a few minutes...

cd /d "%INSTALL_DIR%"
npm install --production 2>&1 | findstr /V "npm WARN" 
if %errorLevel% neq 0 (
    call :LOG "ERROR: npm install failed"
    echo.
    echo ❌ Failed to install npm dependencies.
    echo Check the log file for details: %LOG_FILE%
    echo.
    pause
    exit /b 1
)
call :LOG "✅ npm dependencies installed successfully"

:: Install Windows service
call :LOG "Installing Windows service..."
echo.
echo 🔧 Installing Windows service...

node enhanced-service-manager.js install 2>&1
if %errorLevel% neq 0 (
    call :LOG "ERROR: Service installation failed"
    set /A ERROR_COUNT+=1
    echo.
    echo ⚠️ Service installation encountered issues.
    echo Attempting alternative installation method...
    
    :: Try alternative installation
    timeout /t 2 /nobreak >nul
    node enhanced-service-manager.js install 2>&1
    if %errorLevel% neq 0 (
        call :LOG "ERROR: Alternative service installation also failed"
        echo ❌ Service installation failed completely.
        echo Check the log file: %LOG_FILE%
        pause
        exit /b 1
    )
)

call :LOG "✅ Service installation completed"

:: Wait for service to start
echo.
echo ⏳ Waiting for service to start...
call :LOG "Waiting for service startup..."

timeout /t 5 /nobreak >nul

:: Verify service status
call :LOG "Verifying service status..."
sc query "%SERVICE_NAME%" | findstr "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG "✅ Service is running successfully"
    echo ✅ Service is running successfully!
) else (
    call :LOG "WARNING: Service may not be running properly"
    echo ⚠️ Service installed but may not be running properly.
    
    :: Try to start manually
    echo 🔄 Attempting to start service manually...
    sc start "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    
    sc query "%SERVICE_NAME%" | findstr "RUNNING" >nul 2>&1
    if %errorLevel% equ 0 (
        call :LOG "✅ Service started manually"
        echo ✅ Service started successfully!
    ) else (
        call :LOG "ERROR: Service failed to start"
        set /A ERROR_COUNT+=1
        echo ❌ Service failed to start.
        echo Check Windows Event Log for service errors.
    )
)

:: Test agent connectivity
echo.
echo 🌐 Testing agent connectivity...
call :LOG "Testing agent connectivity..."

:: Try to connect to the agent
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5001/health' -TimeoutSec 10 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if %errorLevel% equ 0 (
    call :LOG "✅ Agent connectivity test passed"
    echo ✅ Agent is responding on http://localhost:5001
    set "AGENT_RUNNING=true"
) else (
    call :LOG "WARNING: Agent connectivity test failed"
    echo ⚠️ Agent may not be responding yet (this is sometimes normal)
    set "AGENT_RUNNING=false"
    set /A ERROR_COUNT+=1
)

:: Create desktop shortcut (optional)
echo.
echo 🔗 Creating management shortcuts...
call :LOG "Creating management shortcuts..."

:: Create batch file for service management
echo @echo off > "%INSTALL_DIR%manage-service.bat"
echo echo Fitverse Biometric Agent Service Manager >> "%INSTALL_DIR%manage-service.bat"
echo echo ========================================== >> "%INSTALL_DIR%manage-service.bat"
echo echo 1. Check Status >> "%INSTALL_DIR%manage-service.bat"
echo echo 2. Start Service >> "%INSTALL_DIR%manage-service.bat"
echo echo 3. Stop Service >> "%INSTALL_DIR%manage-service.bat"
echo echo 4. Restart Service >> "%INSTALL_DIR%manage-service.bat"
echo echo 5. View Logs >> "%INSTALL_DIR%manage-service.bat"
echo echo 6. Open Agent Web Interface >> "%INSTALL_DIR%manage-service.bat"
echo echo 7. Exit >> "%INSTALL_DIR%manage-service.bat"
echo echo. >> "%INSTALL_DIR%manage-service.bat"
echo set /p choice=Select option (1-7): >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="1" node enhanced-service-manager.js status >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="2" node enhanced-service-manager.js start >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="3" node enhanced-service-manager.js stop >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="4" node enhanced-service-manager.js restart >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="5" type logs\*.log >> "%INSTALL_DIR%manage-service.bat"
echo if "%%choice%%"=="6" start http://localhost:5001 >> "%INSTALL_DIR%manage-service.bat"
echo pause >> "%INSTALL_DIR%manage-service.bat"

call :LOG "✅ Management shortcut created"

:: Configure Windows Firewall (if needed)
echo.
echo 🔥 Configuring Windows Firewall...
call :LOG "Configuring Windows Firewall..."

netsh advfirewall firewall show rule name="Fitverse Biometric Agent" >nul 2>&1
if %errorLevel% neq 0 (
    netsh advfirewall firewall add rule name="Fitverse Biometric Agent" dir=in action=allow protocol=TCP localport=5001 >nul 2>&1
    if %errorLevel% equ 0 (
        call :LOG "✅ Firewall rule added for port 5001"
        echo ✅ Firewall configured for port 5001
    ) else (
        call :LOG "WARNING: Could not configure firewall"
        echo ⚠️ Could not configure firewall automatically
        echo You may need to manually allow port 5001
    )
) else (
    call :LOG "✅ Firewall rule already exists"
    echo ✅ Firewall already configured
)

:: Final status summary
echo.
echo ================================================================
echo                    INSTALLATION SUMMARY
echo ================================================================
call :LOG "Installation summary:"

if %ERROR_COUNT% equ 0 (
    echo 🎉 INSTALLATION COMPLETED SUCCESSFULLY!
    call :LOG "✅ Installation completed successfully with no errors"
) else (
    echo ⚠️ INSTALLATION COMPLETED WITH %ERROR_COUNT% WARNING(S)
    call :LOG "⚠️ Installation completed with %ERROR_COUNT% warning(s)"
)

echo.
echo 📋 Service Information:
echo    Name: %SERVICE_NAME%
echo    Installation: %INSTALL_DIR%
echo    Port: 5001
echo    Log File: %LOG_FILE%

echo.
echo 🌐 Agent URLs:
echo    Main Interface: http://localhost:5001
echo    Health Check: http://localhost:5001/health
echo    Device Status: http://localhost:5001/api/devices

echo.
echo 🛠️ Management:
echo    Service Manager: manage-service.bat
echo    Direct Control: node enhanced-service-manager.js [command]
echo    Windows Services: services.msc

if "%AGENT_RUNNING%"=="true" (
    echo.
    echo ✅ The biometric agent is now running and ready to use!
) else (
    echo.
    echo ⚠️ The agent may need a few more moments to fully start.
    echo   Check the status in a minute using: manage-service.bat
)

echo.
echo 📚 Next Steps:
echo 1. Test the agent: http://localhost:5001
echo 2. Configure your gym admin system to use: http://localhost:5001
echo 3. Use manage-service.bat for ongoing management
echo 4. Check logs if you encounter any issues

echo.
echo ================================================================
call :LOG "Installation process completed"

:: Ask to open agent interface
echo.
set /p "OPEN_INTERFACE=Open agent web interface now? (y/N): "
if /i "!OPEN_INTERFACE!"=="y" (
    start http://localhost:5001
    call :LOG "Opened agent web interface"
)

echo.
echo Installation log saved to: %LOG_FILE%
echo.
pause
exit /b %ERROR_COUNT%
