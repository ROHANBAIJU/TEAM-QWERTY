# 🎯 GCP Deployment - Complete Guide

## Quick Start (3 Steps)

### 1️⃣ Run Pre-Deployment Check
```powershell
.\pre-deployment-check.ps1
```
This verifies everything is ready before deployment.

### 2️⃣ Deploy to GCP
```powershell
.\deploy-to-gcp.ps1
```
Follow the prompts - deployment takes ~30 minutes.

### 3️⃣ Test Your Deployment
```powershell
# Test Node.js health
Invoke-WebRequest -Uri "YOUR_NODE_URL/health"

# Open FastAPI docs
Start-Process "YOUR_FASTAPI_URL/docs"
```

---

## 📋 What You Need Before Starting

### Required:
- [ ] Google Cloud account (with $300 free credit)
- [ ] gcloud CLI installed ([Download](https://cloud.google.com/sdk/docs/install))
- [ ] Node.js 16+ installed
- [ ] Firebase service account key file

### Optional:
- [ ] Docker (for local testing)
- [ ] Gemini API key (for AI features)

---

## 🏗️ Architecture Overview

Your system will be deployed with:

```
┌─────────────────────────────────────────────────┐
│            Google Cloud Platform                │
├─────────────────────────────────────────────────┤
│                                                 │
│  Next.js Frontend (Cloud Run)                  │
│         ↓ WebSocket                            │
│  Node.js Service (Cloud Run)                   │
│         ↓ Cache ←→ Memorystore Redis (1GB)    │
│         ↓                                       │
│  FastAPI Service (Cloud Run)                   │
│         ↓                                       │
│  Firestore Database                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Key Features:
- ✅ **Auto-scaling**: Handles 0-10 concurrent requests automatically
- ✅ **Redis caching**: 99.5% reduction in database writes
- ✅ **Secure secrets**: Firebase credentials in Secret Manager
- ✅ **VPC network**: Private Redis access
- ✅ **Health checks**: Automatic service monitoring

---

## 💻 Localhost Development (Fallback System)

Your code is configured to work **both locally and on GCP** automatically!

### Local Configuration (.env files)

**Node.js Service** (`BACKEND/node_ingestion_service/.env`):
```bash
PORT=8080
REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS_CACHE=true
FASTAPI_INGEST_URL=http://127.0.0.1:8000/ingest/data
SIMULATOR=true
AGGREGATION_INTERVAL=60000
```

**FastAPI Service** (`BACKEND/core_api_service/.env`):
```bash
APP_ID=stancesense
GOOGLE_APPLICATION_CREDENTIALS=stancesense_qwerty_serviceAccountKey.json
NODE_INGESTION_URL=http://127.0.0.1:8080
ENVIRONMENT=development
PORT=8000
```

### Running Locally

**Terminal 1 - Node.js:**
```powershell
cd BACKEND\node_ingestion_service
npm start
```

**Terminal 2 - FastAPI:**
```powershell
cd BACKEND\core_api_service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend:**
```powershell
cd FRONTEND\stansence
npm run dev
```

### GCP Configuration (Automatic)

On GCP, environment variables are set automatically:

```powershell
# Cloud Run sets PORT automatically
PORT=8080 (from Cloud Run)

# You configure these in deployment
REDIS_HOST=10.x.x.x (Memorystore IP)
FASTAPI_INGEST_URL=https://fastapi-xxx.run.app/ingest/data
SIMULATOR=false (use real hardware)
```

**The code automatically detects the environment!**

---

## 🚀 Deployment Process

### Method 1: Automated Script (Recommended)

```powershell
# 1. Check everything is ready
.\pre-deployment-check.ps1

# 2. Run deployment (takes ~30 minutes)
.\deploy-to-gcp.ps1

# The script will:
# - Create GCP project
# - Enable APIs
# - Create VPC connector
# - Deploy Redis (Memorystore)
# - Deploy Node.js service
# - Deploy FastAPI service
# - Link services together
# - (Optional) Deploy frontend
```

### Method 2: Manual Step-by-Step

See `GCP_DEPLOYMENT_STEP_BY_STEP.md` for detailed instructions.

---

## 📊 Cost Breakdown

### Monthly Costs (24/7 Operation):

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Run - Node.js** | 1M requests | $0 (free tier) |
| **Cloud Run - FastAPI** | 1M requests | $0 (free tier) |
| **Cloud Run - Frontend** | 1M requests | $0 (free tier) |
| **Memorystore Redis** | 1GB, Basic tier | **~$40** |
| **Firestore** | 144 writes/day | **~$1-5** |
| **VPC Connector** | Included | $0 |
| **Secret Manager** | <100 secrets | $0 |
| **Cloud Build** | <120 builds/day | $0 (free tier) |
| **Total** | | **~$41-45/month** |

### Cost Optimization Tips:

1. **For Hackathon Demo** (1-2 days):
   ```powershell
   # Use smallest Redis
   --size=0.5
   
   # Scale frontend to zero when not in use
   --min-instances=0
   
   # Estimated cost: <$3 for 2 days
   ```

2. **For Production** (ongoing):
   ```powershell
   # Set up budget alerts
   gcloud billing budgets create --billing-account=ACCOUNT_ID --display-name="StanceSense Budget" --budget-amount=50USD
   ```

3. **Delete When Done**:
   ```powershell
   # Delete all resources
   .\cleanup-gcp.ps1
   ```

---

## 🔍 Monitoring & Debugging

### View Logs

```powershell
# Real-time logs
gcloud run logs tail node-ingestion-service --region us-central1 --follow

# Recent errors only
gcloud run logs read fastapi-core-service --region us-central1 --limit=50 --log-filter="severity>=ERROR"

# View in browser
Start-Process "https://console.cloud.google.com/logs"
```

### Check Service Status

```powershell
# List all services
gcloud run services list --region us-central1

# Describe specific service
gcloud run services describe node-ingestion-service --region us-central1

# Test health endpoint
Invoke-WebRequest -Uri "https://YOUR_SERVICE_URL/health"
```

### Monitor Redis

```powershell
# Check Redis status
gcloud redis instances describe stancesense-redis --region us-central1

# View metrics in browser
Start-Process "https://console.cloud.google.com/memorystore/redis"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Permission denied"

```powershell
# Solution: Add yourself as owner
$PROJECT_ID = gcloud config get-value project
$USER_EMAIL = gcloud config get-value account

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$USER_EMAIL" `
    --role="roles/owner"
```

### Issue 2: "Redis connection timeout"

```powershell
# Solution 1: Verify VPC connector
gcloud compute networks vpc-access connectors describe redis-connector --region us-central1

# Solution 2: Check Node.js has VPC connector attached
gcloud run services describe node-ingestion-service --region us-central1 --format="value(spec.template.metadata.annotations)"
```

### Issue 3: "Build failed"

```powershell
# View build logs
$BUILD_ID = (gcloud builds list --limit=1 --format="value(id)")
gcloud builds log $BUILD_ID

# Common fix: Check Dockerfile
cat BACKEND\node_ingestion_service\Dockerfile
```

### Issue 4: "Service unavailable (503)"

```powershell
# Check if service is cold starting
gcloud run services describe YOUR_SERVICE --region us-central1

# Increase timeout
gcloud run services update YOUR_SERVICE --region us-central1 --timeout=300

# View recent logs
gcloud run logs read YOUR_SERVICE --region us-central1 --limit=20
```

---

## 🧪 Testing Your Deployment

### 1. Test Node.js Health

```powershell
$NODE_URL = "https://node-ingestion-service-xxx.run.app"
$response = Invoke-RestMethod -Uri "$NODE_URL/health"
Write-Host "Status: $($response.status)"
Write-Host "Redis: $($response.redis)"
```

Expected output:
```json
{
  "status": "healthy",
  "redis": true,
  "timestamp": "2025-11-16T..."
}
```

### 2. Test FastAPI Endpoints

```powershell
$FASTAPI_URL = "https://fastapi-core-service-xxx.run.app"

# Open API docs
Start-Process "$FASTAPI_URL/docs"

# Test aggregation stats
Invoke-RestMethod -Uri "$FASTAPI_URL/ingest/stats/test_patient_001"
```

### 3. Test WebSocket Connection

```powershell
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c wss://node-ingestion-service-xxx.run.app
```

You should receive:
1. `cache_stats` message with Redis metrics
2. `sensor_update` messages (if simulator enabled)

### 4. Verify Redis Caching

```powershell
# Check Node.js logs for caching
gcloud run logs read node-ingestion-service --region us-central1 --limit=10

# Look for:
# [Node.js] ✓ Cached data in Redis for test_patient_001
# [Aggregation] Running aggregation for 1 user(s)...
```

### 5. Verify Write Reduction

```powershell
# Check Firestore usage
Start-Process "https://console.cloud.google.com/firestore/usage"

# Before: ~28,800 writes/day
# After: ~144 writes/day (99.5% reduction!)
```

---

## 🔧 Updating Your Deployment

### Update Environment Variables

```powershell
# Update Node.js service
gcloud run services update node-ingestion-service `
    --region us-central1 `
    --set-env-vars="AGGREGATION_INTERVAL=300000"

# Update FastAPI service
gcloud run services update fastapi-core-service `
    --region us-central1 `
    --set-env-vars="NEW_VAR=value"
```

### Redeploy After Code Changes

```powershell
# Node.js service
cd BACKEND\node_ingestion_service
gcloud run deploy node-ingestion-service --source . --region us-central1

# FastAPI service
cd BACKEND\core_api_service
gcloud run deploy fastapi-core-service --source . --region us-central1
```

### Update Secrets

```powershell
# Update Firebase credentials
gcloud secrets versions add firebase-credentials `
    --data-file=new_key.json

# Service will use new version automatically
```

---

## 🧹 Cleanup / Delete Everything

```powershell
# OPTION 1: Delete individual services
gcloud run services delete node-ingestion-service --region us-central1 --quiet
gcloud run services delete fastapi-core-service --region us-central1 --quiet
gcloud run services delete stancesense-frontend --region us-central1 --quiet

# Delete Redis
gcloud redis instances delete stancesense-redis --region us-central1 --quiet

# Delete VPC connector
gcloud compute networks vpc-access connectors delete redis-connector --region us-central1 --quiet

# Delete secrets
gcloud secrets delete firebase-credentials --quiet
gcloud secrets delete gemini-api-key --quiet

# OPTION 2: Delete entire project (DELETES EVERYTHING!)
$PROJECT_ID = gcloud config get-value project
gcloud projects delete $PROJECT_ID --quiet
```

---

## 📚 Additional Resources

- **Step-by-Step Guide**: `GCP_DEPLOYMENT_STEP_BY_STEP.md`
- **Architecture Details**: `GCP_DEPLOYMENT_GUIDE.md`
- **Redis Testing**: `REDIS_TESTING_GUIDE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Implementation Summary**: `IMPLEMENTATION_COMPLETE.md`

---

## ✅ Final Checklist

Before going live:

- [ ] All services deployed successfully
- [ ] Health checks passing
- [ ] Redis connection working
- [ ] Firestore writes reduced (check console)
- [ ] WebSocket connection tested
- [ ] API endpoints accessible
- [ ] Billing alerts configured
- [ ] Logs being captured
- [ ] Frontend loads properly
- [ ] Cost monitoring dashboard set up

---

## 🎉 Success!

Your StanceSense backend is now running on Google Cloud Platform with:

✅ **99.5% database write reduction** (Redis caching)  
✅ **Auto-scaling** (0-10 instances)  
✅ **Secure credentials** (Secret Manager)  
✅ **Production-ready** (Health checks, monitoring, logging)  
✅ **Cost-optimized** (~$41/month, free tier covers demos)

**Need help?** Check the logs or detailed guides!

---

**Quick Commands Reference:**

```powershell
# Pre-deployment check
.\pre-deployment-check.ps1

# Deploy everything
.\deploy-to-gcp.ps1

# View logs
gcloud run logs tail node-ingestion-service --region us-central1

# Update service
gcloud run services update SERVICE_NAME --set-env-vars="VAR=value"

# Check status
gcloud run services list

# Open console
Start-Process "https://console.cloud.google.com"
```

Good luck with your deployment! 🚀
