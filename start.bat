@echo off
cd /d "%~dp0"
echo Starting HTTP Server...
echo.
echo Please visit: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
npx http-server -p 8080 --cors
