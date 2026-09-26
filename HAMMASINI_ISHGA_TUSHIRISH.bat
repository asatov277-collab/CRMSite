@echo off
title WESTMINSTER CRM - HAMMASINI ISHGA TUSHIRISH
cd /d "%~dp0"
cls
echo ============================================================
echo   🏛️ WESTMINSTER CRM - FULL SERVER ISHGA TUSHIRILMOQDA
echo ============================================================
echo.

set MYIP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set MYIP=%%a
)
set MYIP=%MYIP: =%

echo 1. Python Server ishga tushirilmoqda...
where python >nul 2>nul
if %errorlevel% equ 0 (
    start "WESTMINSTER CRM SERVER" cmd /k "cd /d "%~dp0" && python run_server.py"
) else (
    start "WESTMINSTER CRM SERVER" cmd /k "cd /d "%~dp0" && py run_server.py"
)

timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo 📌 QURILMALARDAN KIRISH LINKLARI:
echo ============================================================
echo [1] Ushbu kompyuterning o'zidan kirish:
echo     👉 http://localhost:8000
echo.
echo [2] Bir xil Wi-Fi dagi telefon va noutbuklardan kirish (IP):
echo     👉 http://%MYIP%:8000
echo.
echo [3] Butun Internet (Mobil 4G/5G, boshqa shaharlar) uchun Online Link:
echo     👉 https://westminster-crm.loca.lt
echo ============================================================
echo.
echo 2. Internet uchun Online Link yaratilmoqda...
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
    npx --yes localtunnel --port 8000 --subdomain westminster-crm
) else (
    echo [ESLATMA] Node.js / npx topilmadi. Faqat lokal http://localhost:8000 yoki Wi-Fi IP orqali kirishingiz mumkin.
)

pause
