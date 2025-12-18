# Android Emulator Startup Script
# This script adds Android SDK tools to PATH and starts the emulator

Write-Host "Starting Android Emulator..." -ForegroundColor Cyan

# Set Android SDK paths
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "Android SDK paths configured" -ForegroundColor Green
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray

# Check available emulators
Write-Host "`nAvailable emulators:" -ForegroundColor Cyan
& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds

# Start the emulator
$emulatorName = "Medium_Phone_API_30"
Write-Host "`nStarting emulator: $emulatorName" -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray

# Start emulator in background
Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", $emulatorName -WindowStyle Hidden

Write-Host "`nWaiting for emulator to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Wait for device to be ready
$maxWait = 60
$waited = 0
while ($waited -lt $maxWait) {
    $devices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices 2>$null
    if ($devices -match "emulator.*device") {
        Write-Host "Emulator is ready!" -ForegroundColor Green
        break
    }
    Write-Host "Still booting... $waited seconds" -ForegroundColor Gray
    Start-Sleep -Seconds 5
    $waited += 5
}

# Show connected devices
Write-Host "`nConnected devices:" -ForegroundColor Cyan
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices

Write-Host "`nEmulator started successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. In a new terminal, navigate to customer-app folder" -ForegroundColor White
Write-Host "2. Run: npm start" -ForegroundColor White
Write-Host "3. Press 'a' to open on Android emulator" -ForegroundColor White
