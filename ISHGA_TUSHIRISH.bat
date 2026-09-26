@echo off
chcp 65001 >nul
title WESTMINSTER CRM - PRODUCTION SERVER
cd /d "%~dp0"
cls

echo ============================================================
echo   🏛️ WESTMINSTER CRM EDUCATIONAL CENTER - PRODUCTION SERVER
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [XATOLIK] Python kompyuteringizda topilmadi!
        echo Iltimos, Python (https://www.python.org) ni o'rnating.
        echo O'rnatayotganda "Add Python to PATH" katagiga belgi qo'ying!
        echo.
        pause
        exit /b
    )
)

echo Bog'liqliklar tekshirilmoqda...
python -c "import fastapi, uvicorn, pydantic" >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [*] Kerakli Python kutubxonalari o'rnatilmoqda (fastapi, uvicorn, pydantic)...
    pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo.
        echo [XATOLIK] Kutubxonalarni o'rnatishda xatolik yuz berdi. Internet aloqasini tekshiring.
        pause
        exit /b
    )
)

echo.
python run_server.py

pause
