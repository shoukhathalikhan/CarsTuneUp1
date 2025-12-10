# Android Emulator Setup Guide

## Quick Start

### Option 1: Use the Helper Script (Easiest)
```powershell
# From the project root
.\START_ANDROID_EMULATOR.ps1
```

This script will:
- Configure Android SDK paths
- Start the emulator
- Wait for it to be ready
- Show you the next steps

### Option 2: Manual Setup

#### Step 1: Add Android SDK to PATH (Current Session)
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"
```

#### Step 2: Verify ADB is Working
```powershell
adb devices
```

#### Step 3: Start the Emulator
```powershell
emulator -avd Medium_Phone_API_30
```

Or start in background:
```powershell
Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", "Medium_Phone_API_30" -WindowStyle Hidden
```

#### Step 4: Wait for Emulator to Boot
The emulator takes 1-2 minutes to fully boot. Check status:
```powershell
adb devices
```

You should see:
```
List of devices attached
emulator-5554   device
```

## Running Your Expo App on Emulator

### Method 1: From Expo CLI
```powershell
cd customer-app
npm start
# Press 'a' to open on Android
```

### Method 2: Direct Install
```powershell
cd customer-app
npx expo run:android
```

## Permanent PATH Setup (Optional)

To avoid setting PATH every time, add it permanently:

### Using PowerShell (Requires Admin)
```powershell
[Environment]::SetEnvironmentVariable(
    "ANDROID_HOME",
    "$env:LOCALAPPDATA\Android\Sdk",
    "User"
)

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$androidPaths = "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator;$env:LOCALAPPDATA\Android\Sdk\tools;$env:LOCALAPPDATA\Android\Sdk\tools\bin"
[Environment]::SetEnvironmentVariable(
    "Path",
    "$androidPaths;$currentPath",
    "User"
)
```

After running this, **restart your terminal** for changes to take effect.

### Manual Method
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\RAQEEB\AppData\Local\Android\Sdk`
5. Select "Path" variable and click "Edit"
6. Click "New" and add these paths:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
7. Click "OK" on all dialogs
8. **Restart your terminal**

## Available Emulators

Check what emulators you have:
```powershell
emulator -list-avds
```

Your current emulator:
- **Name**: Medium_Phone_API_30
- **API Level**: 30 (Android 11)

## Creating a New Emulator (Optional)

If you want to create additional emulators:

1. Open Android Studio
2. Go to: Tools → Device Manager
3. Click "Create Device"
4. Select a device (e.g., Pixel 5)
5. Select a system image (e.g., API 30, Android 11)
6. Click "Finish"

## Troubleshooting

### "adb is not recognized"
- Run the helper script: `.\START_ANDROID_EMULATOR.ps1`
- Or manually add to PATH (see above)

### Emulator won't start
- Check if HAXM/WHPX is enabled in BIOS (virtualization)
- Open Android Studio → Tools → AVD Manager
- Try starting from there

### "No devices found"
- Wait 1-2 minutes for emulator to fully boot
- Check: `adb devices`
- If shows "offline", run: `adb kill-server` then `adb start-server`

### Expo can't connect to emulator
- Ensure emulator is running: `adb devices` should show "device"
- Try: `adb reverse tcp:8081 tcp:8081` (for Metro bundler)
- Restart Expo: `npm start -- --clear`

### Emulator is slow
- Allocate more RAM in AVD settings (Android Studio)
- Enable hardware acceleration
- Close other applications

## Using Physical Android Device Instead

If you prefer using your physical phone:

1. Enable Developer Options:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times

2. Enable USB Debugging:
   - Settings → Developer Options
   - Enable "USB Debugging"

3. Connect via USB:
   ```powershell
   adb devices
   ```
   - Accept the prompt on your phone

4. Or connect via WiFi:
   ```powershell
   # First connect via USB, then:
   adb tcpip 5555
   adb connect <phone-ip>:5555
   # Now you can unplug USB
   ```

## Quick Reference Commands

```powershell
# List devices
adb devices

# List emulators
emulator -list-avds

# Start emulator
emulator -avd Medium_Phone_API_30

# Kill adb server (if issues)
adb kill-server
adb start-server

# Install APK
adb install app.apk

# View logs
adb logcat

# Reverse port (for Metro)
adb reverse tcp:8081 tcp:8081
```

## Next Steps

1. ✅ Start emulator: `.\START_ANDROID_EMULATOR.ps1`
2. ✅ Navigate to app: `cd customer-app`
3. ✅ Start Expo: `npm start`
4. ✅ Press 'a' to open on Android

Your app should now load in the emulator! 🎉
