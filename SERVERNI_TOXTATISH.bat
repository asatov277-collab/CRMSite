@echo off
chcp 65001 >nul
title WESTMINSTER CRM - SERVERNI TO'XTATISH
cls
echo ============================================================
echo   🛑 WESTMINSTER CRM SERVERNI TO'XTATISH
echo ============================================================
echo.
echo Server tekshirilmoqda va to'xtatilmoqda...

powershell -NoProfile -Command ^
    "$found = $false; " ^
    "try { " ^
    "    $conns = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue; " ^
    "    if ($conns) { " ^
    "        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; " ^
    "        foreach ($p in $pids) { " ^
    "            if ($p -gt 0) { " ^
    "                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; " ^
    "                Write-Host \"[V] Port 8000 dagi jarayon (PID: $p) muvaffaqiyatli to'xtatildi.\"; " ^
    "                $found = $true; " ^
    "            } " ^
    "        } " ^
    "    } " ^
    "} catch {} " ^
    "if (-not $found) { " ^
    "    Write-Host \"[i] Port 8000 da ishlayotgan server topilmadi (server allaqachon to'xtatilgan).\"; " ^
    "}"

echo.
echo ============================================================
echo   Tizim to'xtatildi. Istalgan vaqtda qayta yoqishingiz mumkin.
echo ============================================================
echo.
ping -n 3 127.0.0.1 >nul
