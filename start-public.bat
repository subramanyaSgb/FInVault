@echo off
title FinVault - Public Server
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║              FinVault - Public Server Launcher            ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

:: Check if cloudflared is available
if not exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    echo [ERROR] Cloudflared is not installed
    echo Run: winget install Cloudflare.cloudflared
    pause
    exit /b 1
)

echo [1/2] Starting HTTPS Development Server...
echo.

:: Start Next.js dev server with HTTPS in a new window
start "FinVault HTTPS Server" cmd /k "cd /d %~dp0 && npm run dev:https"

:: Wait for the server to start
echo Waiting for server to start...
timeout /t 10 /nobreak >nul

echo.
echo [2/2] Starting Cloudflare Tunnel...
echo.

:: Start Cloudflare tunnel
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url https://localhost:3001

pause
