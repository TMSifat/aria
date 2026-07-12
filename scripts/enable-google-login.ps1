# ═══════════════════════════════════════════════════════════════════════════
#  ENABLE GOOGLE LOGIN — one-click prod setup/repair for "Sign in with Google".
#  Reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the local .env,
#  REPLACES them in Vercel production (removes any old/corrupted copies),
#  redeploys, and waits until the Google button is live.
#  Values are piped through cmd.exe from a BOM-less temp file so PowerShell
#  can never prepend a hidden BOM character again (the Error-401 cause).
#  Safe to run more than once.
# ═══════════════════════════════════════════════════════════════════════════

$ProductionUrl = 'https://aria-neon-sigma.vercel.app'

# Run from the repo root regardless of how the script was launched.
Set-Location (Join-Path $PSScriptRoot '..')

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

# ─── 1. Read the OAuth credentials from .env (values are never printed) ─────
Step 'Reading Google OAuth credentials from .env'
$envText = [System.IO.File]::ReadAllText((Join-Path (Get-Location) '.env'))
$clientId = if ($envText -match '(?m)^GOOGLE_CLIENT_ID=(.+)$') { $Matches[1].Trim().Trim('"') } else { '' }
$clientSecret = if ($envText -match '(?m)^GOOGLE_CLIENT_SECRET=(.+)$') { $Matches[1].Trim().Trim('"') } else { '' }

if (-not $clientId -or -not $clientSecret) {
  Write-Host '   .env e GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET paoa gelo na!' -ForegroundColor Red
  Write-Host '   Claude ke bolo abar set kore dite.' -ForegroundColor Red
  exit 1
}
Write-Host '   Credentials paoa geche (values kokhono print hoy na).'

# ─── 2. Replace them in Vercel production (old/corrupted copies removed) ────
Step 'Replacing Vercel production env vars (BOM-safe)'

function Set-EnvVar($name, $value) {
  # Remove any existing copy (ignore "not found" errors).
  npx vercel env rm $name production -y 2>$null | Out-Null

  # Write the value to a temp file WITHOUT a BOM, then let cmd.exe pipe the
  # raw bytes into vercel — PowerShell never touches the stdin stream.
  $tmp = Join-Path $env:TEMP ("vercel-env-" + [guid]::NewGuid().ToString('N') + '.txt')
  [System.IO.File]::WriteAllText($tmp, $value, (New-Object System.Text.UTF8Encoding($false)))
  try {
    cmd /c "type `"$tmp`" | npx vercel env add $name production" | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "   $name replaced (clean)" }
    else { Write-Host "   $name FAILED to add" -ForegroundColor Red; exit 1 }
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

Set-EnvVar 'GOOGLE_CLIENT_ID'     $clientId
Set-EnvVar 'GOOGLE_CLIENT_SECRET' $clientSecret

# ─── 3. Sanity check: pull the vars back and verify no hidden BOM ────────────
Step 'Verifying stored values are clean'
$pullFile = Join-Path $env:TEMP 'vercel-env-check.env'
npx vercel env pull $pullFile --environment=production --yes 2>$null | Out-Null
if (Test-Path $pullFile) {
  $pulled = [System.IO.File]::ReadAllText($pullFile)
  Remove-Item $pullFile -Force -ErrorAction SilentlyContinue
  if ($pulled -match 'GOOGLE_CLIENT_ID="?(\S*?)168300323176') {
    $prefix = $Matches[1]
    if ($prefix -eq '') { Write-Host '   GOOGLE_CLIENT_ID clean - no hidden characters' -ForegroundColor Green }
    else { Write-Host '   WARNING: hidden characters still present! Claude ke janao.' -ForegroundColor Red }
  } else {
    Write-Host '   (could not verify from pull - continuing)'
  }
} else {
  Write-Host '   (env pull unavailable - continuing)'
}

# ─── 4. Redeploy so the new env vars take effect ────────────────────────────
Step 'Triggering a fresh production deploy'
git commit --allow-empty -m 'chore: redeploy with clean Google OAuth env' | Out-Null
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host '   git push failed - internet / GitHub check koro, tarpor abar chalao.' -ForegroundColor Red
  exit 1
}

# ─── 5. Wait until the Google provider is live ──────────────────────────────
Step 'Waiting for the deploy (2-4 minute lagte pare)...'
$deadline = (Get-Date).AddMinutes(8)
$live = $false
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 15
  try {
    $providers = Invoke-RestMethod "$ProductionUrl/api/auth/providers" -TimeoutSec 10
    if ($providers.PSObject.Properties.Name -contains 'google') { $live = $true; break }
    Write-Host '   deploy cholche...'
  } catch { Write-Host '   deploy cholche...' }
}

if ($live) {
  Write-Host ''
  Write-Host '  ✔ HOYE GECHE! "Sign in with Google" ekhon LIVE:' -ForegroundColor Green
  Write-Host "    $ProductionUrl/login" -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host '  Deploy ekhono shesh hoyni. 5 minute pore ei link check koro:' -ForegroundColor Yellow
  Write-Host "    $ProductionUrl/api/auth/providers  (google thakle ready)" -ForegroundColor Yellow
}
