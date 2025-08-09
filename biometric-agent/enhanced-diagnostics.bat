@echo off
:: Enhanced Biometric Agent Diagnostics
:: Comprehensive system and agent diagnostics

setlocal EnableDelayedExpansion

echo.
echo ================================================================
echo       Enhanced Biometric Agent - System Diagnostics
echo ================================================================
echo.

set "AGENT_DIR=%~dp0"
set "LOG_FILE=%AGENT_DIR%diagnostics.log"

:: Initialize log
echo [%date% %time%] Starting Enhanced Agent Diagnostics > "%LOG_FILE%"

echo 📋 Running comprehensive diagnostics...
echo 📄 Results will be saved to: diagnostics.log
echo.

:: Check System Information
echo ┌─ SYSTEM INFORMATION ────────────────────────────────────────
echo System Information: >> "%LOG_FILE%"
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"Total Physical Memory" >> "%LOG_FILE%"

for /f "tokens=2 delims=:" %%a in ('systeminfo ^| findstr /C:"OS Name"') do (
    set "OS_NAME=%%a"
    set "OS_NAME=!OS_NAME:~1!"
)
for /f "tokens=2 delims=:" %%a in ('systeminfo ^| findstr /C:"Total Physical Memory"') do (
    set "MEMORY=%%a"
    set "MEMORY=!MEMORY:~1!"
)

echo OS: !OS_NAME!
echo Memory: !MEMORY!
echo └─────────────────────────────────────────────────────────────
echo.

:: Check Node.js and npm
echo ┌─ NODE.JS ENVIRONMENT ───────────────────────────────────────
echo Node.js Environment: >> "%LOG_FILE%"

echo Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%a in ('node --version 2^>nul') do (
        echo ✅ Node.js: %%a
        echo Node.js: %%a >> "%LOG_FILE%"
    )
) else (
    echo ❌ Node.js: Not installed or not in PATH
    echo Node.js: NOT FOUND >> "%LOG_FILE%"
)

echo Checking npm...
npm --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%a in ('npm --version 2^>nul') do (
        echo ✅ npm: %%a
        echo npm: %%a >> "%LOG_FILE%"
    )
) else (
    echo ❌ npm: Not installed or not in PATH
    echo npm: NOT FOUND >> "%LOG_FILE%"
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Agent Files
echo ┌─ AGENT FILES ───────────────────────────────────────────────
echo Agent Files Check: >> "%LOG_FILE%"

set "REQUIRED_FILES=enhanced-agent.js enhanced-service-manager.js enhanced-installer.bat enhanced-test-suite.js package.json"
echo Checking required files...

for %%F in (%REQUIRED_FILES%) do (
    if exist "%AGENT_DIR%%%F" (
        echo ✅ %%F
        echo Found: %%F >> "%LOG_FILE%"
    ) else (
        echo ❌ %%F (MISSING)
        echo Missing: %%F >> "%LOG_FILE%"
    )
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Dependencies
echo ┌─ NPM DEPENDENCIES ──────────────────────────────────────────
echo NPM Dependencies: >> "%LOG_FILE%"

cd /d "%AGENT_DIR%"
if exist "node_modules" (
    echo ✅ node_modules directory exists
    echo node_modules: EXISTS >> "%LOG_FILE%"
    
    :: Check specific important modules
    if exist "node_modules\express" (
        echo ✅ express module installed
        echo express: INSTALLED >> "%LOG_FILE%"
    ) else (
        echo ❌ express module missing
        echo express: MISSING >> "%LOG_FILE%"
    )
    
    if exist "node_modules\node-windows" (
        echo ✅ node-windows module installed
        echo node-windows: INSTALLED >> "%LOG_FILE%"
    ) else (
        echo ❌ node-windows module missing
        echo node-windows: MISSING >> "%LOG_FILE%"
    )
) else (
    echo ❌ node_modules directory not found
    echo node_modules: NOT FOUND >> "%LOG_FILE%"
    echo 💡 Run 'npm install' to install dependencies
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Network and Ports
echo ┌─ NETWORK & PORTS ───────────────────────────────────────────
echo Network & Ports: >> "%LOG_FILE%"

echo Checking port 5001 availability...
netstat -ano | findstr ":5001" >nul 2>&1
if %errorLevel% equ 0 (
    echo ⚠️ Port 5001 is in use
    echo Port 5001: IN USE >> "%LOG_FILE%"
    echo Current connections on port 5001:
    netstat -ano | findstr ":5001"
    netstat -ano | findstr ":5001" >> "%LOG_FILE%"
) else (
    echo ✅ Port 5001 is available
    echo Port 5001: AVAILABLE >> "%LOG_FILE%"
)

:: Check if agent is responding
echo Checking agent connectivity...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5001/health' -TimeoutSec 5 -UseBasicParsing; Write-Output 'Agent Status: RESPONDING'; Write-Output ('Status Code: ' + $response.StatusCode) } catch { Write-Output 'Agent Status: NOT RESPONDING' }" 2>nul

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Windows Service
echo ┌─ WINDOWS SERVICE ───────────────────────────────────────────
echo Windows Service: >> "%LOG_FILE%"

echo Checking FitverseBiometricAgent service...
sc query "FitverseBiometricAgent" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Service is installed
    echo Service: INSTALLED >> "%LOG_FILE%"
    
    :: Get service status
    for /f "tokens=*" %%a in ('sc query "FitverseBiometricAgent" ^| findstr "STATE"') do (
        echo Service %%a
        echo %%a >> "%LOG_FILE%"
    )
) else (
    echo ❌ Service is not installed
    echo Service: NOT INSTALLED >> "%LOG_FILE%"
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Biometric Devices
echo ┌─ BIOMETRIC DEVICES ─────────────────────────────────────────
echo Biometric Devices: >> "%LOG_FILE%"

echo Scanning for biometric devices...
wmic path Win32_PnPEntity where "Name like '%%fingerprint%%' or Name like '%%biometric%%'" get Name /format:list 2>nul | findstr "Name=" > temp_devices.txt
if exist temp_devices.txt (
    for /f "tokens=2 delims==" %%a in (temp_devices.txt) do (
        if not "%%a"=="" (
            echo ✅ Found: %%a
            echo Device: %%a >> "%LOG_FILE%"
        )
    )
    del temp_devices.txt
) else (
    echo ⚠️ No fingerprint devices detected
    echo Fingerprint Devices: NONE DETECTED >> "%LOG_FILE%"
)

echo Scanning for camera devices...
wmic path Win32_PnPEntity where "Name like '%%camera%%' or Name like '%%webcam%%'" get Name /format:list 2>nul | findstr "Name=" > temp_cameras.txt
if exist temp_cameras.txt (
    for /f "tokens=2 delims==" %%a in (temp_cameras.txt) do (
        if not "%%a"=="" (
            echo ✅ Found: %%a
            echo Camera: %%a >> "%LOG_FILE%"
        )
    )
    del temp_cameras.txt
) else (
    echo ⚠️ No camera devices detected
    echo Camera Devices: NONE DETECTED >> "%LOG_FILE%"
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Firewall
echo ┌─ WINDOWS FIREWALL ──────────────────────────────────────────
echo Windows Firewall: >> "%LOG_FILE%"

echo Checking firewall rules for port 5001...
netsh advfirewall firewall show rule name="Fitverse Biometric Agent" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Firewall rule exists
    echo Firewall Rule: EXISTS >> "%LOG_FILE%"
) else (
    echo ⚠️ Firewall rule not found
    echo Firewall Rule: NOT FOUND >> "%LOG_FILE%"
    echo 💡 You may need to add a firewall rule for port 5001
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Logs
echo ┌─ LOG FILES ─────────────────────────────────────────────────
echo Log Files: >> "%LOG_FILE%"

if exist "%AGENT_DIR%agent.log" (
    echo ✅ agent.log exists
    for %%F in ("%AGENT_DIR%agent.log") do (
        echo    Size: %%~zF bytes
        echo    Modified: %%~tF
    )
    echo agent.log: EXISTS >> "%LOG_FILE%"
) else (
    echo ⚠️ agent.log not found
    echo agent.log: NOT FOUND >> "%LOG_FILE%"
)

if exist "%AGENT_DIR%installation.log" (
    echo ✅ installation.log exists
    echo installation.log: EXISTS >> "%LOG_FILE%"
) else (
    echo ⚠️ installation.log not found
    echo installation.log: NOT FOUND >> "%LOG_FILE%"
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Check Permissions
echo ┌─ PERMISSIONS ───────────────────────────────────────────────
echo Permissions: >> "%LOG_FILE%"

echo Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Running with administrator privileges
    echo Admin Rights: YES >> "%LOG_FILE%"
) else (
    echo ⚠️ Not running with administrator privileges
    echo Admin Rights: NO >> "%LOG_FILE%"
    echo 💡 Some operations may require administrator rights
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Performance Check
echo ┌─ SYSTEM PERFORMANCE ────────────────────────────────────────
echo System Performance: >> "%LOG_FILE%"

echo Checking CPU usage...
for /f "skip=1 tokens=2 delims= " %%a in ('wmic cpu get loadpercentage /value ^| findstr "="') do (
    for /f "tokens=2 delims==" %%b in ("%%a") do (
        echo CPU Usage: %%b%%
        echo CPU Usage: %%b%% >> "%LOG_FILE%"
    )
)

echo Checking available memory...
for /f "skip=1 tokens=2 delims= " %%a in ('wmic OS get FreePhysicalMemory /value ^| findstr "="') do (
    for /f "tokens=2 delims==" %%b in ("%%a") do (
        set /a "FREE_MB=%%b/1024"
        echo Available Memory: !FREE_MB! MB
        echo Available Memory: !FREE_MB! MB >> "%LOG_FILE%"
    )
)

echo └─────────────────────────────────────────────────────────────
echo.

:: Summary and Recommendations
echo ================================================================
echo                          SUMMARY
echo ================================================================
echo Diagnostics completed at %date% %time% >> "%LOG_FILE%"

echo 📊 Diagnostic Summary:
echo.
echo 📄 Detailed results saved to: %LOG_FILE%
echo.
echo 🔧 Recommended Actions:
echo.

:: Check for critical issues and provide recommendations
if not exist "node_modules" (
    echo ❗ CRITICAL: Run 'npm install' to install dependencies
)

netstat -ano | findstr ":5001" >nul 2>&1
if %errorLevel% equ 0 (
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5001/health' -TimeoutSec 5 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
    if %errorLevel% neq 0 (
        echo ❗ WARNING: Port 5001 in use but agent not responding
        echo   → Check what's using the port and stop it if needed
    )
)

sc query "FitverseBiometricAgent" >nul 2>&1
if %errorLevel% neq 0 (
    echo 💡 TIP: Install as Windows service for continuous operation
    echo   → Run 'enhanced-installer.bat' as Administrator
)

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 💡 TIP: Run as Administrator for full functionality
    echo   → Right-click and select 'Run as Administrator'
)

echo.
echo 🚀 Quick Actions:
echo   • Test agent: node enhanced-test-suite.js
echo   • Start agent: quick-start.bat
echo   • Install service: enhanced-installer.bat (as Admin)
echo   • Manage service: manage-service.bat
echo.

echo ================================================================
echo.
pause
