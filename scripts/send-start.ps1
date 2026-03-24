Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WinAPI {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    public delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
    public static List<IntPtr> FindWindowsByClass(string cls) {
        var list = new List<IntPtr>();
        EnumWindows((h, l) => {
            var sb = new StringBuilder(256);
            GetClassName(h, sb, 256);
            if (sb.ToString() == cls && IsWindowVisible(h)) list.Add(h);
            return true;
        }, IntPtr.Zero);
        return list;
    }
}
"@

$shell   = New-Object -ComObject WScript.Shell
$myHwnd  = [WinAPI]::GetForegroundWindow()

# Find all Windows Terminal windows
$wtWindows = [WinAPI]::FindWindowsByClass("CASCADIA_HOSTING_WINDOW_CLASS")
Write-Host "Found $($wtWindows.Count) Windows Terminal window(s)"

# Pick the one that is NOT the current PM window
$roleWindow = $wtWindows | Where-Object { $_ -ne $myHwnd } | Select-Object -First 1

if (-not $roleWindow) {
    # If only one WT window, use it (roles might be tabs in same window)
    $roleWindow = $wtWindows | Select-Object -First 1
}

$buf = New-Object System.Text.StringBuilder 256
[WinAPI]::GetWindowText($roleWindow, $buf, 256) | Out-Null
Write-Host "Role window title: '$($buf.ToString())' (handle: $roleWindow)"

# Focus role window and send to each of 7 tabs
for ($i = 0; $i -le 6; $i++) {
    Start-Process wt -ArgumentList "-w last focus-tab --target $i" -Wait
    Start-Sleep -Milliseconds 800
    [WinAPI]::SetForegroundWindow($roleWindow) | Out-Null
    Start-Sleep -Milliseconds 500
    $shell.SendKeys("start your session{ENTER}")
    Write-Host "Sent to tab $i"
    Start-Sleep -Milliseconds 600
}

Write-Host "Done."
