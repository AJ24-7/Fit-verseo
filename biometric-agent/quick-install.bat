@echo off
title Fitverse Agent Quick Installer

echo ================================================
echo Fitverse Biometric Agent - Quick Installer
echo ================================================
echo.
echo This script will automatically navigate to the correct
echo directory and run the installation.
echo.

:: Try to find the biometric-agent directory
set AGENT_DIR=""

:: Check common locations
if exist "C:\Users\%USERNAME%\Downloads\gymwebsite\Fit-verseofficial\biometric-agent\install-simple-agent.bat" (
    set AGENT_DIR=C:\Users\%USERNAME%\Downloads\gymwebsite\Fit-verseofficial\biometric-agent
)

if exist "C:\Users\%USERNAME%\Downloads\Fit-verseofficial\biometric-agent\install-simple-agent.bat" (
    set AGENT_DIR=C:\Users\%USERNAME%\Downloads\Fit-verseofficial\biometric-agent
)

if exist ".\biometric-agent\install-simple-agent.bat" (
    set AGENT_DIR=%CD%\biometric-agent
)

if exist ".\install-simple-agent.bat" (
    set AGENT_DIR=%CD%
)

if "%AGENT_DIR%"=="" (
    echo ❌ ERROR: Could not find the biometric-agent directory
    echo.
    echo Please make sure you have the following files in the same directory:
    echo - install-simple-agent.bat
    echo - simple-agent.js
    echo - simple-package.json
    echo - install-service.js
    echo.
    echo Common locations to check:
    echo - C:\Users\%USERNAME%\Downloads\gymwebsite\Fit-verseofficial\biometric-agent\
    echo - C:\Users\%USERNAME%\Downloads\Fit-verseofficial\biometric-agent\
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ✅ Found biometric-agent directory: %AGENT_DIR%
echo.
echo Navigating to directory and starting installation...
echo.
pause

:: Navigate to the correct directory and run the installer
cd /d "%AGENT_DIR%"
call install-simple-agent.bat

echo.
echo Installation script completed.
pause
