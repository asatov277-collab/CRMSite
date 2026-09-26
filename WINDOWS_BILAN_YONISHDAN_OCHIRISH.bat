@echo off
chcp 65001 >nul
title WESTMINSTER CRM - AVTO-YONISHDAN O'CHIRISH
cls
echo ============================================================
echo   🛑 WESTMINSTER CRM - WINDOWS BILAN YONISHDAN O'CHIRISH
echo ============================================================
echo.

powershell -NoProfile -Command ^
    "$startupPath = [Environment]::GetFolderPath('Startup'); " ^
    "$shortcutPath = Join-Path $startupPath 'WESTMINSTER_CRM_AUTOSTART.lnk'; " ^
    "if (Test-Path $shortcutPath) { " ^
    "    Remove-Item -Path $shortcutPath -Force; " ^
    "    Write-Host '[V] Avto-yonish muvaffaqiyatli o''chirildi.' -ForegroundColor Yellow; " ^
    "} else { " ^
    "    Write-Host '[i] Avto-yonish ro''yxatida yorliq topilmadi.' -ForegroundColor Gray; " ^
    "}"

echo.
pause
