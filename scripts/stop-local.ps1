param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $listeners) {
  Write-Host "OK: no process is listening on port $Port."
  exit 0
}

$stopped = 0

foreach ($listener in $listeners) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
  $commandLine = if ($process) { [string]$process.CommandLine } else { '' }

  if ($commandLine.Contains($ProjectRoot)) {
    Write-Host "Stopping local app process PID $($listener.OwningProcess)."
    Stop-Process -Id $listener.OwningProcess -Force
    $stopped += 1
  } else {
    Write-Host "Skipping PID $($listener.OwningProcess): it is listening on port $Port but does not look like this project."
    if ($commandLine) {
      Write-Host "Command: $commandLine"
    }
  }
}

if ($stopped -gt 0) {
  Write-Host "OK: stopped $stopped local app process(es)."
} else {
  Write-Host "No matching local app process was stopped."
}
