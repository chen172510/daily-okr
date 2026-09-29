@echo off
chcp 65001 >nul
title XingXing - Rebuild PDF
set "PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" (
  echo Python runtime not found.
  echo Expected at: %PY%
  pause
  exit /b 1
)
"%PY%" "%~dp0rebuild-pdf.py"
