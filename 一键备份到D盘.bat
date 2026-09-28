@echo off
chcp 65001 >nul
setlocal

set "SRC=%~dp0"
set "DST=D:\行醒-备份-%date:~0,4%%date:~5,2%%date:~8,2%"

if not exist "D:\" (
    echo [错误] 找不到 D 盘
    pause
    exit /b 1
)

echo ========================================
echo   行醒 - 一键备份到 D 盘
echo ========================================
echo.
echo 源目录: %SRC%
echo 目标: %DST%
echo.
echo 正在备份...

xcopy "%SRC%" "%DST%\" /E /I /Y /Q /EXCLUDE:%~dp0backup-exclude.txt 2>nul

if %errorlevel% leq 1 (
    echo.
    echo [完成] 备份成功！
    echo 位置: %DST%
) else (
    echo.
    echo [提示] xcopy 用 robocopy 重试...
    robocopy "%SRC%" "%DST%" /E /NFL /NDL /NJH /NJS /NC /NS /NP /XD "node_modules" ".git"
    if %errorlevel% leq 7 (
        echo.
        echo [完成] 备份成功！
        echo 位置: %DST%
    ) else (
        echo [失败] 备份出错，错误码 %errorlevel%
    )
)

echo.
pause
