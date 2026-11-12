$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$processFile = Join-Path $root '.data\local-processes.json'

if (Test-Path $processFile) {
  $processes = Get-Content $processFile -Raw | ConvertFrom-Json
  foreach ($id in @($processes.frontend, $processes.backend)) {
    if ($id -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) {
      Stop-Process -Id $id -Force
    }
  }
  Remove-Item $processFile -Force
}

$pgCtl = Join-Path $root '.runtime\pgsql\bin\pg_ctl.exe'
if (Test-Path $pgCtl) {
  & $pgCtl -D (Join-Path $root '.data\postgres') -m fast stop
}
Write-Host 'Frontend, API, dan PostgreSQL lokal telah dihentikan.'
