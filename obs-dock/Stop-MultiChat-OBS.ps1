$base = Join-Path $env:LOCALAPPDATA 'TSRBMultiChatOBS'
$pidFile = Join-Path $base 'service-pid.txt'
if (Test-Path $pidFile) {
  $servicePid = [IO.File]::ReadAllText($pidFile).Trim()
  if ($servicePid -match '^\d+$') {
    $proc = Get-Process -Id ([int]$servicePid) -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') {
      Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue
      Write-Host "TSRB MultiChat gestoppt."
    }
  }
  Remove-Item $pidFile -ErrorAction SilentlyContinue
}
