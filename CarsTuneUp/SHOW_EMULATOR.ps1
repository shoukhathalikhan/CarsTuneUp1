# Show Android Emulator Window
# This script brings the emulator window to the front

Write-Host "Looking for Android Emulator window..." -ForegroundColor Cyan

# Find emulator process
$emulatorProc = Get-Process | Where-Object {$_.ProcessName -like "*qemu*"}

if ($emulatorProc) {
    Write-Host "Found emulator process (PID: $($emulatorProc.Id))" -ForegroundColor Green
    
    # Add Windows API functions
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WindowHelper {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
}
"@
    
    # Show and focus the window (9 = SW_RESTORE)
    [WindowHelper]::ShowWindow($emulatorProc.MainWindowHandle, 9)
    [WindowHelper]::SetForegroundWindow($emulatorProc.MainWindowHandle)
    
    Write-Host "Emulator window should now be visible!" -ForegroundColor Green
    Write-Host "`nIf you still can't see it:" -ForegroundColor Yellow
    Write-Host "1. Check your taskbar for 'Android Emulator' or 'QEMU'" -ForegroundColor White
    Write-Host "2. Press Alt+Tab to cycle through windows" -ForegroundColor White
    Write-Host "3. Check if it's on another monitor (if you have multiple)" -ForegroundColor White
} else {
    Write-Host "No emulator process found. Starting emulator..." -ForegroundColor Yellow
    & "$PSScriptRoot\start-emulator.ps1"
}
