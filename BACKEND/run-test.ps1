# Quick Test Script - Runs the interactive test
# Run this after starting FastAPI and Node.js servers

Write-Host "`n🏥 StanceSense Interactive Test Script`n" -ForegroundColor Cyan

# Check if websocket-client is installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
python -c "import websocket" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ websocket-client not found. Installing..." -ForegroundColor Red
    pip install websocket-client
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install websocket-client" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Dependencies OK`n" -ForegroundColor Green

# Check if Node.js server is running
Write-Host "Checking Node.js server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Node.js server is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js server not running!" -ForegroundColor Red
    Write-Host "Start it with: cd BACKEND\node_ingestion_service ; npm start`n" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check if FastAPI server is running
Write-Host "Checking FastAPI server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ FastAPI server is running`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  FastAPI server not running (optional)" -ForegroundColor Yellow
    Write-Host "Start it with: cd BACKEND\core_api_service ; uvicorn app.main:app --reload`n" -ForegroundColor Yellow
}

Write-Host "`n🚀 Starting interactive test script...`n" -ForegroundColor Cyan
Write-Host "="*70 -ForegroundColor Gray

# Run the test script
cd $PSScriptRoot
python test_interactive.py
