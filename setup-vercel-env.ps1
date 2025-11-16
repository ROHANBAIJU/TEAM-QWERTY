# Setup Vercel Environment Variables
# Run this script to automatically configure all required environment variables

Write-Host "`n🚀 VERCEL ENVIRONMENT SETUP SCRIPT" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
    Write-Host "`nInstalling Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Vercel CLI found`n" -ForegroundColor Green

# Navigate to frontend directory
Set-Location "D:\TEAM-QWERTY\FRONTEND\stansence"

Write-Host "📁 Project Directory: FRONTEND/stansence`n" -ForegroundColor Cyan

# Environment variables with CORRECT Cloud Run URLs
$envVars = @{
    "NEXT_PUBLIC_WEBSOCKET_URL" = "wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app"
    "NEXT_PUBLIC_API_URL" = "https://fastapi-core-service-5chvuuiaeq-uc.a.run.app"
    "NEXT_PUBLIC_NODE_SERVICE_URL" = "https://node-ingestion-service-5chvuuiaeq-uc.a.run.app"
    "NEXT_PUBLIC_FASTAPI_URL" = "https://fastapi-core-service-5chvuuiaeq-uc.a.run.app"
    "NEXT_PUBLIC_ENVIRONMENT" = "production"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "stance-sense-qwerty"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "stance-sense-qwerty.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "stance-sense-qwerty.appspot.com"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "315465328987"
}

Write-Host "🔧 Setting Environment Variables in Vercel..." -ForegroundColor Yellow
Write-Host "(This will add them to Production, Preview, and Development environments)`n" -ForegroundColor Gray

$successCount = 0
$failCount = 0

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting: $key" -ForegroundColor Cyan
    
    # Add to all environments (production, preview, development)
    $result = vercel env add $key production preview development --force 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Provide the value via stdin
        $value | vercel env add $key production preview development --force 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Success: $value" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ Failed to set value" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "  ⚠️  May already exist, trying to update..." -ForegroundColor Yellow
        # Try to remove and re-add
        vercel env rm $key production preview development --yes 2>&1 | Out-Null
        $value | vercel env add $key production preview development --force 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Updated successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ Failed to update" -ForegroundColor Red
            $failCount++
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "📊 RESULTS:" -ForegroundColor Yellow
Write-Host "  ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red

if ($failCount -gt 0) {
    Write-Host "`n⚠️  Some variables failed to set automatically" -ForegroundColor Yellow
    Write-Host "Please add them manually in Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "https://vercel.com/dashboard → Settings → Environment Variables`n" -ForegroundColor Cyan
}

Write-Host "`n🔄 Triggering Redeployment..." -ForegroundColor Yellow
vercel --prod 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOYMENT TRIGGERED!" -ForegroundColor Green
    Write-Host "Your site will rebuild with the correct backend URLs`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Could not trigger automatic deployment" -ForegroundColor Yellow
    Write-Host "Please redeploy manually:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host "  2. Select your project" -ForegroundColor Cyan
    Write-Host "  3. Deployments → Latest → Redeploy`n" -ForegroundColor Cyan
}

Write-Host "====================================`n" -ForegroundColor Cyan
Write-Host "📋 CORRECT BACKEND URLS:" -ForegroundColor Green
Write-Host "  Node.js WebSocket: wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app" -ForegroundColor Cyan
Write-Host "  FastAPI Core: https://fastapi-core-service-5chvuuiaeq-uc.a.run.app`n" -ForegroundColor Cyan

# Return to original directory
Set-Location "D:\TEAM-QWERTY"

Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "Wait 2-3 minutes for Vercel to rebuild, then test your site`n" -ForegroundColor Yellow
