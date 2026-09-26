@echo off
chcp 65001 >nul
title WINDOWS FIREWALL PORT 8000 OCHISH
cls
echo ============================================================
echo   🛡️ WINDOWS FIREWALL PORT 8000 OCHISH (WI-FI UCHUN)
echo ============================================================
echo.
echo Administrator huquqi bilan Windows Firewall port 8000 ochilmoqda...
echo.

netsh advfirewall firewall delete rule name="WESTMINSTER CRM Port 8000" >nul 2>nul
netsh advfirewall firewall add rule name="WESTMINSTER CRM Port 8000" dir=in action=allow protocol=TCP localport=8000

echo.
echo ============================================================
echo [V] Bajarildi! Endi Wi-Fi tarmog'idagi barcha telefon va noutbuklar
echo     sizning kompyuteringizdagi CRM tizimiga bemalol ulanishi mumkin!
echo ============================================================
pause
