<#
Builds the frontend for production and collects everything the server needs
into frontend\deploy-package. Copy that folder to the server and run it with Node.

Usage:
  .\package_for_deploy.ps1 -ApiBase https://api.example.com
  .\package_for_deploy.ps1 -ApiBase ""   # browser calls /api and /auth on the same host (reverse proxy)
#>
param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$ApiBase
)

$ErrorActionPreference = "Stop"
$frontend = $PSScriptRoot
$out = Join-Path $frontend "deploy-package"

Push-Location $frontend
try {
    # The browser API address is baked into the bundle at build time.
    $env:NEXT_PUBLIC_API_BASE = $ApiBase.TrimEnd("/")
    $env:NEXT_TELEMETRY_DISABLED = "1"

    # Stop `npm run dev` first: it shares the .next folder with this build.
    if (-not (Test-Path "node_modules")) {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

    if (Test-Path $out) { Remove-Item $out -Recurse -Force }
    Copy-Item ".next\standalone" $out -Recurse
    Copy-Item ".next\static" (Join-Path $out ".next\static") -Recurse
    Copy-Item "public" (Join-Path $out "public") -Recurse

    # Local env files must not ship with the package.
    Get-ChildItem $out -Force -Filter ".env*" | Remove-Item -Force

    Copy-Item "DEPLOY.md" (Join-Path $out "DEPLOY.md")
    Copy-Item ".env.production.example" (Join-Path $out ".env.production.example")

    Write-Host ""
    Write-Host "Package ready: $out"
    Write-Host "Browser API base baked in: '$($env:NEXT_PUBLIC_API_BASE)'"
}
finally {
    Pop-Location
}
