# FinVault Public Server Launcher
# Run with: powershell -ExecutionPolicy Bypass -File start-public.ps1

$Host.UI.RawUI.WindowTitle = "FinVault - Public Server"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║              FinVault - Public Server Launcher            ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check cloudflared
$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "[ERROR] Cloudflared not found. Installing..." -ForegroundColor Red
    winget install Cloudflare.cloudflared
}

# Start HTTPS dev server in new window
Write-Host "[1/2] Starting HTTPS Development Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev:https"

# Wait for server
Write-Host "      Waiting for server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Start tunnel
Write-Host ""
Write-Host "[2/2] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "      Your PUBLIC URL will appear below:" -ForegroundColor Green
Write-Host "      (Look for the https://xxxxx.trycloudflare.com URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

& $cloudflared tunnel --url https://localhost:3001
