@echo off
chcp 65001 >nul
title WESTMINSTER CRM - INTERNETGA ULASHISH (PUBLIC LINK)
cd /d "%~dp0"
cls

echo ============================================================
echo   🌍 WESTMINSTER CRM INTERNETGA ULASHISH (ONLINE HAVOLA)
echo ============================================================
echo.
echo Serveringizni butun dunyo bo'ylab (mobil 4G/5G, boshqa shaharlar
echo yoki xonadondagilar) kirishi uchun havola (link) yaratiladi.
echo.
echo ⚠️  DIQQAT: "ISHGA_TUSHIRISH.bat" ham orqada ochiq turishi kerak!
echo ============================================================
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [1/2] LocalTunnel orqali ulanmoqda...
    echo.
    echo 📌 Link yaratilgach:
    echo    👉 https://westminster-crm.loca.lt
    echo.
    echo 💡 Eslatma: Agar sahifada "Tunnel Password" so'rasa, 
    echo    o'sha sahifadagi "Click to continue" tugmasini bosing yoki
    echo    ushbu kompyuteringizning tashqi IP manzilini kiriting.
    echo.
    echo ============================================================
    npx --yes localtunnel --port 8000 --subdomain westminster-crm
) else (
    echo [XATOLIK] Node.js / npx topilmadi!
    echo Internet orqali kirish havolasi uchun Node.js (https://nodejs.org) o'rnatilgan bo'lishi kerak.
    echo Biroq siz hozir ham bir xil Wi-Fi tarmog'idagi barcha telefon va noutbuklardan
    echo lokal IP orqali bemalol foydalanishingiz mumkin!
)

echo.
pause
