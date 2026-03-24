# seeneyu — Start All Role Sessions
# Opens Windows Terminal with one tab per role, each running Claude Code.
# Usage: Right-click → Run with PowerShell  OR  from any terminal: .\scripts\start-session.ps1

$base  = "D:\Claude Projects\seeneyu\roles"
$roles = @("pm", "designer", "backend-engineer", "builder", "data-engineer", "tester", "reporter", "marketer")

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  seeneyu — Starting All Role Sessions" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Windows Terminal is available
$hasWT = Get-Command "wt" -ErrorAction SilentlyContinue

if ($hasWT) {
    Write-Host "Opening Windows Terminal with $($roles.Count) tabs..." -ForegroundColor Green
    Write-Host ""

    # Build wt argument list: first tab, then "; new-tab" for each subsequent
    $wtArgs = ""
    for ($i = 0; $i -lt $roles.Count; $i++) {
        $role = $roles[$i]
        $path = "$base\$role"
        if (-not (Test-Path $path)) {
            Write-Host "  [SKIP] $role — directory not found: $path" -ForegroundColor Yellow
            continue
        }
        if ($i -eq 0) {
            $wtArgs += "new-tab --title `"$role`" -d `"$path`" -- cmd /k `"claude`""
        } else {
            $wtArgs += " `; new-tab --title `"$role`" -d `"$path`" -- cmd /k `"claude`""
        }
        Write-Host "  + $role" -ForegroundColor White
    }

    Start-Process "wt" -ArgumentList $wtArgs
    Write-Host ""
    Write-Host "All role tabs launched." -ForegroundColor Green

} else {
    Write-Host "Windows Terminal not found — opening separate CMD windows..." -ForegroundColor Yellow
    Write-Host ""

    foreach ($role in $roles) {
        $path = "$base\$role"
        if (-not (Test-Path $path)) {
            Write-Host "  [SKIP] $role — directory not found" -ForegroundColor Yellow
            continue
        }
        Start-Process "cmd" -ArgumentList "/k `"title $role && cd /d \`"$path\`" && claude`""
        Write-Host "  + $role" -ForegroundColor White
        Start-Sleep -Milliseconds 300  # stagger launches slightly
    }

    Write-Host ""
    Write-Host "All role windows launched." -ForegroundColor Green
}

Write-Host ""
Write-Host "REMINDER: Each role reads its signal queue first." -ForegroundColor DarkCyan
Write-Host "PM checkpoint command: npm run session:checkpoint" -ForegroundColor DarkCyan
Write-Host ""
