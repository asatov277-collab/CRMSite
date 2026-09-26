Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
icoPath = currentDir & "\app_icon.ico"

' Shortcut 1: ISHGA TUSHIRISH
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM - ISHGA TUSHIRISH.lnk")
oShellLink.TargetPath = currentDir & "\ISHGA_TUSHIRISH.bat"
oShellLink.WorkingDirectory = currentDir
oShellLink.WindowStyle = 1
oShellLink.Description = "WESTMINSTER CRM Educational Center Server"
If fso.FileExists(icoPath) Then
    oShellLink.IconLocation = icoPath
End If
oShellLink.Save

' Shortcut 2: FONDA ISHLATISH (Qora oynasiz)
Set oShellLinkSilent = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM (Fonda Ishga Tushirish).lnk")
oShellLinkSilent.TargetPath = "wscript.exe"
oShellLinkSilent.Arguments = """" & currentDir & "\FONDA_ISHGA_TUSHIRISH.vbs"""
oShellLinkSilent.WorkingDirectory = currentDir
oShellLinkSilent.WindowStyle = 1
oShellLinkSilent.Description = "WESTMINSTER CRM Silent Background Launcher"
If fso.FileExists(icoPath) Then
    oShellLinkSilent.IconLocation = icoPath
End If
oShellLinkSilent.Save

' Shortcut 3: KIRISH MALUMOTLARI
Set oShellLink2 = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM - KIRISH MALUMOTLARI.lnk")
oShellLink2.TargetPath = currentDir & "\KIRISH_MALUMOTLARI_VA_PAROL.txt"
oShellLink2.WorkingDirectory = currentDir
oShellLink2.WindowStyle = 1
oShellLink2.Description = "WESTMINSTER CRM Kirish Ma'lumotlari va Parollar"
oShellLink2.Save

' Shortcut 4: TO'XTATISH
Set oShellLinkStop = WshShell.CreateShortcut(strDesktop & "\WESTMINSTER CRM - TO'XTATISH.lnk")
oShellLinkStop.TargetPath = currentDir & "\SERVERNI_TOXTATISH.bat"
oShellLinkStop.WorkingDirectory = currentDir
oShellLinkStop.WindowStyle = 1
oShellLinkStop.Description = "WESTMINSTER CRM Serverni To'xtatish"
oShellLinkStop.Save

WScript.Echo "WESTMINSTER CRM yorliqlari (Shortcuts) Desktop (Ish stoli)ga muvaffaqiyatli yaratildi!"
