# Run Customer App on Android - Improved Version
# Waits for emulator to be fully ready before launching app

Write-Host "CarsTuneUp - Android App Launcher" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Set Android SDK paths
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

# Set API URL
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.7:5000/api"

Write-Host "`nStep 1: Checking emulator status..." -ForegroundColor Yellow

# Check if emulator is running
$devices = & adb devices 2>$null
$emulatorRunning = $devices -match "emulator-\d+"

if (-not $emulatorRunning) {
    Write-Host "No emulator detected. Please ensure emulator is running." -ForegroundColor Red
    Write-Host "Run: .\start-emulator.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Emulator detected!" -ForegroundColor Green

# Wait for emulator to be fully booted
Write-Host "`nStep 2: Waiting for emulator to fully boot..." -ForegroundColor Yellow
Write-Host "(This may take 30-60 seconds)" -ForegroundColor Gray

$maxWait = 120
$waited = 0
$bootComplete = $false

while ($waited -lt $maxWait) {
    $bootStatus = & adb shell getprop sys.boot_completed 2>$null
    $deviceState = & adb get-state 2>$null
    
    if ($bootStatus -eq "1" -and $deviceState -eq "device") {
        $bootComplete = $true
        Write-Host "Emulator is fully booted and ready!" -ForegroundColor Green
        break
    }
    
    Write-Host "  Waiting... $waited seconds (boot: $bootStatus, state: $deviceState)" -ForegroundColor Gray
    Start-Sleep -Seconds 5
    $waited += 5
}

if (-not $bootComplete) {
    Write-Host "`nEmulator is taking too long to boot. Please check the emulator window." -ForegroundColor Red
    Write-Host "You can try running the app manually once it's ready." -ForegroundColor Yellow
    exit 1
}

# Additional wait for system to stabilize
Write-Host "`nWaiting for system to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nStep 3: Starting Metro Bundler and installing app..." -ForegroundColor Yellow
Write-Host "API URL: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray

# Navigate to customer-app
Set-Location -Path "customer-app"

Write-Host "`nLaunching app on emulator..." -ForegroundColor Cyan
Write-Host "(This will take a few minutes on first run)`n" -ForegroundColor Gray

# Start Expo with Android
npx expo start --android

Write-Host "`nIf the app didn't open automatically:" -ForegroundColor Yellow
Write-Host "1. Keep Metro running (don't close this window)" -ForegroundColor White
Write-Host "2. In the emulator, open Expo Go app" -ForegroundColor White
Write-Host "3. Scan the QR code or enter the URL shown above" -ForegroundColor White
