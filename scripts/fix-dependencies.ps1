# Fix Dependencies Script for Smart Warehouse System
# This script fixes all dependency and build issues

Write-Host "🔧 Starting dependency fix process..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "Current Node.js version: $nodeVersion" -ForegroundColor Green

# Extract major version number
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

if ($versionNumber -lt 18) {
    Write-Host ""
    Write-Host "❌ ERROR: Node.js version 18 or higher is required!" -ForegroundColor Red
    Write-Host "Current version: $nodeVersion" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 20 LTS from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Direct download: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Node.js 20:" -ForegroundColor Cyan
    Write-Host "1. Close this PowerShell window" -ForegroundColor White
    Write-Host "2. Open a new PowerShell window" -ForegroundColor White
    Write-Host "3. Run this script again: .\scripts\fix-dependencies.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Node.js version is compatible" -ForegroundColor Green
Write-Host ""

# Clean web-app dependencies
Write-Host "🧹 Cleaning web-app dependencies..." -ForegroundColor Yellow
Set-Location web-app

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next cache" -ForegroundColor Green
}

# Clear npm cache
Write-Host ""
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ npm cache cleared" -ForegroundColor Green

# Install web-app dependencies
Write-Host ""
Write-Host "📦 Installing web-app dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web-app dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install web-app dependencies" -ForegroundColor Red
    Write-Host "Trying with legacy peer deps..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Web-app dependencies installed with legacy peer deps" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
}

Set-Location ..

# Clean firebase functions dependencies
Write-Host ""
Write-Host "🧹 Cleaning Firebase functions dependencies..." -ForegroundColor Yellow
Set-Location firebase/functions

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Install firebase functions dependencies
Write-Host ""
Write-Host "📦 Installing Firebase functions dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firebase functions dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Warning: Firebase functions installation had issues (may be okay)" -ForegroundColor Yellow
}

Set-Location ../..

# Clean iot-simulator dependencies
Write-Host ""
Write-Host "🧹 Cleaning IoT simulator dependencies..." -ForegroundColor Yellow
Set-Location iot-simulator

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Install iot-simulator dependencies
Write-Host ""
Write-Host "📦 Installing IoT simulator dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ IoT simulator dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Warning: IoT simulator installation had issues (may be okay)" -ForegroundColor Yellow
}

Set-Location ..

# Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Dependency fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run the web application:" -ForegroundColor White
Write-Host "   cd web-app" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. (Optional) Run IoT simulator:" -ForegroundColor White
Write-Host "   cd iot-simulator" -ForegroundColor Gray
Write-Host "   npm run simulate" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
