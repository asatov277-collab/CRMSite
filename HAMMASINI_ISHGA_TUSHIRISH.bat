@echo off
chcp 65001 >nul
title WESTMINSTER CRM - HAMMASINI ISHGA TUSHIRISH
cd /d "%~dp0"
cls

echo ============================================================
echo   🏛️ WESTMINSTER CRM - TO'LIQ ISHGA TUSHIRISH
echo ============================================================
echo.

set MYIP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set MYIP=%%a
)
set MYIP=%MYIP: =%

echo [1/2] Server ishga tushirilmoqda...
start "WESTMINSTER CRM SERVER" cmd /c "cd /d "%~dp0" && ISHGA_TUSHIRISH.bat"

ping -n 3 127.0.0.1 >nul

echo.
echo ============================================================
echo 📌 TIZIMGA KIRISH LINKLARI:
echo ============================================================
echo [1] Ushbu kompyuterdan kirish:
echo     👉 http://localhost:8000
echo.
echo [2] Bir xil Wi-Fi dagi telefon va noutbuklardan kirish:
echo     👉 http://%MYIP%:8000
echo.
echo [3] Butun Internet (Mobil 4G/5G, boshqa shaharlar) uchun Online Link:
echo     👉 https://westminster-crm.loca.lt
echo ============================================================
echo.
echo [2/2] Internet uchun Online Havola (Tunnel) ishga tushirilmoqda...
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
    npx --yes localtunnel --port 8000 --subdomain westminster-crm
) else (
    echo [ESLATMA] Node.js / npx topilmadi. Faqat lokal http://localhost:8000 yoki Wi-Fi IP (http://%MYIP%:8000) orqali kirishingiz mumkin.
)

pause
