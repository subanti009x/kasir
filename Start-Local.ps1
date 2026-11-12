$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$node = Join-Path $root '.runtime\node\node.exe'
$pgCtl = Join-Path $root '.runtime\pgsql\bin\pg_ctl.exe'
$pgData = Join-Path $root '.data\postgres'
$logDir = Join-Path $root '.logs'

New-Item -ItemType Directory -Force -Path $logDir, (Join-Path $root '.data') | Out-Null
$env:TEMP = Join-Path $root '.tmp'
$env:TMP = Join-Path $root '.tmp'
$env:PATH = (Join-Path $root '.runtime\node') + ';' + (Join-Path $root '.runtime\pgsql\bin') + ';' + $env:PATH
$backendEnv = Join-Path $root 'backend\.env'
if (-not (Test-Path $backendEnv)) { throw 'File backend\.env tidak ditemukan.' }
foreach ($line in Get-Content $backendEnv) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $key = $Matches[1]
    $value = $Matches[2].Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  }
}

if (-not (Test-Path $node) -or -not (Test-Path $pgCtl)) {
  throw 'Runtime Node.js atau PostgreSQL belum tersedia di folder .runtime.'
}

& $pgCtl -D $pgData status *> $null
if ($LASTEXITCODE -ne 0) {
  & $pgCtl -D $pgData -o '-h 127.0.0.1 -p 5432' -l (Join-Path $logDir 'postgres.log') start
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL gagal dijalankan. Periksa .logs\postgres.log.' }
}

foreach ($port in 3000, 3001) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $port sedang digunakan. Hentikan proses yang memakai port tersebut, lalu jalankan ulang."
  }
}

$backend = Start-Process -FilePath $node `
  -ArgumentList @('dist/src/main.js') `
  -WorkingDirectory (Join-Path $root 'backend') `
  -RedirectStandardOutput (Join-Path $logDir 'backend-stdout.log') `
  -RedirectStandardError (Join-Path $logDir 'backend-stderr.log') `
  -WindowStyle Hidden -PassThru

$frontend = Start-Process -FilePath $node `
  -ArgumentList @('node_modules/next/dist/bin/next', 'start', '-p', '3001') `
  -WorkingDirectory $root `
  -RedirectStandardOutput (Join-Path $logDir 'frontend-stdout.log') `
  -RedirectStandardError (Join-Path $logDir 'frontend-stderr.log') `
  -WindowStyle Hidden -PassThru

@{ backend = $backend.Id; frontend = $frontend.Id } |
  ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $root '.data\local-processes.json')

$deadline = (Get-Date).AddSeconds(60)
$frontendReady = $false
$backendReady = $false
while ((Get-Date) -lt $deadline -and (-not $frontendReady -or -not $backendReady)) {
  if (-not $frontendReady) {
    try { $frontendReady = (Invoke-WebRequest 'http://localhost:3001' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch {}
  }
  if (-not $backendReady) {
    try { $backendReady = (Invoke-WebRequest 'http://localhost:3000/api/docs' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch {}
  }
  if (-not $frontendReady -or -not $backendReady) { Start-Sleep -Seconds 2 }
}

if (-not $frontendReady -or -not $backendReady) {
  throw "Aplikasi belum siap. Frontend=$frontendReady, API=$backendReady. Lihat log di $logDir."
}

Write-Host 'Aplikasi siap digunakan:'
Write-Host '  UI:      http://localhost:3001'
Write-Host '  API:     http://localhost:3000/api/docs'
Write-Host '  Login:   ayu@nusantarabakery.com / owner123'
Write-Host '  Admin:   admin@kasirpro.com / admin123'
Write-Host 'Hentikan layanan dengan: .\Stop-Local.ps1'
