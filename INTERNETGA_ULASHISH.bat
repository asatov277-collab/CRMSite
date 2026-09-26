@echo off
title WESTMINSTER CRM - INTERNETGA ULASHISH (PUBLIC LINK)
cd /d "%~dp0"
cls
echo ============================================================
echo   🌍 WESTMINSTER CRM INTERNETGA ULASHISH (PUBLIC LINK)
echo ============================================================
echo.
echo Serveringizni butun dunyo bo'yicha (mobil internet, 4G, 5G
echo yoki boshqa shahardagilar) kirishi uchun Link yaratilmoqda...
echo.
echo Diqqat: "ISHGA_TUSHIRISH.bat" ham orqada ochiq turishi kerak!
echo ============================================================
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
    npx --yes localtunnel --port 8000 --subdomain westminster-crm
) else (
    echo [XATOLIK] Node.js / npx topilmadi! Internet link yaratish uchun Node.js o'rnatilgan bo'lishi kerak.
)
pause
