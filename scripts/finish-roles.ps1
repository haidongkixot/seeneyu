# finish-roles.ps1
# Signal: "Fin" — closes all seeneyu role sessions
# Run this from any PowerShell window when you are done for the session.

$roles = @(
  "designer",
  "tester",
  "reporter",
  "data-engineer",
  "builder",
  "backend-engineer",
  "marketer"
)

$base = "D:\Claude Projects\seeneyu\roles"

Write-Host "Fin — closing all role sessions..." -ForegroundColor Yellow

foreach ($role in $roles) {
  $dir = "$base\$role"

  # Find cmd.exe processes whose command line references this role directory
  $procs = Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" |
    Where-Object { $_.CommandLine -like "*$dir*" }

  if ($procs) {
    foreach ($proc in $procs) {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      Write-Host "  Closed: $role (PID $($proc.ProcessId))" -ForegroundColor Gray
    }
  } else {
    Write-Host "  Not running: $role" -ForegroundColor DarkGray
  }
}

Write-Host ""
Write-Host "All role sessions finished. Fin." -ForegroundColor Green
