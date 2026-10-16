$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $base 'app\obs-server.js'
$node = Join-Path $base 'runtime\node.exe'
if (-not (Test-Path $node) -or -not (Test-Path $backend)) {
  Write-Host "Die OBS-Erweiterung wurde unvollstaendig entpackt." -ForegroundColor Red
  exit 1
}
$settings = Join-Path $env:LOCALAPPDATA "TSRBMultiChatOBS"
New-Item -ItemType Directory -Path $settings -Force | Out-Null
$port = 18765
$tokenFile = Join-Path $settings 'access-token.txt'
if (-not (Test-Path $tokenFile)) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $token = [Convert]::ToHexString($bytes)
  [IO.File]::WriteAllText($tokenFile, $token)
}
$token = [IO.File]::ReadAllText($tokenFile).Trim()
$env:TSRB_OBS_PORT = [string]$port
$env:TSRB_OBS_TOKEN = $token
$health = "http://127.0.0.1:$port/health"
$working = $false
try {
  $response = Invoke-RestMethod -Uri $health -TimeoutSec 2
  $working = ($response.ok -eq $true)
} catch {}
if (-not $working) {
  $process = Start-Process -FilePath $node -ArgumentList @('"'+$backend+'"') -WorkingDirectory (Join-Path $base 'app') -PassThru -WindowStyle Hidden
  [IO.File]::WriteAllText((Join-Path $settings 'service-pid.txt'), [string]$process.Id)
  for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 300
    try {
      $response = Invoke-RestMethod -Uri $health -TimeoutSec 2
      if ($response.ok) { $working = $true; break }
    } catch {}
    if ($process.HasExited) { break }
  }
}
if (-not $working) {
  Write-Host "Lokaler Chat-Dienst konnte nicht gestartet werden. Port 18765 belegt?" -ForegroundColor Red
  exit 1
}
$dockUrl = "http://127.0.0.1:$port/dock?token=$token"
$overlayUrl = "http://127.0.0.1:$port/overlay?token=$token"
[IO.File]::WriteAllText((Join-Path $base 'OBS-DOCK-LINK.txt'), $dockUrl)
[IO.File]::WriteAllText((Join-Path $base 'OBS-OVERLAY-LINK.txt'), $overlayUrl)
Set-Clipboard -Value $dockUrl
Write-Host ""
Write-Host "TSRB MultiChat OBS-Dock ist bereit." -ForegroundColor Green
Write-Host "Der OBS-Dock-Link wurde kopiert."
Write-Host "OBS -> Docks -> Custom Browser Docks / Benutzerdefinierte Browser-Docks"
Write-Host "Name: TSRB MultiChat | URL: Strg+V"
Write-Host ""
Write-Host "Fuer Chat-Nachrichten im Stream: OBS Browser-Quelle -> URL aus OBS-OVERLAY-LINK.txt."
Write-Host "WICHTIG: Dock-Links und Tokens nicht im Stream oder oeffentlich teilen."
