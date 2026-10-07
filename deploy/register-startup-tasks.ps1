# Registers Scheduled Tasks to auto-start BDataUI services at user logon
# Tip: Run in an elevated PowerShell (Run as Administrator) for highest privileges.
${ErrorActionPreference} = 'Stop'

$backendBat = "D:\\CursorPrograms\\BDataUI\\backend\\start_backend_prod.bat"
$frontendBat = "D:\\CursorPrograms\\BDataUI\\frontend\\start_frontend_prod.bat"
# Note: Do not compose a nested string for docker start here; use the action's -Argument instead (see $dockerAction below).

# Create actions
$backendAction = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$backendBat`""
$frontendAction = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$frontendBat`""
$dockerAction   = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -Command `"Start-Sleep -Seconds 8; docker start bdata-postgres-1; docker start bdata-redis-1`""

# Triggers (at logon)
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Principal - current user, choose run level based on elevation
# If not elevated, fall back to LeastPrivilege so registration succeeds.
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$currentUser = "$env:USERDOMAIN\$env:USERNAME"
if ($isAdmin) {
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -RunLevel Highest -LogonType Interactive
}
else {
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -RunLevel LeastPrivilege -LogonType Interactive
}

# Register tasks
try {
  Register-ScheduledTask -TaskPath "\BDataUI\" -TaskName "BDataUI-Start-Backend" -Action $backendAction -Trigger $trigger -Principal $principal -Description "Start BDataUI backend (uvicorn) on logon" -Force | Out-Null
  Register-ScheduledTask -TaskPath "\BDataUI\" -TaskName "BDataUI-Start-Frontend" -Action $frontendAction -Trigger $trigger -Principal $principal -Description "Start BDataUI frontend (Next.js) on logon" -Force | Out-Null
  Register-ScheduledTask -TaskPath "\BDataUI\" -TaskName "BDataUI-Start-DB" -Action $dockerAction -Trigger $trigger -Principal $principal -Description "Start Postgres/Redis containers on logon" -Force | Out-Null
  $mode = if ($isAdmin) { 'elevated' } else { 'user' }
  Write-Host "Startup tasks registered ($mode)." -ForegroundColor Green
}
catch {
  Write-Error $_
  if (-not $isAdmin) {
    Write-Warning "Registration failed without elevation. Please run PowerShell as Administrator and re-run this script to register with RunLevel Highest."
  }
}
