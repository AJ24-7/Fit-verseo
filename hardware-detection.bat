@echo off
echo ============================================================
echo 🔍 Biometric Hardware Detection Script
echo ============================================================
echo.

echo 📱 Scanning for Fingerprint Devices...
echo ----------------------------------------
wmic path Win32_PnPEntity where "Name like '%%fingerprint%%' or Name like '%%biometric%%'" get Name,DeviceID /format:csv | findstr /v "Node"
echo.
echo 🔍 Scanning for Known Fingerprint Scanner Brands...
echo ----------------------------------------------------
wmic path Win32_PnPEntity where "Name like '%%DigitalPersona%%' or Name like '%%SecuGen%%' or Name like '%%ZKTeco%%' or Name like '%%Suprema%%' or Name like '%%Futronic%%'" get Name,DeviceID /format:csv | findstr /v "Node"
echo.
echo 🇮🇳 Scanning for Indian Fingerprint Scanner Brands...
echo ------------------------------------------------------
wmic path Win32_PnPEntity where "Name like '%%Mantra%%' or Name like '%%Bio-Max%%' or Name like '%%BioMax%%' or Name like '%%MX%%' or Name like '%%Time Dynamo%%' or Name like '%%TimeDynamo%%' or Name like '%%Startek%%' or Name like '%%Evolute%%' or Name like '%%Precision%%'" get Name,DeviceID /format:csv | findstr /v "Node"

echo.
echo 📷 Scanning for Camera Devices...
echo ----------------------------------
wmic path Win32_PnPEntity where "Name like '%%camera%%' or Name like '%%webcam%%' or Name like '%%imaging%%'" get Name,DeviceID /format:csv | findstr /v "Node"

echo.
echo 🔌 Scanning for USB Biometric Devices...
echo ------------------------------------------
wmic path Win32_USBHub get Name,DeviceID /format:csv | findstr /i "SecuGen\|DigitalPersona\|Futronic\|ZKTeco\|Morpho\|Suprema\|Nitgen\|Crossmatch\|Lumidigm\|AuthenTec\|Mantra\|BioMax\|Bio-Max\|TimeDynamo\|Time-Dynamo\|Startek\|Evolute\|Precision"

echo.
echo 🩺 Checking Biometric Agent Status...
echo --------------------------------------
curl -s http://localhost:5001/health 2>nul || echo Agent not running on port 5001

echo.
echo 🌐 Checking Main Server Status...
echo ----------------------------------
curl -s http://localhost:5000/test-route 2>nul || echo Server not running on port 5000

echo.
echo ============================================================
echo 📊 Hardware Detection Complete
echo ============================================================
echo.
echo Recommendations:
echo - If no fingerprint devices found, connect a USB fingerprint scanner
echo - If cameras found, face recognition will work
echo - If services not running, start them before testing
echo.
pause
