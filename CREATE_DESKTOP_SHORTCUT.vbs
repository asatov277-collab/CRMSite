Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")

' Shortcut 1: ISHGA TUSHIRISH
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM - ISHGA TUSHIRISH.lnk")
oShellLink.TargetPath = "C:\Users\Dell\.gemini\antigravity-ide\scratch\lc-crm\HAMMASINI_ISHGA_TUSHIRISH.bat"
oShellLink.WorkingDirectory = "C:\Users\Dell\.gemini\antigravity-ide\scratch\lc-crm"
oShellLink.WindowStyle = 1
oShellLink.Description = "WESTMINSTER CRM Educational Center Server"
oShellLink.Save

' Shortcut 2: KIRISH MALUMOTLARI
Set oShellLink2 = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM - KIRISH MALUMOTLARI.lnk")
oShellLink2.TargetPath = "C:\Users\Dell\.gemini\antigravity-ide\scratch\lc-crm\KIRISH_MALUMOTLARI_VA_PAROL.txt"
oShellLink2.WorkingDirectory = "C:\Users\Dell\.gemini\antigravity-ide\scratch\lc-crm"
oShellLink2.WindowStyle = 1
oShellLink2.Description = "WESTMINSTER CRM Kirish Ma'lumotlari va Parollar"
oShellLink2.Save

WScript.Echo "Shortcuts created successfully on Desktop!"
