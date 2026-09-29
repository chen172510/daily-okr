# 双击「手机访问地址.bat」运行：显示当前手机该用哪个地址，并确保服务在跑
$ErrorActionPreference = 'Continue'
$srv = Join-Path $PSScriptRoot 'server'
$port = 3000

Write-Host ''
Write-Host '  XingXing - phone access address' -ForegroundColor Yellow
Write-Host '  ----------------------------------------' -ForegroundColor DarkGray

# 1) 服务在不在跑
try {
  $null = Invoke-WebRequest ("http://localhost:$port/api/health") -UseBasicParsing -TimeoutSec 4
  Write-Host '  server: RUNNING' -ForegroundColor Green
} catch {
  Write-Host '  server: not running, starting...' -ForegroundColor Yellow
  $node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (-not (Test-Path $node)) { $node = 'node' }
  if (Test-Path (Join-Path $srv 'server.js')) {
    Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $srv -WindowStyle Hidden
    Start-Sleep -Seconds 6
    try {
      $null = Invoke-WebRequest ("http://localhost:$port/api/health") -UseBasicParsing -TimeoutSec 5
      Write-Host '  server: STARTED' -ForegroundColor Green
    } catch {
      Write-Host '  server: start FAILED (run 启动服务.bat to see the error)' -ForegroundColor Red
    }
  } else {
    Write-Host "  server.js not found: $srv" -ForegroundColor Red
  }
}

# 2) 列出可用的局域网地址
Write-Host ''
Write-Host '  Type one of these in your phone browser (same WiFi as this PC):' -ForegroundColor Cyan
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
  Select-Object -ExpandProperty IPAddress -Unique

if (-not $ips -or $ips.Count -eq 0) {
  Write-Host '  no LAN address found, check WiFi connection' -ForegroundColor Red
} else {
  foreach ($ip in $ips) {
    Write-Host ''
    Write-Host ("  http://" + $ip + ":$port/pages/login.html?demo=1") -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host '  ----------------------------------------' -ForegroundColor DarkGray
Write-Host '  The address changes with the network. Re-run this tool if it fails.' -ForegroundColor DarkGray
Write-Host '  If the phone still cannot connect, turn on the PC mobile hotspot.' -ForegroundColor DarkGray
Write-Host ''
Read-Host '  Press Enter to close'
