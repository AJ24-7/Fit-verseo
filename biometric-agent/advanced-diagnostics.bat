@echo off
title Fitverse Agent Diagnostics
echo =======================================
echo Running Advanced Diagnostics...
echo =======================================
echo.

:: Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell available'" >nul 2>&1
if errorlevel 1 (
    echo ❌ PowerShell not available
    echo 💡 This tool requires PowerShell
    pause
    exit /b 1
)

:: Run the PowerShell diagnostics script
echo Running PowerShell diagnostics...
echo Please allow Windows to run the script when prompted.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-firewall.ps1"

echo.
echo =======================================
echo Diagnostics completed
echo =======================================
pause
