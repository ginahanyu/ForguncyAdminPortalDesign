@echo off
echo ====================================
echo 活字格功能设计原型启动脚本
echo ====================================
echo.

REM 检查Python是否安装
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用Python启动本地服务器...
    echo.
    echo 服务器将在 http://localhost:3002 运行
    echo 按 Ctrl+C 可以停止服务器
    echo.
    python -m http.server 3002
) else (
    echo Python未安装或未添加到PATH
    echo.
    echo 请执行以下步骤之一：
    echo 1. 安装Python并重新运行此脚本
    echo 2. 使用浏览器直接打开 index.html 文件
    echo 3. 安装Node.js并运行: npm install -g live-server, 然后运行: live-server
    echo.
    pause
)
