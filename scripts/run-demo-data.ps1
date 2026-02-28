# Quick Demo Data Generator Runner
# This script runs the complete demo data generator

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Smart Warehouse - Demo Data Generator                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🎭 This will populate your warehouse with realistic demo data!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📦 What will be created:" -ForegroundColor White
Write-Host "   • 3 Warehouses" -ForegroundColor Gray
Write-Host "   • 1,200+ Shelves" -ForegroundColor Gray
Write-Host "   • 50-80 Products" -ForegroundColor Gray
Write-Host "   • 40-65 Inventory Items" -ForegroundColor Gray
Write-Host "   • 200 Transactions" -ForegroundColor Gray
Write-Host "   • 30-40 Alerts" -ForegroundColor Gray
Write-Host "   • 25-30 IoT Devices" -ForegroundColor Gray
Write-Host "   • 100 Audit Logs" -ForegroundColor Gray
Write-Host ""

# Check if service account exists
if (-not (Test-Path "../firebase/service-account.json")) {
    Write-Host "❌ ERROR: Firebase service account not found!" -ForegroundColor Red
    Write-Host "   Please add firebase/service-account.json first" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Firebase service account found" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "⚠️  This will ADD data to your Firestore. Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "`n❌ Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting data generation..." -ForegroundColor Cyan
Write-Host "⏳ This will take 2-3 minutes...`n" -ForegroundColor Yellow

# Run the generator
node generate-complete-demo-data.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ DATA GENERATION COMPLETE!                            ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "🎉 Your warehouse is now fully populated!`n" -ForegroundColor Green
    
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Start the web app: cd ../web-app && npm run dev" -ForegroundColor White
    Write-Host "   2. Login and explore all pages" -ForegroundColor White
    Write-Host "   3. See alerts, transactions, analytics, and more!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n❌ Data generation failed. Check the errors above." -ForegroundColor Red
    Write-Host ""
}

pause
