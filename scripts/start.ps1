# libreprint: start the print queue for the day.
#
# Starts the production server and the public zrok link, rebuilding first only when
# the code changed since the last build. Safe to run again: anything already running
# is left alone. Close the two minimized windows ("libreprint server", "libreprint link")
# to stop everything.
#
# Run it from anywhere in PowerShell:
#   iwr -useb https://raw.githubusercontent.com/fersonull/libreprint/main/scripts/start.ps1 | iex
# or from the project folder:
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
#
# Optional settings (environment variables):
#   LIBREPRINT_DIR        project folder              (default: this script's folder, else C:\Dev\printqueue)
#   LIBREPRINT_ZROK_NAME  reserved zrok name           (default: libreprint)
#   LIBREPRINT_ZROK       path to zrok2.exe / zrok.exe (default: found on PATH, else C:\zrok2\zrok2.exe)

& {
  $ErrorActionPreference = "Stop"
  $port = 3000

  function Say($text, $color = "Gray") { Write-Host "  $text" -ForegroundColor $color }
  function Fail($text) { Write-Host "  $text" -ForegroundColor Red; Write-Host ""; return }

  Write-Host ""
  Write-Host "  libreprint" -ForegroundColor White

  # --- Find everything -------------------------------------------------------
  $dir = if ($env:LIBREPRINT_DIR) { $env:LIBREPRINT_DIR }
         elseif ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "..\package.json"))) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
         else { "C:\Dev\printqueue" }
  if (-not (Test-Path (Join-Path $dir "package.json"))) {
    return Fail "Can't find the libreprint folder at $dir. Set LIBREPRINT_DIR to where it is."
  }

  $bun = (Get-Command bun -ErrorAction SilentlyContinue).Source
  if (-not $bun) { return Fail "Bun is not installed. See https://bun.sh" }

  $zrok = if ($env:LIBREPRINT_ZROK) { $env:LIBREPRINT_ZROK }
          else { (Get-Command zrok2, zrok -ErrorAction SilentlyContinue | Select-Object -First 1).Source }
  if (-not $zrok -and (Test-Path "C:\zrok2\zrok2.exe")) { $zrok = "C:\zrok2\zrok2.exe" }
  $name = if ($env:LIBREPRINT_ZROK_NAME) { $env:LIBREPRINT_ZROK_NAME } else { "libreprint" }

  # --- Server ----------------------------------------------------------------
  $running = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($running) {
    Say "Server already running on port $port." Green
  } else {
    # Rebuild only if code changed after the last build.
    $buildId = Join-Path $dir ".next\BUILD_ID"
    $builtAt = if (Test-Path $buildId) { (Get-Item $buildId).LastWriteTime } else { [datetime]::MinValue }
    $sources = @("app", "features", "shared", "public", "package.json", "bun.lock", "next.config.ts", "proxy.ts") |
      ForEach-Object { Join-Path $dir $_ } | Where-Object { Test-Path $_ }
    $changed = Get-ChildItem $sources -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -gt $builtAt } | Select-Object -First 1

    if ($changed) {
      Say "Building the latest version (takes about a minute)..." Yellow
      Push-Location $dir
      try { & $bun run build | Out-Host; $ok = $LASTEXITCODE -eq 0 } finally { Pop-Location }
      if (-not $ok) { return Fail "Build failed. The error is above; ask whoever maintains libreprint." }
    }

    Say "Starting the server..."
    Start-Process -FilePath "cmd.exe" -WorkingDirectory $dir -WindowStyle Minimized `
      -ArgumentList "/c", "title libreprint server && `"$bun`" run start"

    $up = $false
    for ($i = 0; $i -lt 60 -and -not $up; $i++) {
      Start-Sleep -Seconds 1
      # 127.0.0.1, not localhost: Windows PowerShell tries IPv6 first and the server only listens on IPv4.
      try { $up = (Invoke-WebRequest "http://127.0.0.1:$port/upload" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch {}
    }
    if (-not $up) { return Fail "The server didn't start. Open the 'libreprint server' window to see why." }
    Say "Server is up." Green
  }

  # --- Public link -------------------------------------------------------------
  $publicUrl = $null
  if (-not $zrok) {
    Say "zrok not found, so there's no public link. Customers can still use the shop Wi-Fi." Yellow
  } else {
    $sharing = Get-CimInstance Win32_Process -Filter "Name LIKE 'zrok%'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match "share public" -and $_.CommandLine -match "localhost:$port" }
    if ($sharing) {
      Say "Public link already running." Green
    } else {
      Start-Process -FilePath "cmd.exe" -WindowStyle Minimized `
        -ArgumentList "/c", "title libreprint link && `"$zrok`" share public localhost:$port --name-selection public:$name --headless"
      Say "Public link started." Green
    }
    $publicUrl = "https://$name.shares.zrok.io"
  }

  # --- Done ------------------------------------------------------------------
  $lan = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.PrefixOrigin -in "Dhcp", "Manual" -and $_.IPAddress -notlike "169.254*" } |
    Select-Object -First 1 -ExpandProperty IPAddress

  Write-Host ""
  Say "Staff:      http://localhost:$port/staff/dashboard" White
  if ($lan) { Say "Shop Wi-Fi: http://${lan}:$port" White }
  if ($publicUrl) { Say "Customers:  $publicUrl" White }
  Write-Host ""
  Say "To stop: close the 'libreprint server' and 'libreprint link' windows."
  Write-Host ""

  Start-Process "http://localhost:$port/staff/dashboard"
}
