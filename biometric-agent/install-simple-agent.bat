@echo off
setlocal enabledelayedexpansion
title Fitverse Agent Service Installer

:: Test basic batch functionality
echo Testing batch file functionality...
echo Current time: %TIME%
echo Current user: %USERNAME%
echo.

echo ===================================================
echo Fitverse Simple Biometric Agent Service Installer
echo ===================================================
echo.
echo IMPORTANT: Make sure you're running this script from the
echo biometric-agent directory containing all required files:
echo - simple-agent.js
echo - simple-package.json  
echo - install-service.js
echo.
echo Starting installation process...
echo.

:: Change to script directory
cd /d "%~dp0"
echo Working directory: %CD%
echo.

:: Add a small delay to ensure window stays open
timeout /t 2 /nobreak >nul

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo SUCCESS: Node.js detected
node --version
echo.

:: Check if running as administrator
echo Checking administrator privileges...
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: This installer requires administrator privileges
    echo Please right-click and select "Run as administrator"
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo SUCCESS: Administrator privileges confirmed
echo.

:: Create installation directory
set INSTALL_DIR=%ProgramFiles%\Fitverse\BiometricAgent
echo 📁 Creating installation directory: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul

:: Copy only necessary files for simple agent
echo Copying simple agent files...
echo Source directory: %~dp0
echo Target directory: %INSTALL_DIR%
echo.

if not exist "%~dp0simple-agent.js" (
    echo ERROR: simple-agent.js not found in script directory
    echo Script directory: %~dp0
    echo Current directory: %CD%
    echo.
    echo Please run this script from the biometric-agent directory
    echo containing: simple-agent.js, simple-package.json, install-service.js
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

if not exist "%~dp0simple-package.json" (
    echo ERROR: simple-package.json not found in script directory
    echo Script directory: %~dp0
    echo Current directory: %CD%
    echo.
    echo Please run this script from the biometric-agent directory
    echo containing: simple-agent.js, simple-package.json, install-service.js
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

if not exist "%~dp0install-service.js" (
    echo ERROR: install-service.js not found in script directory
    echo Script directory: %~dp0
    echo Current directory: %CD%
    echo.
    echo Please run this script from the biometric-agent directory
    echo containing: simple-agent.js, simple-package.json, install-service.js
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

copy "%~dp0simple-agent.js" "%INSTALL_DIR%\" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to copy simple-agent.js
    echo Check if installation directory is writable: %INSTALL_DIR%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

copy "%~dp0simple-package.json" "%INSTALL_DIR%\package.json" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to copy simple-package.json
    echo Source: %~dp0simple-package.json
    echo Target: %INSTALL_DIR%\package.json
    echo Check if installation directory is writable: %INSTALL_DIR%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

copy "%~dp0install-service.js" "%INSTALL_DIR%\" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to copy install-service.js
    echo Check if installation directory is writable: %INSTALL_DIR%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo SUCCESS: Files copied successfully

:: Check if node-windows is available globally, if not install it
echo 📦 Checking for node-windows...
npm list -g node-windows >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing node-windows globally...
    npm install -g node-windows
    if errorlevel 1 (
        echo ❌ Failed to install node-windows globally
        echo 📦 Installing locally instead...
    )
)

:: Navigate to installation directory
cd /d "%INSTALL_DIR%"
echo Changed to installation directory: %CD%

:: Install minimal dependencies with better error handling
echo 📦 Installing lightweight dependencies...
echo This may take a few minutes...
npm install express@^4.18.2 cors@^2.8.5 --production --no-optional --no-audit 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install basic dependencies
    echo Retrying with force flag...
    npm install express cors --production --force --no-optional --no-audit 2>&1
    if errorlevel 1 (
        echo ERROR: Could not install dependencies at all
        echo Please check your internet connection and try again
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)

:: Install node-windows for service management
echo 📦 Installing service management tools...
npm install node-windows@^1.0.0-beta.8 --save --no-optional --no-audit 2>&1
if errorlevel 1 (
    echo WARNING: Failed to install node-windows, trying alternative...
    npm install node-windows --force --no-optional --no-audit 2>&1
    if errorlevel 1 (
        echo ERROR: Could not install node-windows at all
        echo The service may not work properly
        echo.
        echo Press any key to continue anyway...
        pause >nul
    )
)

:: Install as Windows service
echo Installing as Windows service...
node install-service.js install 2>&1
if errorlevel 1 (
    echo ERROR: Service installation failed
    echo Checking if service already exists...
    sc query "Fitverse Biometric Agent" >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Service not found. Installation completely failed.
        echo.
        echo Possible causes:
        echo - Antivirus software blocking the installation
        echo - Windows User Account Control blocking service creation
        echo - Node.js permissions issue
        echo - Missing node-windows dependency
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    ) else (
        echo WARNING: Service already exists, continuing...
    )
) else (
    echo SUCCESS: Service installation completed
)

:: Wait for service installation
echo ⏳ Waiting for service installation to complete...
timeout /t 10 /nobreak >nul

:: Configure service for automatic restart on failure
echo 🔄 Configuring automatic restart on failure...
sc config "Fitverse Biometric Agent" start= auto
sc failure "Fitverse Biometric Agent" reset= 60 actions= restart/5000/restart/10000/restart/30000

:: Set service to start automatically and restart on failure
echo ⚙️ Setting service recovery options...
sc config "Fitverse Biometric Agent" start= auto
sc config "Fitverse Biometric Agent" obj= LocalSystem

:: Start the service
echo 🚀 Starting the service...
sc start "Fitverse Biometric Agent"

:: Create desktop shortcut for service management
echo 🔗 Creating service management shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Fitverse Agent Monitor.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\monitor-service.bat'; $Shortcut.Arguments = ''; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

:: Create uninstaller
echo 📄 Creating uninstaller...
(
echo @echo off
echo echo Uninstalling Fitverse Biometric Agent...
echo sc stop "Fitverse Biometric Agent"
echo cd /d "%INSTALL_DIR%"
echo node install-service.js uninstall
echo timeout /t 2 /nobreak ^>nul
echo del "%USERPROFILE%\Desktop\Fitverse Agent Monitor.lnk" 2^>nul
echo cd /d "%ProgramFiles%\Fitverse"
echo rd /s /q "%INSTALL_DIR%" 2^>nul
echo reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /f 2^>nul
echo echo Uninstallation complete
echo pause
) > "%INSTALL_DIR%\uninstall.bat"

:: Register in Windows Programs
echo 📋 Registering in Windows Programs...
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /v "DisplayName" /t REG_SZ /d "Fitverse Biometric Agent" /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /v "UninstallString" /t REG_SZ /d "\"%INSTALL_DIR%\uninstall.bat\"" /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /v "Publisher" /t REG_SZ /d "Fitverse" /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FitverseBiometricAgent" /v "InstallLocation" /t REG_SZ /d "%INSTALL_DIR%" /f >nul

:: Test if service is running
echo 🔍 Testing service status...
timeout /t 5 /nobreak >nul
sc query "Fitverse Biometric Agent" | find "RUNNING" >nul
if %errorlevel%==0 (
    echo ✅ Service is running successfully
) else (
    echo ⚠️ Service may not be running, trying to start again...
    sc start "Fitverse Biometric Agent"
    timeout /t 5 /nobreak >nul
)

echo.
echo ===================================
echo ✅ Installation completed successfully!
echo ===================================
echo.
echo The Fitverse Simple Biometric Agent has been:
echo • Installed as a Windows service named "Fitverse Biometric Agent"
echo • Configured to start automatically with Windows
echo • Set to auto-restart on failure (every 5-30 seconds)
echo • Running on http://localhost:5001
echo.
echo Service Management:
echo • Desktop shortcut: "Fitverse Agent Monitor" - monitors and manages the service
echo • Windows Services: Search for "Fitverse Biometric Agent"
echo • Manual commands available in the troubleshooting guide
echo.
echo Auto-Recovery Features:
echo • Service restarts automatically if it crashes
echo • Recovery actions: restart after 5s, 10s, then 30s delays
echo • Monitor script can check and restart if needed
echo.
echo To uninstall, use "Add or Remove Programs" or run:
echo %INSTALL_DIR%\uninstall.bat
echo.
echo Testing connection to agent...
timeout /t 3 /nobreak >nul

:: Test the agent multiple times to ensure it's stable
set RETRY_COUNT=0
:TEST_AGENT
set /a RETRY_COUNT+=1
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Agent is responding at http://localhost:5001
    echo 🎉 Installation successful! The agent is ready for use.
    goto INSTALLATION_COMPLETE
) else (
    if %RETRY_COUNT% LSS 8 (
        echo ⏳ Waiting for agent to start... (attempt %RETRY_COUNT%/8)
        timeout /t 5 /nobreak >nul
        goto TEST_AGENT
    ) else (
        echo ⚠️ Agent may still be starting up or there's an issue
        echo 💡 Use the "Fitverse Agent Monitor" desktop shortcut to check status
        echo 📋 If issues persist, check Windows Event Viewer for errors
        echo.
        echo Manual troubleshooting:
        echo 1. Check Windows Services for "Fitverse Biometric Agent"
        echo 2. Try: sc start "Fitverse Biometric Agent"
        echo 3. Check Windows Event Viewer ^> Applications and Services Logs
    )
)

:INSTALLATION_COMPLETE
echo.
echo =======================================
echo Installation completed successfully!
echo =======================================
echo.
echo The Fitverse Biometric Agent service has been installed and started.
echo You can use Windows Services to manage it, or use the desktop shortcut.
echo.
goto EXIT_SCRIPT

:ERROR_EXIT
echo.
echo =======================================
echo Installation failed!
echo =======================================
echo.
echo Please check the error messages above and try again.
echo Common solutions:
echo 1. Run as administrator
echo 2. Check internet connection for npm packages
echo 3. Temporarily disable antivirus
echo 4. Try install-startup-agent.bat as fallback
echo.

:EXIT_SCRIPT
echo Press any key to exit...
pause >nul
