# CarsTuneUp - Start All Apps Script
# Run this script to start backend and customer app together

Write-Host "🚀 Starting CarsTuneUp Applications..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in a new window
Write-Host "📦 Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Customer App in a new window
Write-Host "📱 Starting Customer App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\customer-app'; npm start"

Write-Host ""
Write-Host "✅ Applications starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://192.168.1.7:5000" -ForegroundColor Cyan
Write-Host "Customer App: Scan QR code with Expo Go" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
