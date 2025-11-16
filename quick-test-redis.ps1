# quick-test-redis.ps1
# Quick Redis testing script for Windows (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  StanceSense Redis Testing (Windows)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Check if Docker is installed
Write-Host "`n[1/6] Checking Docker installation..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found!" -ForegroundColor Red
    Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Docker installed" -ForegroundColor Green
}

# Check if Redis container exists
Write-Host "`n[2/6] Checking Redis container..." -ForegroundColor Yellow
$redisContainer = docker ps -a --filter "name=redis-stancesense" --format "{{.Names}}"

if ($redisContainer -eq "redis-stancesense") {
    $status = docker ps --filter "name=redis-stancesense" --format "{{.Status}}"
    if ($status) {
        Write-Host "✓ Redis container is running" -ForegroundColor Green
    } else {
        Write-Host "Starting existing Redis container..." -ForegroundColor Yellow
        docker start redis-stancesense
        Start-Sleep -Seconds 2
        Write-Host "✓ Redis container started" -ForegroundColor Green
    }
} else {
    Write-Host "Creating new Redis container..." -ForegroundColor Yellow
    docker run -d --name redis-stancesense -p 6379:6379 redis:6-alpine
    Start-Sleep -Seconds 3
    Write-Host "✓ Redis container created and started" -ForegroundColor Green
}

# Test Redis connection
Write-Host "`n[3/6] Testing Redis connection..." -ForegroundColor Yellow
try {
    $pingResult = docker exec redis-stancesense redis-cli ping
    if ($pingResult -eq "PONG") {
        Write-Host "✓ Redis is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Redis connection failed" -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host "`n[4/6] Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location -Path "BACKEND\node_ingestion_service"

if (!(Test-Path "node_modules")) {
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Create .env if not exists
Write-Host "`n[5/6] Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Test Redis connection with Node.js
Write-Host "`n[6/6] Testing Redis with Node.js..." -ForegroundColor Yellow
$testScript = @'
const Redis = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6379 });

redis.on('connect', () => {
  console.log('✓ Connected to Redis');
  redis.set('test_key', 'test_value', 'EX', 10)
    .then(() => redis.get('test_key'))
    .then((value) => {
      console.log('✓ Write/Read test passed:', value);
      return redis.del('test_key');
    })
    .then(() => {
      console.log('✓ Delete test passed');
      redis.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Test failed:', err);
      redis.disconnect();
      process.exit(1);
    });
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(1);
}, 5000);
'@

Set-Content -Path "test-redis-connection.js" -Value $testScript
node test-redis-connection.js
Remove-Item "test-redis-connection.js"

Write-Host "`n✓ All tests passed!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  Ready to start Node.js service" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "`nRun: " -NoNewline
Write-Host "npm start" -ForegroundColor Cyan
Write-Host "`nMonitor Redis keys: " -NoNewline
Write-Host "docker exec redis-stancesense redis-cli KEYS 'patient:*'" -ForegroundColor Cyan
Write-Host "View data: " -NoNewline
Write-Host "docker exec redis-stancesense redis-cli LRANGE patient:test_patient_001:recent 0 5" -ForegroundColor Cyan
Write-Host ""
