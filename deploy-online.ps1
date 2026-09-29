# ============================================
#  XingXing - deploy local code to GitHub / Railway
#  Usage: open VPN first, then double-click the .bat next to this file
# ============================================
$ErrorActionPreference = 'Continue'

$repo    = 'D:\个人复盘\daily-okr'
$ghUser  = 'chen172510'
$ghRepo  = 'chen172510/daily-okr'
$siteUrl = 'https://daily-okr-production.up.railway.app/pages/dashboard.html'
$homeUrl = 'https://daily-okr-production.up.railway.app'

function Say($text, $color) {
  if ($color) { Write-Host $text -ForegroundColor $color } else { Write-Host $text }
}

Say ''
Say '  XingXing - update online version' 'Yellow'
Say '  --------------------------------' 'DarkGray'

# ---------- 1. network ----------
Say ''
Say '[1/4] check GitHub connection (VPN required)' 'Cyan'
try {
  $null = Invoke-WebRequest -Uri 'https://github.com' -TimeoutSec 15 -UseBasicParsing
  Say '      OK' 'Green'
} catch {
  Say '      Cannot reach GitHub. Please turn on VPN and run again.' 'Red'
  Read-Host 'Press Enter to exit'
  exit 1
}

# ---------- 2. token ----------
Say ''
Say '[2/4] GitHub token' 'Cyan'
Say '      (paste it, nothing shows on screen, nothing saved to history)' 'DarkGray'
$sec = Read-Host -AsSecureString '      paste token then Enter'
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($token)) {
  Say '      no token entered, exit' 'Red'
  Read-Host 'Press Enter to exit'
  exit 1
}

# ---------- 3. push ----------
Say ''
Say '[3/4] push code to GitHub' 'Cyan'
Set-Location $repo
$pushUrl = "https://$ghUser`:$token@github.com/$ghRepo.git"
$gitExe = 'C:\Users\刘家豪\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
if (-not (Test-Path $gitExe)) { $g = Get-Command git -ErrorAction SilentlyContinue; if ($g) { $gitExe = $g.Source } else { $gitExe = 'git' } }
Say "      using git: $gitExe" 'DarkGray'
$out = (& $gitExe -c http.postBuffer=524288000 -c http.version=HTTP/1.1 push -f $pushUrl main 2>&1 | Out-String)
$out = $out.Replace($token, '***TOKEN***')
Say $out.Trim() 'DarkGray'

if ($LASTEXITCODE -ne 0) {
  Say '      push FAILED' 'Red'
  Say '      reasons: token missing repo scope / token expired / VPN dropped' 'Yellow'
  Read-Host 'Press Enter to exit'
  exit 1
}
Say '      push OK, Railway will redeploy now' 'Green'

# ---------- 4. wait for deploy ----------
Say ''
Say '[4/4] waiting for Railway deploy (2-4 min, keep this window open)' 'Cyan'
$ok = $false
for ($i = 1; $i -le 20; $i++) {
  Start-Sleep -Seconds 15
  try {
    $r = Invoke-WebRequest -Uri $siteUrl -TimeoutSec 20 -UseBasicParsing
    if ($r.Content -match 'assets/tasks.js') {
      Say "      check $i : online is up to date" 'Green'
      $ok = $true
      break
    }
    Say "      check $i : still deploying..."
  } catch {
    Say "      check $i : site not responding yet (deploying)"
  }
}

Say ''
Say '  --------------------------------' 'DarkGray'
if ($ok) {
  Say '  DONE. Your PC can be off, teacher can open:' 'Green'
  Say "  $homeUrl" 'Yellow'
} else {
  Say '  Not updated after 5 minutes.' 'Yellow'
  Say '  Open the Railway project page and click Redeploy.' 'Yellow'
  Say "  Then check: $homeUrl" 'Yellow'
}
Say ''
Say '  Security: delete this token on GitHub after use.' 'DarkGray'
Say '  Settings - Developer settings - Personal access tokens' 'DarkGray'
Say ''
Read-Host 'Press Enter to close'
