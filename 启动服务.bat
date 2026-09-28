@echo off
chcp 65001 >nul
cd /d "%~dp0server"

echo ========================================
echo   行醒 - 启动后端服务
echo ========================================
echo.

if not exist "node_modules" goto INSTALL
goto START

:INSTALL
echo 正在安装依赖，第一次会比较慢，请稍等...
call npm install --no-audit --no-fund
if errorlevel 1 goto FAIL

:START
echo 启动中...
echo 访问地址: http://localhost:3000
echo 演示账号: demo / demo123
echo.
echo 【这个黑窗口不要关】关掉服务就停了。
echo ========================================
echo.
node server.js
goto END

:FAIL
echo.
echo [错误] 依赖安装失败，请检查网络后重试。

:END
echo.
pause