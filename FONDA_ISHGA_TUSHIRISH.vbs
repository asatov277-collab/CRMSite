Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = currentDir

' Try pythonw.exe first (native windowless python)
On Error Resume Next
WshShell.Run "pythonw.exe """ & currentDir & "\run_server.py""", 0, False
If Err.Number <> 0 Then
    ' Fallback to python.exe with hidden window
    Err.Clear
    WshShell.Run "python.exe """ & currentDir & "\run_server.py""", 0, False
End If
On Error GoTo 0

WScript.Sleep 2000
WshShell.Run "http://localhost:8000"
