@echo off
chcp 65001 >nul
title XingXing - Update Online
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=powershell.exe"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-online.ps1"
echo.
echo ----------------------------------------
echo (press any key to close this window)
pause >nul
