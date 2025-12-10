# Run Customer App on Android Emulator
# This script ensures Android SDK is in PATH, starts emulator if needed, and runs the app

Write-Host "Starting Customer App on Android Emulator..." -ForegroundColor Cyan

# Set Android SDK paths
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "Android SDK paths configured" -ForegroundColor Green

# Check if emulator is already running
Write-Host "`nChecking for running emulators..." -ForegroundColor Cyan
$devices = & adb devices
$emulatorRunning = $devices -match "emulator.*device"

if (-not $emulatorRunning) {
    Write-Host "No emulator running. Starting emulator..." -ForegroundColor Yellow
    
    # Start emulator in background
    $emulatorName = "Medium_Phone_API_30"
    Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", $emulatorName -WindowStyle Hidden
    
    Write-Host "Waiting for emulator to boot..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Wait for device to be ready
    $maxWait = 60
    $waited = 0
    while ($waited -lt $maxWait) {
        $devices = & adb devices 2>$null
        if ($devices -match "emulator.*device") {
            Write-Host "Emulator is ready!" -ForegroundColor Green
            break
        }
        Write-Host "Still booting... $waited seconds" -ForegroundColor Gray
        Start-Sleep -Seconds 5
        $waited += 5
    }
} else {
    Write-Host "Emulator already running!" -ForegroundColor Green
}

# Show connected devices
Write-Host "`nConnected devices:" -ForegroundColor Cyan
& adb devices

# Set API URL for the app
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.125:5000/api"
Write-Host "`nAPI URL: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray

# Navigate to customer-app and start Expo
Write-Host "`nStarting Expo Metro bundler..." -ForegroundColor Cyan
Set-Location -Path "customer-app"

Write-Host "`nPress Ctrl+C to stop the app" -ForegroundColor Yellow
Write-Host "Once Metro is ready, the app will automatically open on the emulator`n" -ForegroundColor Yellow

# Start Expo with Android flag
npm start -- --android
