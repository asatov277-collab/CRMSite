@echo off
chcp 65001 >nul
title WESTMINSTER CRM - AVTO-YONISHGA QO'SHISH
cls
echo ============================================================
echo   🚀 WESTMINSTER CRM - WINDOWS BILAN BIRGA YONISH
echo ============================================================
echo.
echo Kompyuter yoqilganda CRM avtomatik tarzda orqa fonda
echo ishga tushadigan qilib sozlanmoqda...
echo.

powershell -NoProfile -Command ^
    "$startupPath = [Environment]::GetFolderPath('Startup'); " ^
    "$vbsPath = Join-Path '%~dp0' 'FONDA_ISHGA_TUSHIRISH.vbs'; " ^
    "$shortcutPath = Join-Path $startupPath 'WESTMINSTER_CRM_AUTOSTART.lnk'; " ^
    "$icoPath = Join-Path '%~dp0' 'app_icon.ico'; " ^
    "$WScript = New-Object -ComObject WScript.Shell; " ^
    "$shortcut = $WScript.CreateShortcut($shortcutPath); " ^
    "$shortcut.TargetPath = 'wscript.exe'; " ^
    "$shortcut.Arguments = \"\"\"$vbsPath\"\"\"; " ^
    "$shortcut.WorkingDirectory = '%~dp0'; " ^
    "if (Test-Path $icoPath) { $shortcut.IconLocation = $icoPath; } " ^
    "$shortcut.Save(); " ^
    "Write-Host '[V] MUVAFFAQIYATLI SOZLANDI! Kompyuter har safar yoqilganda Westminster CRM avtomatik ishga tushadi.' -ForegroundColor Green;"

echo.
echo ============================================================
echo   Agar keyinchalik buni bekor qilmoqchi bo'lsangiz:
echo   Papkadagi 'WINDOWS_BILAN_YONISHDAN_OCHIRISH.bat' ni bosing.
echo ============================================================
echo.
pause
