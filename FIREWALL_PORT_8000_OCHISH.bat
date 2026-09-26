@echo off
title WINDOWS FIREWALL PORT 8000 OCHISH
cls
echo ============================================================
echo   🛡️ WINDOWS FIREWALL PORT 8000 OCHISH (LOKAL WI-FI UCHUN)
echo ============================================================
echo.
echo Windows Firewall port 8000 blokirovkasini olib tashlamoqda...
echo.
netsh advfirewall firewall add rule name="WESTMINSTER CRM Port 8000" dir=in action=allow protocol=TCP localport=8000
echo.
echo ============================================================
echo Bajarildi! Endi bir xil Wi-Fi dagi barcha telefonlar va qurilmalar
echo http://192.168.100.66:8000 manziliga bemalol kira oladi!
echo ============================================================
pause
