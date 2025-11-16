# Vercel Deployment Script for StanceSense Frontend (Windows)

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  🚀 DEPLOYING TO VERCEL" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location "$PSScriptRoot\FRONTEND\stansence"

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor White
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

Write-Host "✅ Vercel CLI ready" -ForegroundColor Green
Write-Host ""

# Show environment variables that will be used
Write-Host "📋 Environment Variables:" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_API_URL=https://fastapi-core-service-315465328987.us-central1.run.app" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_WEBSOCKET_URL=wss://node-ingestion-service-315465328987.us-central1.run.app" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_NODE_SERVICE_URL=https://node-ingestion-service-315465328987.us-central1.run.app" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Deploy to Vercel production
vercel --prod

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: Add environment variables in Vercel Dashboard if not already added:" -ForegroundColor Yellow
Write-Host "   Settings → Environment Variables → Add New" -ForegroundColor White
Write-Host ""
Write-Host "   NEXT_PUBLIC_API_URL" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_WEBSOCKET_URL" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_NODE_SERVICE_URL" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_ENVIRONMENT" -ForegroundColor Cyan
Write-Host ""
