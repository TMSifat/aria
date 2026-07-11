# ═══════════════════════════════════════════════════════════════════════════
#  ARIA GO-LIVE — runs every production step that needs the owner's machine:
#    1. Applies database migrations to the production Neon database
#    2. Sets the missing Vercel production env vars (secret, URLs, admin email)
#    3. Optionally stores your Gemini API key (paste it, or press Enter to skip)
#    4. Triggers a fresh production deploy and waits until the site is healthy
#  Safe to run more than once — every step skips what is already done.
# ═══════════════════════════════════════════════════════════════════════════

$ProductionUrl = 'https://aria-neon-sigma.vercel.app'

# Run from the repo root regardless of how the script was launched.
Set-Location (Join-Path $PSScriptRoot '..')

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

# ─── 1. Production database migration ───────────────────────────────────────
Step 'Pulling production env from Vercel'
$envFile = '.vercel\.env.production.local'
npx vercel env pull $envFile --environment production | Out-Null
if (-not (Test-Path $envFile)) {
  Write-Host 'Could not pull Vercel env. Run "npx vercel login" first, then re-run this script.' -ForegroundColor Red
  exit 1
}

$direct = $null
$m = Select-String -Path $envFile -Pattern '^DATABASE_URL_UNPOOLED="([^"]+)"'
if ($m) { $direct = $m.Matches[0].Groups[1].Value }
if (-not $direct) {
  $m = Select-String -Path $envFile -Pattern '^DATABASE_URL="([^"]+)"'
  if ($m) { $direct = $m.Matches[0].Groups[1].Value }
}
if (-not $direct) {
  Write-Host 'No DATABASE_URL found in Vercel env — connect Neon to the Vercel project first.' -ForegroundColor Red
  exit 1
}

Step 'Applying migrations to the production database (Neon)'
$env:DATABASE_URL = $direct
$env:DIRECT_DATABASE_URL = $direct
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Migration failed — stopping. Nothing else was changed.' -ForegroundColor Red
  exit 1
}

# ─── 2. Vercel production env vars ───────────────────────────────────────────
Step 'Setting Vercel production env vars (existing ones are left untouched)'
$existing = (npx vercel env ls production 2>$null) -join "`n"

function Add-EnvVar($name, $value) {
  if ($existing -match "(?m)^\s*$name\s") {
    Write-Host "   $name already set - skipping"
    return
  }
  $value | npx vercel env add $name production | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "   $name added" }
  else { Write-Host "   $name FAILED to add" -ForegroundColor Yellow }
}

# Fresh random session secret (never printed).
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$sessionSecret = [Convert]::ToBase64String($bytes)

Add-EnvVar 'NEXTAUTH_SECRET'      $sessionSecret
Add-EnvVar 'NEXTAUTH_URL'         $ProductionUrl
Add-EnvVar 'NEXT_PUBLIC_APP_URL'  $ProductionUrl
Add-EnvVar 'AUTH_TRUST_HOST'      'true'
Add-EnvVar 'ADMIN_EMAIL'          'tanvirsifat51@gmail.com'
Add-EnvVar 'GOOGLE_MODEL'         'gemini-2.5-flash'
Add-EnvVar 'DIRECT_DATABASE_URL'  $direct

# ─── 3. Gemini API key (optional — makes AI chat work) ──────────────────────
if (-not ($existing -match '(?m)^\s*GOOGLE_API_KEY\s')) {
  Write-Host ''
  Write-Host 'Gemini API key lagbe AI chat er jonno. Free key:' -ForegroundColor Yellow
  Write-Host '  https://aistudio.google.com/apikey' -ForegroundColor Yellow
  $geminiKey = Read-Host 'Key paste koro ekhane (skip korte khali Enter chapo)'
  if ($geminiKey.Trim()) {
    $geminiKey.Trim() | npx vercel env add GOOGLE_API_KEY production | Out-Null
    Write-Host '   GOOGLE_API_KEY added - AI chat enabled!' -ForegroundColor Green
  } else {
    Write-Host '   Skipped - chat off thakbe jotokhon key add na hoy. Pore abar ei script chalao.' -ForegroundColor Yellow
  }
}

# ─── 4. Redeploy so the new env takes effect ─────────────────────────────────
Step 'Triggering a fresh production deploy'
git commit --allow-empty -m 'chore: redeploy with production env' | Out-Null
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host 'git push failed — deploy from the Vercel dashboard instead.' -ForegroundColor Red
  exit 1
}

Step 'Waiting for the site to come up (2-4 minutes)...'
$healthy = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 10
  try {
    $r = Invoke-RestMethod "$ProductionUrl/api/health" -TimeoutSec 10
    if ($r.status -eq 'ok') { $healthy = $true; break }
  } catch { }
  Write-Host '   ...deploying' -NoNewline; Write-Host ''
}

Write-Host ''
if ($healthy) {
  Write-Host '=============================================' -ForegroundColor Green
  Write-Host '  ARIA IS LIVE:' $ProductionUrl -ForegroundColor Green
  Write-Host '  1. Site e jao -> Sign up koro' -ForegroundColor Green
  Write-Host '     (tanvirsifat51@gmail.com diye signup korle' -ForegroundColor Green
  Write-Host '      automatic ADMIN hoye jabe)' -ForegroundColor Green
  Write-Host '=============================================' -ForegroundColor Green
} else {
  Write-Host 'Site ekhono ready hoyni — 2 min por browser e check koro:' -ForegroundColor Yellow
  Write-Host "  $ProductionUrl/api/health" -ForegroundColor Yellow
}
