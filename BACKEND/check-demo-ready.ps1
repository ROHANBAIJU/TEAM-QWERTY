# Quick Demo Readiness Check
Write-Host "`n🔍 CHECKING DEMO READINESS..." -ForegroundColor Cyan
Write-Host "="*70

# Check 1: Node.js server
Write-Host "`n1️⃣ Checking Node.js server (port 8080)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Node.js is RUNNING" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Node.js is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it with: cd BACKEND\node_ingestion_service; npm start" -ForegroundColor Yellow
}

# Check 2: FastAPI server
Write-Host "`n2️⃣ Checking FastAPI server (port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ FastAPI is RUNNING" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ FastAPI is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it with: cd BACKEND\core_api_service; uvicorn app.main:app --reload" -ForegroundColor Yellow
}

# Check 3: Python websocket-client
Write-Host "`n3️⃣ Checking Python dependencies..." -ForegroundColor Yellow
try {
    python -c "import websocket" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ websocket-client is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ websocket-client is NOT installed" -ForegroundColor Red
    Write-Host "   💡 Install it with: pip install websocket-client" -ForegroundColor Yellow
}

# Check 4: Test script exists
Write-Host "`n4️⃣ Checking test script..." -ForegroundColor Yellow
if (Test-Path "test_interactive.py") {
    Write-Host "   ✅ test_interactive.py found" -ForegroundColor Green
} else {
    Write-Host "   ❌ test_interactive.py NOT found" -ForegroundColor Red
}

Write-Host "`n" + "="*70
Write-Host "🎬 DEMO READY STATUS" -ForegroundColor Cyan
Write-Host "="*70

# Summary
$nodeOk = (Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue).TcpTestSucceeded
$fastApiOk = (Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue).TcpTestSucceeded

if ($nodeOk -and $fastApiOk) {
    Write-Host "`n✅ ALL SYSTEMS GO! Ready for demo!`n" -ForegroundColor Green
    Write-Host "🚀 Run: python test_interactive.py`n" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some services need to be started`n" -ForegroundColor Yellow
    Write-Host "See DEMO_INSTRUCTIONS.md for setup steps`n" -ForegroundColor Yellow
}
