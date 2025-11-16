# deploy-to-gcp.ps1
# Complete GCP deployment script for Windows PowerShell
# StanceSense Backend Deployment

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "stancesense-prod-$(Get-Date -Format 'yyyyMMdd')"
$REGION = "us-central1"
$NODE_SERVICE_NAME = "node-ingestion-service"
$FASTAPI_SERVICE_NAME = "fastapi-core-service"
$FRONTEND_SERVICE_NAME = "stancesense-frontend"

# Colors
function Write-Header {
    param($Text)
    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host "  $Text" -ForegroundColor Blue
    Write-Host "========================================`n" -ForegroundColor Blue
}

function Write-Success {
    param($Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Info {
    param($Text)
    Write-Host "→ $Text" -ForegroundColor Cyan
}

function Write-Warning {
    param($Text)
    Write-Host "⚠ $Text" -ForegroundColor Yellow
}

function Write-Error {
    param($Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

Write-Header "StanceSense GCP Deployment"

# Check gcloud installation
Write-Info "Checking gcloud CLI..."
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Success "gcloud CLI found: $gcloudVersion"
} catch {
    Write-Error "gcloud CLI not found!"
    Write-Warning "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Get or create project
Write-Info "Setting up GCP project..."
$currentProject = gcloud config get-value project 2>$null
if ($currentProject) {
    $useExisting = Read-Host "Use existing project '$currentProject'? (y/n)"
    if ($useExisting -eq 'y') {
        $PROJECT_ID = $currentProject
    } else {
        $PROJECT_ID = Read-Host "Enter new project ID (or press Enter for $PROJECT_ID)"
        if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
            $PROJECT_ID = "stancesense-prod-$(Get-Date -Format 'yyyyMMdd')"
        }
        gcloud projects create $PROJECT_ID --name="StanceSense Production"
    }
} else {
    gcloud projects create $PROJECT_ID --name="StanceSense Production"
}

gcloud config set project $PROJECT_ID
Write-Success "Project set to: $PROJECT_ID"

# Enable APIs
Write-Header "[1/8] Enabling GCP APIs"
Write-Info "This may take 2-3 minutes..."
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    firestore.googleapis.com `
    redis.googleapis.com `
    vpcaccess.googleapis.com `
    secretmanager.googleapis.com `
    compute.googleapis.com

Write-Success "All APIs enabled"

# Create VPC Connector
Write-Header "[2/8] Creating VPC Connector"
$vpcExists = gcloud compute networks vpc-access connectors describe redis-connector --region=$REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "VPC connector already exists"
} else {
    Write-Info "Creating VPC connector (takes 2-3 minutes)..."
    gcloud compute networks vpc-access connectors create redis-connector `
        --region=$REGION `
        --range=10.8.0.0/28
    Write-Success "VPC connector created"
}

# Create Redis instance
Write-Header "[3/8] Setting up Redis (Memorystore)"
$redisExists = gcloud redis instances describe stancesense-redis --region=$REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Redis instance already exists"
    $REDIS_HOST = gcloud redis instances describe stancesense-redis --region=$REGION --format="value(host)"
} else {
    Write-Info "Creating Redis instance (takes 3-5 minutes)..."
    gcloud redis instances create stancesense-redis `
        --size=1 `
        --region=$REGION `
        --redis-version=redis_6_x `
        --tier=basic
    
    # Wait for Redis
    Write-Info "Waiting for Redis to be ready..."
    do {
        $status = gcloud redis instances describe stancesense-redis --region=$REGION --format="value(state)" 2>$null
        if ($status -ne "READY") {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 10
        }
    } while ($status -ne "READY")
    Write-Host ""
    
    $REDIS_HOST = gcloud redis instances describe stancesense-redis --region=$REGION --format="value(host)"
    Write-Success "Redis ready at: $REDIS_HOST"
}

# Deploy Node.js Service
Write-Header "[4/8] Deploying Node.js Ingestion Service"
Set-Location -Path "$PSScriptRoot\BACKEND\node_ingestion_service"

if (!(Test-Path "Dockerfile")) {
    Write-Error "Dockerfile not found in node_ingestion_service!"
    exit 1
}

Write-Info "Building and deploying Node.js service..."
gcloud run deploy $NODE_SERVICE_NAME `
    --source . `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars="REDIS_HOST=$REDIS_HOST,REDIS_PORT=6379,USE_REDIS_CACHE=true,SIMULATOR=false,AGGREGATION_INTERVAL=600000,ACTIVE_USERS=test_patient_001,APP_ID=stancesense" `
    --vpc-connector=redis-connector `
    --port=8080 `
    --memory=512Mi `
    --cpu=1 `
    --min-instances=1 `
    --max-instances=10

$NODE_SERVICE_URL = gcloud run services describe $NODE_SERVICE_NAME --region $REGION --format="value(status.url)"
Write-Success "Node.js service deployed: $NODE_SERVICE_URL"

# Test health endpoint
try {
    $health = Invoke-RestMethod -Uri "$NODE_SERVICE_URL/health"
    Write-Success "Health check passed: $($health.status)"
} catch {
    Write-Warning "Health check failed (service may still be starting)"
}

Set-Location -Path $PSScriptRoot

# Deploy FastAPI Service
Write-Header "[5/8] Deploying FastAPI Core Service"
Set-Location -Path "$PSScriptRoot\BACKEND\core_api_service"

if (!(Test-Path "Dockerfile")) {
    Write-Error "Dockerfile not found in core_api_service!"
    exit 1
}

# Upload Firebase credentials
if (!(Test-Path "stancesense_qwerty_serviceAccountKey.json")) {
    Write-Error "Firebase service account key not found!"
    Write-Warning "Please place stancesense_qwerty_serviceAccountKey.json in BACKEND/core_api_service/"
    exit 1
}

Write-Info "Uploading Firebase credentials to Secret Manager..."
$secretExists = gcloud secrets describe firebase-credentials 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Secret already exists, updating..."
    gcloud secrets versions add firebase-credentials --data-file=stancesense_qwerty_serviceAccountKey.json
} else {
    gcloud secrets create firebase-credentials `
        --data-file=stancesense_qwerty_serviceAccountKey.json `
        --replication-policy="automatic"
}
Write-Success "Firebase credentials uploaded"

# Ask about Gemini API key
Write-Info "Do you have a Gemini API key?"
$hasGemini = Read-Host "Enter API key (or press Enter to skip)"

Write-Info "Building and deploying FastAPI service..."
if (![string]::IsNullOrWhiteSpace($hasGemini)) {
    # Store Gemini key
    $geminiSecretExists = gcloud secrets describe gemini-api-key 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Gemini secret exists, updating..."
        echo $hasGemini | gcloud secrets versions add gemini-api-key --data-file=-
    } else {
        echo $hasGemini | gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic"
    }
    
    gcloud run deploy $FASTAPI_SERVICE_NAME `
        --source . `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --set-env-vars="APP_ID=stancesense,NODE_INGESTION_URL=$NODE_SERVICE_URL,ENVIRONMENT=production" `
        --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials:latest,GEMINI_API_KEY=gemini-api-key:latest" `
        --port=8000 `
        --memory=1Gi `
        --cpu=2 `
        --min-instances=1 `
        --max-instances=10 `
        --timeout=300
} else {
    gcloud run deploy $FASTAPI_SERVICE_NAME `
        --source . `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --set-env-vars="APP_ID=stancesense,NODE_INGESTION_URL=$NODE_SERVICE_URL,ENVIRONMENT=production" `
        --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials:latest" `
        --port=8000 `
        --memory=1Gi `
        --cpu=2 `
        --min-instances=1 `
        --max-instances=10 `
        --timeout=300
}

$FASTAPI_SERVICE_URL = gcloud run services describe $FASTAPI_SERVICE_NAME --region $REGION --format="value(status.url)"
Write-Success "FastAPI service deployed: $FASTAPI_SERVICE_URL"

Set-Location -Path $PSScriptRoot

# Update Node.js with FastAPI URL
Write-Header "[6/8] Updating Node.js Configuration"
Write-Info "Linking services..."
gcloud run services update $NODE_SERVICE_NAME `
    --region $REGION `
    --set-env-vars="FASTAPI_INGEST_URL=$FASTAPI_SERVICE_URL/ingest/data"
Write-Success "Services linked"

# Deploy Frontend (Optional)
Write-Header "[7/8] Deploying Frontend (Optional)"
$deployFrontend = Read-Host "Deploy Next.js frontend? (y/n)"

if ($deployFrontend -eq 'y') {
    Set-Location -Path "$PSScriptRoot\FRONTEND\stansence"
    
    # Create production env
    @"
NEXT_PUBLIC_FASTAPI_URL=$FASTAPI_SERVICE_URL
NEXT_PUBLIC_WS_URL=$($NODE_SERVICE_URL.Replace('https', 'wss'))
NEXT_PUBLIC_APP_ID=stancesense
"@ | Out-File -FilePath .env.production -Encoding utf8
    
    Write-Info "Building and deploying frontend..."
    gcloud run deploy $FRONTEND_SERVICE_NAME `
        --source . `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --port=3000 `
        --memory=1Gi `
        --cpu=1 `
        --min-instances=0 `
        --max-instances=5
    
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE_NAME --region $REGION --format="value(status.url)"
    Write-Success "Frontend deployed: $FRONTEND_URL"
    
    Set-Location -Path $PSScriptRoot
} else {
    Write-Info "Skipping frontend deployment"
    $FRONTEND_URL = "Not deployed"
}

# Summary
Write-Header "[8/8] Deployment Complete!"

Write-Host "`nService URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    $FRONTEND_URL"
Write-Host "  FastAPI:     $FASTAPI_SERVICE_URL"
Write-Host "  Node.js WS:  $NODE_SERVICE_URL"
Write-Host "  Redis Host:  $REDIS_HOST"

Write-Host "`nCost Estimate (24/7 operation):" -ForegroundColor Yellow
Write-Host "  Cloud Run:   ~`$5-10/month (free tier covers demo)"
Write-Host "  Redis (1GB): ~`$40/month"
Write-Host "  Firestore:   ~`$1-5/month (with aggregation)"
Write-Host "  Total:       ~`$46-55/month"

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Test services:" -ForegroundColor White
Write-Host "     Invoke-WebRequest -Uri '$NODE_SERVICE_URL/health'" -ForegroundColor Gray
Write-Host "  2. View logs:" -ForegroundColor White
Write-Host "     gcloud run logs tail $NODE_SERVICE_NAME --region $REGION" -ForegroundColor Gray
Write-Host "  3. Monitor costs:" -ForegroundColor White
Write-Host "     Start-Process 'https://console.cloud.google.com/billing'" -ForegroundColor Gray

Write-Host "`n" -NoNewline
Write-Success "Deployment successful! Your backend is live on GCP!"

# Open browser
$openBrowser = Read-Host "`nOpen services in browser? (y/n)"
if ($openBrowser -eq 'y') {
    if ($FRONTEND_URL -ne "Not deployed") {
        Start-Process $FRONTEND_URL
    }
    Start-Process "$FASTAPI_SERVICE_URL/docs"
    Start-Process "https://console.cloud.google.com/run?project=$PROJECT_ID"
}
