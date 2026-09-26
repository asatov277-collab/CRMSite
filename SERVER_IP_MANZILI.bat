@echo off
title KOMPYUTER IP MANZILINI ANIQLASH - WESTMINSTER CRM
cd /d "%~dp0"
cls
echo ============================================================
echo   🔍 KOMPYUTER JORIY IP MANZILI VA ULANISH LINKLARI
echo ============================================================
echo.
set MYIP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set MYIP=%%a
)
set MYIP=%MYIP: =%

echo Kompyuteringizning tarmoqdagi joriy IP manzili: %MYIP%
echo.
echo 1. Ushbu kompyuterning o'zida kirish manzili:
echo    http://localhost:8000
echo.
echo 2. Bir xil Wi-Fi ga ulangan telefon va o'qituvchilar uchun:
echo    http://%MYIP%:8000
echo.
echo ------------------------------------------------------------
echo 🌍 BOSHQA JOYDAGI VA MOBIL INTERNETDAGILAR UCHUN LINK:
echo    Papkadagi "INTERNETGA_ULASHISH.bat" faylini bosing!
echo ============================================================
echo.
pause
