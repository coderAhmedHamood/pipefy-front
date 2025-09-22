Write-Host "Starting Pipefy API Server..." -ForegroundColor Green
Set-Location $PSScriptRoot
node test-server.js
