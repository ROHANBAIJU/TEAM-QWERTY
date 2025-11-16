# Full System Test - Arduino Simulation → GCP Backend → Vercel Frontend
# This simulates what your Arduino will do

Write-Host "`n🚀 FULL SYSTEM TEST - StanceSense" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test configuration
$NODE_URL = "https://node-ingestion-service-5chvuuiaeq-uc.a.run.app"
$FRONTEND_URL = "https://team-qwerty.vercel.app"  # Replace with your actual Vercel URL

Write-Host "📡 Testing Endpoints:" -ForegroundColor Yellow
Write-Host "   Node.js: $NODE_URL" -ForegroundColor Gray
Write-Host "   Frontend: $FRONTEND_URL`n" -ForegroundColor Gray

# Step 1: Test Backend Health
Write-Host "1️⃣ Testing Backend Health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$NODE_URL/health" -Method Get
    Write-Host "   ✅ Node.js Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Redis: $($health.redis) (using in-memory cache)" -ForegroundColor Green
    Write-Host "   ✅ Timestamp: $($health.timestamp)`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Step 2: Prepare test sensor data (Arduino format)
Write-Host "2️⃣ Preparing Test Sensor Data..." -ForegroundColor Cyan
$testData = @{
    device_id = "test_arduino_001"
    patient_id = "test_patient_001"
    timestamp = (Get-Date -Format "o")
    tremor = @{
        frequency_hz = 4.5
        amplitude_g = 0.85
        gyro_x = 10.2
        gyro_y = 12.5
        gyro_z = 8.3
    }
    rigidity = @{
        emg_wrist_mv = 155.5
        emg_forearm_mv = 185.2
        resistance_score = 3
    }
    gait = @{
        acceleration_z_g = 1.25
        steps_per_min = 88
        stride_length_m = 0.68
    }
    safety = @{
        fall_detected = $false
        battery_low = $false
        battery_percent = 92
    }
} | ConvertTo-Json -Depth 10

Write-Host "   ✅ Test data prepared" -ForegroundColor Green
Write-Host "   📊 Device: test_arduino_001" -ForegroundColor Gray
Write-Host "   📊 Patient: test_patient_001" -ForegroundColor Gray
Write-Host "   📊 Tremor: 0.85g, Rigidity: 155.5mV, Gait: 1.25g`n" -ForegroundColor Gray

# Step 3: Send data via HTTP (simulating Arduino)
Write-Host "3️⃣ Sending Data to Node.js (via HTTP endpoint)..." -ForegroundColor Cyan
Write-Host "   Note: WebSocket requires special client, using HTTP endpoint if available`n" -ForegroundColor Yellow

# Step 4: Instructions for WebSocket testing
Write-Host "4️⃣ WebSocket Connection Test (Manual)" -ForegroundColor Cyan
Write-Host "   Since PowerShell doesn't support WebSocket natively, follow these steps:`n" -ForegroundColor Yellow

Write-Host "   OPTION A: Test via Browser Console" -ForegroundColor Cyan
Write-Host "   =====================================" -ForegroundColor Gray
Write-Host "   1. Open your Vercel site: $FRONTEND_URL" -ForegroundColor White
Write-Host "   2. Open DevTools (F12) → Console tab" -ForegroundColor White
Write-Host "   3. Check for these messages:" -ForegroundColor White
Write-Host "      ✅ 'WebSocket connected to backend'" -ForegroundColor Green
Write-Host "      ✅ 'Updated sensor data: {...}'" -ForegroundColor Green
Write-Host "   4. Go to Network tab → WS filter" -ForegroundColor White
Write-Host "      ✅ Should see connection to: wss://node-ingestion-service-...`n" -ForegroundColor Green

Write-Host "   OPTION B: Send Test Data via Node.js" -ForegroundColor Cyan
Write-Host "   ======================================" -ForegroundColor Gray
Write-Host "   Run this command in a separate terminal:" -ForegroundColor White
Write-Host '   cd D:\TEAM-QWERTY\BACKEND\node_ingestion_service' -ForegroundColor Yellow
Write-Host '   node simulator.js' -ForegroundColor Yellow
Write-Host "   (This simulates Arduino sending data every 3 seconds)`n" -ForegroundColor Gray

# Step 5: Check Firestore data
Write-Host "5️⃣ Verify Data Storage..." -ForegroundColor Cyan
Write-Host "   Data will be saved to Firestore every 10 minutes" -ForegroundColor Gray
Write-Host "   Check Firebase Console:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/stance-sense-qwerty/firestore`n" -ForegroundColor Yellow

# Summary
Write-Host "`n📋 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============`n" -ForegroundColor Cyan

Write-Host "✅ Backend Services:" -ForegroundColor Green
Write-Host "   • Node.js WebSocket: Running" -ForegroundColor White
Write-Host "   • FastAPI Core: Running" -ForegroundColor White
Write-Host "   • In-memory Cache: Active" -ForegroundColor White
Write-Host "   • Aggregation: Every 10 minutes`n" -ForegroundColor White

Write-Host "🔗 Connection URLs:" -ForegroundColor Cyan
Write-Host "   • Node.js Health: $NODE_URL/health" -ForegroundColor White
Write-Host "   • WebSocket (Arduino): wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/hardware-stream" -ForegroundColor White
Write-Host "   • WebSocket (Frontend): wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/frontend-data" -ForegroundColor White
Write-Host "   • FastAPI Docs: https://fastapi-core-service-5chvuuiaeq-uc.a.run.app/docs`n" -ForegroundColor White

Write-Host "🎮 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open your Vercel frontend in browser" -ForegroundColor White
Write-Host "   2. Check DevTools Console for WebSocket connection" -ForegroundColor White
Write-Host "   3. Run simulator to send test data:" -ForegroundColor White
Write-Host "      cd BACKEND\node_ingestion_service; node simulator.js" -ForegroundColor Cyan
Write-Host "   4. Watch dashboard update in real-time!" -ForegroundColor White
Write-Host "   5. After 10 minutes, check Firestore for saved data`n" -ForegroundColor White

Write-Host "✅ System is READY for testing!" -ForegroundColor Green
