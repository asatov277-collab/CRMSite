@echo off
title WESTMINSTER CRM SERVER ISHGA TUSHIRISH
cd /d "%~dp0"
cls
echo ============================================================
echo   🏛️ WESTMINSTER CRM EDUCATIONAL CENTER SERVER
echo ============================================================
echo.
echo Server ishga tushmoqda...
echo.

set MYIP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set MYIP=%%a
)
set MYIP=%MYIP: =%

echo [1] Ushbu kompyuteringizda kirish: http://localhost:8000
echo [2] Bir xil Wi-Fi ga ulangan telefonlardan kirish: http://%MYIP%:8000
echo [3] Butun Internetdagilar (boshqa shahardagilar) kirishi uchun:
echo     Papkadagi "INTERNETGA_ULASHISH.bat" faylini ham bosing!
echo.
echo Serverni to'xtatish uchun ushbu oynada Ctrl + C bosing.
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    python run_server.py
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        py run_server.py
    ) else (
        echo [XATOLIK] Python kompyuteringizda o'rnatilmagan yoki PATH ga qo'shilmagan!
        echo Iltimos, Python (https://www.python.org) ni o'rnating va "Add Python to PATH" katagiga belgi qo'ying.
    )
)

pause
