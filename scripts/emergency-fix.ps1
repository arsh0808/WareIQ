# Emergency Fix Script - Resolves undici/Node.js compatibility issues
# Run this if you're getting "Unexpected token" errors with undici

Write-Host "🚨 Emergency Fix - Resolving undici compatibility issues..." -ForegroundColor Red
Write-Host ""

# Check Node.js version
$nodeVersion = node -v
Write-Host "Current Node.js version: $nodeVersion" -ForegroundColor Yellow

$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

if ($versionNumber -lt 20) {
    Write-Host ""
    Write-Host "⚠️  WARNING: You are using Node.js $nodeVersion" -ForegroundColor Yellow
    Write-Host "This project works best with Node.js 20+" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download Node.js 20 LTS here:" -ForegroundColor Cyan
    Write-Host "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -ForegroundColor White
    Write-Host ""
    Write-Host "However, attempting to fix with current version..." -ForegroundColor Yellow
    Write-Host ""
}

Set-Location web-app

# Clean everything
Write-Host "🧹 Cleaning..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# Clear cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Install with specific flags
Write-Host ""
Write-Host "📦 Installing dependencies with compatibility fixes..." -ForegroundColor Yellow
npm install --legacy-peer-deps --force

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 20 LTS and try again:" -ForegroundColor Yellow
    Write-Host "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host ""

npm run dev
