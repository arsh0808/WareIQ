# Setup script for Smart Warehouse System (PowerShell)
# This script installs all dependencies and prepares the development environment

Write-Host "🚀 Setting up Smart Warehouse System..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version must be 18 or higher. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

# Check Firebase CLI
Write-Host ""
Write-Host "🔍 Checking Firebase CLI..." -ForegroundColor Yellow
try {
    firebase --version | Out-Null
    Write-Host "✅ Firebase CLI detected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Install web app dependencies
Write-Host ""
Write-Host "📦 Installing web app dependencies..." -ForegroundColor Yellow
Set-Location web-app
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web app dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install web app dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install Firebase functions dependencies
Write-Host ""
Write-Host "📦 Installing Firebase functions dependencies..." -ForegroundColor Yellow
Set-Location firebase/functions
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firebase functions dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Firebase functions dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ../..

# Install IoT simulator dependencies
Write-Host ""
Write-Host "📦 Installing IoT simulator dependencies..." -ForegroundColor Yellow
Set-Location iot-simulator
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ IoT simulator dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install IoT simulator dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Check for .env.local
Write-Host ""
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path "web-app/.env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "web-app/.env.example" "web-app/.env.local"
    Write-Host "📝 Please edit web-app/.env.local with your Firebase configuration" -ForegroundColor Cyan
}

if (!(Test-Path "iot-simulator/.env")) {
    Write-Host "⚠️  IoT simulator .env not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "iot-simulator/.env.example" "iot-simulator/.env"
    Write-Host "📝 Please edit iot-simulator/.env with your Firebase configuration" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a Firebase project at https://console.firebase.google.com"
Write-Host "2. Edit web-app/.env.local with your Firebase config"
Write-Host "3. Run 'firebase login' to authenticate"
Write-Host "4. Run 'cd firebase; firebase use --add' to select your project"
Write-Host "5. Start development:"
Write-Host "   Terminal 1: cd firebase; firebase emulators:start"
Write-Host "   Terminal 2: cd web-app; npm run dev"
Write-Host "   Terminal 3: cd iot-simulator; npm run simulate"
Write-Host ""
Write-Host "📖 Read GETTING_STARTED.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
