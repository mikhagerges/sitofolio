$ErrorActionPreference = 'Stop'
$productRoot = $PSScriptRoot
Set-Location -LiteralPath $productRoot
$nodeBinary = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath (Join-Path $productRoot '.env'))) {
    Copy-Item -LiteralPath (Join-Path $productRoot '.env.example') -Destination (Join-Path $productRoot '.env')
    Write-Host 'Created .env. Set PYTHON_PATH if Python is not on your PATH.'
}
$alreadyRunning = $false
try { $health = Invoke-RestMethod 'http://127.0.0.1:4180/health' -TimeoutSec 2; $alreadyRunning = $health.ok } catch {}
if (-not $alreadyRunning) {
    $process = Start-Process -FilePath $nodeBinary -ArgumentList '--env-file-if-exists=.env','server.mjs' -WorkingDirectory $productRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $productRoot 'server.log') -RedirectStandardError (Join-Path $productRoot 'server-error.log') -PassThru
    Set-Content -LiteralPath (Join-Path $productRoot 'server.pid') -Value $process.Id
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 300
        try { $health = Invoke-RestMethod 'http://127.0.0.1:4180/health' -TimeoutSec 1; if ($health.ok) { $ready = $true; break } } catch {}
        if ($process.HasExited) { break }
    }
    if (-not $ready) { throw 'SitoFolio did not start. Check server-error.log.' }
}
Write-Host 'SitoFolio: http://127.0.0.1:4180'
Write-Host 'The local server supervises PDF and folder processing automatically.'
Write-Host 'Service credentials belong in .env or your hosting secret store.'
