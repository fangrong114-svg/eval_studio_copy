param(
  [int]$Port = 3000,
  [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Url = "http://localhost:$Port/"
$OutLog = Join-Path $ProjectRoot '.codex-vite.out.log'
$ErrLog = Join-Path $ProjectRoot '.codex-vite.err.log'

function Test-LocalApp {
  param([string]$TargetUrl)

  try {
    $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 3
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

if (Test-LocalApp $Url) {
  Write-Host "OK: local app is already running at $Url"
  if ($OpenBrowser) {
    Start-Process $Url
  }
  exit 0
}

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
  Write-Host "node_modules not found. Installing dependencies with npm.cmd install..."
  Push-Location $ProjectRoot
  try {
    & npm.cmd install
  } finally {
    Pop-Location
  }
}

"[$(Get-Date -Format o)] Starting local app with npm.cmd run dev" | Out-File -LiteralPath $OutLog -Encoding utf8
"[$(Get-Date -Format o)] stderr log" | Out-File -LiteralPath $ErrLog -Encoding utf8

$process = Start-Process `
  -FilePath 'npm.cmd' `
  -ArgumentList @('run', 'dev') `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $OutLog `
  -RedirectStandardError $ErrLog `
  -PassThru

Write-Host "Started local app process PID $($process.Id). Waiting for $Url ..."

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1

  if (Test-LocalApp $Url) {
    Write-Host "OK: local app is reachable at $Url"
    Write-Host "Logs:"
    Write-Host "  $OutLog"
    Write-Host "  $ErrLog"
    if ($OpenBrowser) {
      Start-Process $Url
    }
    exit 0
  }

  if ($process.HasExited) {
    Write-Host "ERROR: local app process exited early with code $($process.ExitCode)."
    Write-Host "Last stdout:"
    Get-Content -LiteralPath $OutLog -Tail 40 -ErrorAction SilentlyContinue
    Write-Host "Last stderr:"
    Get-Content -LiteralPath $ErrLog -Tail 40 -ErrorAction SilentlyContinue
    exit 1
  }
}

Write-Host "ERROR: local app did not become reachable within 30 seconds."
Write-Host "PID $($process.Id) may still be running. Check logs:"
Write-Host "  $OutLog"
Write-Host "  $ErrLog"
exit 1
