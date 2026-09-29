@echo off
chcp 65001 >nul
title XingXing - Phone URL
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=powershell.exe"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0phone-url.ps1"
echo.
echo (press any key to close)
pause >nul
