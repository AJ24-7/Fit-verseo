@echo off
echo ===================================================
echo Fitverse Simple Agent - Startup Method Installer
echo ===================================================
echo.
echo This installer will set up the agent to start automatically
echo using Windows startup folder instead of Windows service.
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ✅ Node.js detected
echo.

:: Create installation directory
set INSTALL_DIR=%USERPROFILE%\FitverseBiometricAgent
echo 📁 Creating installation directory: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul

:: Copy files
echo 📋 Copying agent files...
copy "%~dp0simple-agent.js" "%INSTALL_DIR%\"
copy "%~dp0simple-package.json" "%INSTALL_DIR%\package.json"

:: Navigate to installation directory
cd /d "%INSTALL_DIR%"

:: Install dependencies
echo 📦 Installing dependencies...
npm install express cors --production

:: Create startup script
echo 📄 Creating startup script...
(
echo @echo off
echo title Fitverse Biometric Agent
echo cd /d "%INSTALL_DIR%"
echo echo Starting Fitverse Biometric Agent...
echo echo Agent will be available at http://localhost:5001
echo echo Close this window to stop the agent
echo echo.
echo node simple-agent.js
echo pause
) > "%INSTALL_DIR%\start-agent.bat"

:: Create startup link
echo 🔗 Adding to Windows startup...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy "%INSTALL_DIR%\start-agent.bat" "%STARTUP_DIR%\Fitverse-Agent-Startup.bat"

:: Create desktop shortcut
echo 🔗 Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Start Fitverse Agent.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-agent.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

:: Start the agent
echo 🚀 Starting the agent...
start "Fitverse Agent" "%INSTALL_DIR%\start-agent.bat"

:: Wait for startup
timeout /t 5 /nobreak >nul

:: Test connection
echo 🔍 Testing connection...
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Agent is running at http://localhost:5001
    echo 🎉 Installation successful!
) else (
    echo ⚠️ Agent may still be starting up
    echo Please check the agent window or try the desktop shortcut
)

echo.
echo ===================================
echo ✅ Installation completed!
echo ===================================
echo.
echo The agent has been set up to:
echo • Start automatically when Windows starts
echo • Run in a visible command window
echo • Available at http://localhost:5001
echo.
echo Management:
echo • Desktop shortcut: "Start Fitverse Agent"
echo • Agent runs in visible window
echo • Close the window to stop the agent
echo.
echo To remove from startup:
echo Delete: %STARTUP_DIR%\Fitverse-Agent-Startup.bat
echo.
echo Press any key to exit...
pause >nul
