# 🚀 Step-by-Step GCP Deployment Guide

## Prerequisites Checklist

- [ ] Google Cloud account created
- [ ] gcloud CLI installed
- [ ] Node.js backend tested locally
- [ ] FastAPI backend tested locally
- [ ] Firebase service account key file ready

## Part 1: Initial GCP Setup (15 minutes)

### Step 1.1: Install gcloud CLI

**Windows:**
```powershell
# Download from: https://cloud.google.com/sdk/docs/install
# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**After installation, restart PowerShell and verify:**
```powershell
gcloud --version
```

### Step 1.2: Authenticate with Google Cloud

```powershell
# Login to your Google account
gcloud auth login

# This will open a browser - sign in with your Google account
# Select the account you want to use for GCP
```

### Step 1.3: Create a New GCP Project

```powershell
# Set your project name
$PROJECT_ID = "stancesense-prod-$(Get-Date -Format 'yyyyMMdd')"

# Create the project
gcloud projects create $PROJECT_ID --name="StanceSense Production"

# Set as default project
gcloud config set project $PROJECT_ID

# Verify
gcloud config get-value project
```

### Step 1.4: Enable Billing

**IMPORTANT:** You must enable billing to use Cloud Run and other services.

```powershell
# Open billing page
Start-Process "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
```

**In the browser:**
1. Click "Link a billing account"
2. Select your billing account (or create new one with $300 free credit)
3. Click "Set account"

### Step 1.5: Enable Required APIs

```powershell
# Enable all required APIs (takes 2-3 minutes)
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    firestore.googleapis.com `
    redis.googleapis.com `
    vpcaccess.googleapis.com `
    secretmanager.googleapis.com `
    compute.googleapis.com

Write-Host "✓ All APIs enabled!" -ForegroundColor Green
```

## Part 2: Setup Redis (Memorystore) (10 minutes)

### Step 2.1: Create VPC Connector

Redis runs in a VPC (private network). Cloud Run needs a connector to access it.

```powershell
$REGION = "us-central1"

# Create VPC connector
gcloud compute networks vpc-access connectors create redis-connector `
    --region=$REGION `
    --range=10.8.0.0/28

# Wait for creation (takes 2-3 minutes)
Write-Host "Waiting for VPC connector..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

# Verify
gcloud compute networks vpc-access connectors describe redis-connector --region=$REGION
```

### Step 2.2: Create Redis Instance

```powershell
# Create 1GB Redis instance (takes 3-5 minutes)
gcloud redis instances create stancesense-redis `
    --size=1 `
    --region=$REGION `
    --redis-version=redis_6_x `
    --tier=basic

Write-Host "Creating Redis instance (this takes 3-5 minutes)..." -ForegroundColor Yellow
Write-Host "You can check status in the console:" -ForegroundColor Cyan
Start-Process "https://console.cloud.google.com/memorystore/redis/instances?project=$PROJECT_ID"

# Wait for Redis to be ready
do {
    $status = gcloud redis instances describe stancesense-redis --region=$REGION --format="value(state)"
    Write-Host "Redis status: $status"
    if ($status -ne "READY") {
        Start-Sleep -Seconds 30
    }
} while ($status -ne "READY")

# Get Redis IP
$REDIS_HOST = gcloud redis instances describe stancesense-redis --region=$REGION --format="value(host)"
Write-Host "✓ Redis ready! Host: $REDIS_HOST" -ForegroundColor Green
```

## Part 3: Deploy Node.js Service (10 minutes)

### Step 3.1: Prepare Node.js for Deployment

```powershell
cd BACKEND\node_ingestion_service

# Verify Dockerfile exists
if (!(Test-Path Dockerfile)) {
    Write-Host "ERROR: Dockerfile not found!" -ForegroundColor Red
    exit 1
}

# Test build locally (optional but recommended)
docker build -t node-ingestion-service .
```

### Step 3.2: Deploy to Cloud Run

```powershell
# Deploy Node.js service
gcloud run deploy node-ingestion-service `
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

# Get the service URL
$NODE_SERVICE_URL = gcloud run services describe node-ingestion-service --region $REGION --format="value(status.url)"
Write-Host "✓ Node.js Service deployed!" -ForegroundColor Green
Write-Host "URL: $NODE_SERVICE_URL" -ForegroundColor Cyan

# Test health endpoint
$response = Invoke-WebRequest -Uri "$NODE_SERVICE_URL/health" -UseBasicParsing
Write-Host "Health check: $($response.Content)" -ForegroundColor Green
```

## Part 4: Deploy FastAPI Service (15 minutes)

### Step 4.1: Upload Firebase Credentials to Secret Manager

```powershell
cd ..\core_api_service

# Check if service account key exists
if (!(Test-Path "stancesense_qwerty_serviceAccountKey.json")) {
    Write-Host "ERROR: Firebase service account key not found!" -ForegroundColor Red
    Write-Host "Please place stancesense_qwerty_serviceAccountKey.json in this directory" -ForegroundColor Yellow
    exit 1
}

# Create secret
gcloud secrets create firebase-credentials `
    --data-file=stancesense_qwerty_serviceAccountKey.json `
    --replication-policy="automatic"

Write-Host "✓ Firebase credentials stored in Secret Manager" -ForegroundColor Green
```

### Step 4.2: Store Gemini API Key (if you have one)

```powershell
# If you have a Gemini API key, store it
$GEMINI_KEY = Read-Host "Enter your Gemini API key (or press Enter to skip)"
if ($GEMINI_KEY) {
    echo $GEMINI_KEY | gcloud secrets create gemini-api-key --data-file=-
    $USE_GEMINI = "true"
    Write-Host "✓ Gemini API key stored" -ForegroundColor Green
} else {
    $USE_GEMINI = "false"
    Write-Host "⚠ Skipping Gemini API key" -ForegroundColor Yellow
}
```

### Step 4.3: Deploy FastAPI to Cloud Run

```powershell
# Build and deploy
if ($USE_GEMINI -eq "true") {
    gcloud run deploy fastapi-core-service `
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
    gcloud run deploy fastapi-core-service `
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

# Get the service URL
$FASTAPI_SERVICE_URL = gcloud run services describe fastapi-core-service --region $REGION --format="value(status.url)"
Write-Host "✓ FastAPI Service deployed!" -ForegroundColor Green
Write-Host "URL: $FASTAPI_SERVICE_URL" -ForegroundColor Cyan
```

### Step 4.4: Update Node.js with FastAPI URL

```powershell
# Update Node.js service to use the FastAPI URL
gcloud run services update node-ingestion-service `
    --region $REGION `
    --set-env-vars="FASTAPI_INGEST_URL=$FASTAPI_SERVICE_URL/ingest/data"

Write-Host "✓ Node.js service updated with FastAPI URL" -ForegroundColor Green
```

## Part 5: Deploy Frontend (Optional - 10 minutes)

### Step 5.1: Update Frontend Environment Variables

```powershell
cd ..\..\FRONTEND\stansence

# Create production environment file
@"
NEXT_PUBLIC_FASTAPI_URL=$FASTAPI_SERVICE_URL
NEXT_PUBLIC_WS_URL=$($NODE_SERVICE_URL.Replace('https', 'wss'))
NEXT_PUBLIC_APP_ID=stancesense
"@ | Out-File -FilePath .env.production -Encoding utf8

Write-Host "✓ Frontend environment configured" -ForegroundColor Green
```

### Step 5.2: Deploy Frontend to Cloud Run

```powershell
# Deploy Next.js frontend
gcloud run deploy stancesense-frontend `
    --source . `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port=3000 `
    --memory=1Gi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=5

$FRONTEND_URL = gcloud run services describe stancesense-frontend --region $REGION --format="value(status.url)"
Write-Host "✓ Frontend deployed!" -ForegroundColor Green
Write-Host "URL: $FRONTEND_URL" -ForegroundColor Cyan
```

## Part 6: Verification & Testing (5 minutes)

### Step 6.1: Test All Services

```powershell
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue

Write-Host "`nService URLs:" -ForegroundColor Yellow
Write-Host "Frontend:       $FRONTEND_URL"
Write-Host "FastAPI:        $FASTAPI_SERVICE_URL"
Write-Host "Node.js WS:     $NODE_SERVICE_URL"
Write-Host "Redis Host:     $REDIS_HOST"

# Test Node.js health
Write-Host "`nTesting Node.js health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$NODE_SERVICE_URL/health"
    Write-Host "✓ Node.js: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js health check failed" -ForegroundColor Red
}

# Test FastAPI docs
Write-Host "`nTesting FastAPI..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$FASTAPI_SERVICE_URL/docs" -UseBasicParsing
    Write-Host "✓ FastAPI: Accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ FastAPI check failed" -ForegroundColor Red
}

# Open services in browser
Write-Host "`nOpening services in browser..." -ForegroundColor Yellow
Start-Process $FRONTEND_URL
Start-Sleep -Seconds 2
Start-Process "$FASTAPI_SERVICE_URL/docs"
```

### Step 6.2: View Logs

```powershell
# View logs in terminal
Write-Host "`nTo view logs, run:" -ForegroundColor Cyan
Write-Host "gcloud run logs tail node-ingestion-service --region $REGION" -ForegroundColor Yellow
Write-Host "gcloud run logs tail fastapi-core-service --region $REGION" -ForegroundColor Yellow

# Or open in browser
Start-Process "https://console.cloud.google.com/run?project=$PROJECT_ID"
```

## Part 7: Post-Deployment Configuration

### Step 7.1: Monitor Costs

```powershell
# Open billing dashboard
Start-Process "https://console.cloud.google.com/billing?project=$PROJECT_ID"
```

**Expected Costs:**
- Cloud Run (3 services): $0-5/month (free tier covers most usage)
- Redis (1GB): ~$40/month
- Firestore: ~$1-5/month
- **Total**: ~$41-50/month

### Step 7.2: Set Up Alerts (Recommended)

```powershell
# Open alerts page
Start-Process "https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
```

**Create alerts for:**
- Cloud Run error rate > 5%
- Redis memory usage > 80%
- Firestore costs > $10/day

### Step 7.3: Enable HTTPS Custom Domain (Optional)

```powershell
# Open domain mappings
Start-Process "https://console.cloud.google.com/run/domains?project=$PROJECT_ID"
```

## Troubleshooting

### Issue: "Permission denied" errors

```powershell
# Grant yourself necessary roles
$PROJECT_ID = gcloud config get-value project
$USER_EMAIL = gcloud config get-value account

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$USER_EMAIL" `
    --role="roles/owner"
```

### Issue: Redis connection timeout

```powershell
# Verify VPC connector
gcloud compute networks vpc-access connectors describe redis-connector --region $REGION

# Check Redis status
gcloud redis instances describe stancesense-redis --region $REGION
```

### Issue: Build failures

```powershell
# View recent builds
gcloud builds list --limit=5

# View specific build log
$BUILD_ID = (gcloud builds list --limit=1 --format="value(id)")
gcloud builds log $BUILD_ID
```

### Issue: Service not accessible

```powershell
# Check service status
gcloud run services describe node-ingestion-service --region $REGION
gcloud run services describe fastapi-core-service --region $REGION

# View recent logs
gcloud run logs read node-ingestion-service --region $REGION --limit=50
```

## Cleanup (if you want to delete everything)

```powershell
# Delete services
gcloud run services delete node-ingestion-service --region $REGION --quiet
gcloud run services delete fastapi-core-service --region $REGION --quiet
gcloud run services delete stancesense-frontend --region $REGION --quiet

# Delete Redis
gcloud redis instances delete stancesense-redis --region $REGION --quiet

# Delete VPC connector
gcloud compute networks vpc-access connectors delete redis-connector --region $REGION --quiet

# Delete secrets
gcloud secrets delete firebase-credentials --quiet
gcloud secrets delete gemini-api-key --quiet

# Delete project (WARNING: This deletes EVERYTHING)
# gcloud projects delete $PROJECT_ID
```

## Quick Commands Reference

```powershell
# View all services
gcloud run services list --region $REGION

# View logs (follow mode)
gcloud run logs tail node-ingestion-service --region $REGION --follow

# Update environment variable
gcloud run services update node-ingestion-service `
    --region $REGION `
    --set-env-vars="NEW_VAR=value"

# Scale service
gcloud run services update fastapi-core-service `
    --region $REGION `
    --min-instances=0 `
    --max-instances=5

# View Redis metrics
gcloud redis instances describe stancesense-redis --region $REGION
```

---

## ✅ Deployment Complete!

Your StanceSense system is now running on GCP with:
- ✅ Redis caching (99.5% write reduction)
- ✅ Auto-scaling Cloud Run services
- ✅ Secure Secret Manager for credentials
- ✅ VPC network for Redis access
- ✅ Production-ready architecture

**Next Steps:**
1. Test all endpoints
2. Monitor logs for errors
3. Set up billing alerts
4. Configure custom domain (optional)
5. Share the frontend URL with your team!

Need help? Check the logs or reach out!
