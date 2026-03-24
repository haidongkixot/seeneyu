@echo off
:: finish-roles.bat
:: Signal: "Fin" — closes all seeneyu role sessions
:: Run this from any cmd/PowerShell window when you are done for the session.

echo Fin -- closing all role sessions...
powershell -ExecutionPolicy Bypass -File "%~dp0finish-roles.ps1"
