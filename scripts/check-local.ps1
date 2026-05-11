param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$Url = "http://localhost:$Port/"

try {
  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
    Write-Host "OK: local app is reachable at $Url (HTTP $($response.StatusCode))."
    exit 0
  }

  Write-Host "ERROR: $Url responded with HTTP $($response.StatusCode)."
  exit 1
} catch {
  Write-Host "ERROR: local app is not reachable at $Url."
  Write-Host $_.Exception.Message

  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
    Write-Host "A process is listening on port ${Port}:"
    Write-Host "PID: $($listener.OwningProcess)"
    if ($process) {
      Write-Host "Command: $($process.CommandLine)"
    }
  } else {
    Write-Host "No process is listening on port $Port. Run npm.cmd run local:start."
  }

  exit 1
}
