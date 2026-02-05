@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title FinVault - Personal Finance Manager
color 0B

:MENU
cls
echo.
echo  ================================================================
echo                 FinVault - Personal Finance Manager
echo              Your Privacy-First Finance Tracker
echo  ================================================================
echo.
echo  [1] Start Development Server (npm run dev)
echo  [2] Install Dependencies (npm install)
echo  [3] Build for Production (npm run build)
echo  [4] Run Tests (npm test)
echo  [5] Clean Build (remove dist + .next)
echo  [6] Check Build Status
echo  [7] Type Check (npm run typecheck)
echo  [8] Run Linter (npm run lint)
echo  [9] Format Code (npm run format)
echo  [A] Open in Browser (localhost:3000)
echo  [0] Exit
echo.
echo  ================================================================
echo.
set /p choice="Enter your choice: "

if "%choice%"=="1" goto DEV
if "%choice%"=="2" goto INSTALL
if "%choice%"=="3" goto BUILD
if "%choice%"=="4" goto TEST
if "%choice%"=="5" goto CLEAN
if "%choice%"=="6" goto STATUS
if "%choice%"=="7" goto TYPECHECK
if "%choice%"=="8" goto LINT
if "%choice%"=="9" goto FORMAT
if /i "%choice%"=="A" goto OPEN_BROWSER
if "%choice%"=="0" goto EXIT

echo.
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

:DEV
cls
echo.
echo  Starting development server...
echo  Press Ctrl+C to stop the server
echo  Server will be available at: http://localhost:3000
echo.
echo  ================================================================
echo.
call npm run dev
echo.
pause
goto MENU

:INSTALL
cls
echo.
echo  Installing dependencies...
echo  This may take a few minutes...
echo.
call npm install
if !ERRORLEVEL! == 0 (
    echo.
    echo  [OK] Dependencies installed successfully!
) else (
    echo.
    echo  [ERROR] Installation failed! Check errors above.
)
echo.
pause
goto MENU

:BUILD
cls
echo.
echo  Building for production...
echo  This may take a few minutes...
echo.
call npm run build
if !ERRORLEVEL! == 0 (
    echo.
    echo  [OK] Build successful! Check the 'dist' folder.
) else (
    echo.
    echo  [ERROR] Build failed! Check errors above.
)
echo.
pause
goto MENU

:TEST
cls
echo.
echo  Running tests...
echo.
call npm test -- --passWithNoTests
echo.
pause
goto MENU

:CLEAN
cls
echo.
echo  Cleaning build directories...
echo.
if exist dist (
    echo  Removing 'dist' folder...
    rmdir /s /q dist
    echo  [OK] dist removed
) else (
    echo  [SKIP] dist folder not found
)
if exist .next (
    echo  Removing '.next' folder...
    rmdir /s /q .next
    echo  [OK] .next removed
) else (
    echo  [SKIP] .next folder not found
)
echo.
set /p confirm="Remove node_modules? This will require reinstall. (y/n): "
if /i "%confirm%"=="y" (
    if exist node_modules (
        echo  Removing 'node_modules' folder...
        rmdir /s /q node_modules
        echo  [OK] node_modules removed
    )
)
echo.
echo  Clean complete!
echo.
pause
goto MENU

:STATUS
cls
echo.
echo  ================================================================
echo                      Project Status
echo  ================================================================
echo.
echo  Node.js version:
call node --version 2>nul || echo  [ERROR] Node.js not found!
echo.
echo  NPM version:
call npm --version 2>nul || echo  [ERROR] NPM not found!
echo.
echo  ================================================================
echo                    Directory Status
echo  ================================================================
echo.
if exist src (echo  [OK] src directory) else (echo  [MISSING] src directory)
if exist package.json (echo  [OK] package.json) else (echo  [MISSING] package.json)
if exist node_modules (echo  [OK] node_modules) else (echo  [MISSING] node_modules - run Install)
if exist dist (echo  [OK] dist - production build exists) else (echo  [INFO] dist - no production build)
if exist .next (echo  [OK] .next - dev cache exists) else (echo  [INFO] .next - no dev cache)
echo.
echo  ================================================================
echo.
pause
goto MENU

:TYPECHECK
cls
echo.
echo  Running TypeScript type check...
echo.
call npm run typecheck
if !ERRORLEVEL! == 0 (
    echo.
    echo  [OK] No TypeScript errors found!
) else (
    echo.
    echo  [WARN] TypeScript errors detected. Check output above.
)
echo.
pause
goto MENU

:LINT
cls
echo.
echo  Running linter...
echo.
call npm run lint
if !ERRORLEVEL! == 0 (
    echo.
    echo  [OK] Linting passed!
) else (
    echo.
    echo  [WARN] Linting issues found. Check output above.
)
echo.
pause
goto MENU

:FORMAT
cls
echo.
echo  Formatting code with Prettier...
echo.
call npm run format
if !ERRORLEVEL! == 0 (
    echo.
    echo  [OK] Code formatted successfully!
) else (
    echo.
    echo  [ERROR] Formatting failed!
)
echo.
pause
goto MENU

:OPEN_BROWSER
echo.
echo  Opening http://localhost:3000 in browser...
echo  Make sure the dev server is running first! (Option 1)
echo.
start "" "http://localhost:3000"
timeout /t 2 >nul
goto MENU

:EXIT
cls
echo.
echo  ================================================================
echo           Thank you for using FinVault!
echo           Your privacy-first finance manager.
echo  ================================================================
echo.
timeout /t 2 >nul
exit /b 0
