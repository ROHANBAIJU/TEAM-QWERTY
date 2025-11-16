# StanceSense - GCP Deployment Guide with Redis Caching

## 🚀 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Platform (GCP)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Next.js Frontend│◄───────┤  Cloud Run       │         │
│  │  (Port 3000)     │  HTTPS │  Load Balancer   │         │
│  └──────────────────┘        └──────────────────┘         │
│           │                                                 │
│           │ WebSocket (wss://)                             │
│           ▼                                                 │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Node.js Service │◄───────┤  Memorystore     │         │
│  │  WebSocket Server│  Cache │  (Redis 6.x)     │         │
│  │  (Port 8080)     │        │  1GB RAM         │         │
│  └──────────────────┘        └──────────────────┘         │
│           │                           ▲                     │
│           │ HTTP                      │                     │
│           ▼                           │ Cache               │
│  ┌──────────────────┐                │                     │
│  │  FastAPI Service │                │                     │
│  │  AI + RAG        │────────────────┘                     │
│  │  (Port 8000)     │                                       │
│  └──────────────────┘                                       │
│           │                                                 │
│           │ Native                                          │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │    Firestore     │                                       │
│  │  (NoSQL DB)      │                                       │
│  └──────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Real-Time Flow (3-second intervals):
```
Sensors → Node.js → Redis (5 min cache) → WebSocket → Frontend
                         ↓
                   Buffer for aggregation
```

### Periodic Storage (10-minute intervals):
```
Redis Buffer → Aggregation Service → FastAPI → Firestore
    (200 data points)        ↓            ↓       (1 document)
                      Calculate stats   Save alerts
```

### Storage Reduction:
- **Before**: 28,800 writes/day per patient
- **After**: 144 writes/day per patient
- **Savings**: 99.5% reduction 🎉

## 🛠️ Prerequisites

1. **Google Cloud Account**
   - Create account at: https://cloud.google.com/
   - $300 free credit for new users

2. **Install gcloud CLI**
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Windows
   # Download from: https://cloud.google.com/sdk/docs/install
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

3. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## 📝 Step-by-Step Deployment

### 1. Create GCP Project

```bash
# Create new project
gcloud projects create stancesense-prod --name="StanceSense Production"

# Set as default
gcloud config set project stancesense-prod

# Enable billing (required for Cloud Run)
# Do this in GCP Console: https://console.cloud.google.com/billing
```

### 2. Enable Required APIs

```bash
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    firestore.googleapis.com \
    redis.googleapis.com \
    vpcaccess.googleapis.com \
    secretmanager.googleapis.com
```

### 3. Create VPC Connector (for Redis access)

```bash
gcloud compute networks vpc-access connectors create redis-connector \
    --region=us-central1 \
    --range=10.8.0.0/28
```

### 4. Create Redis Instance (Memorystore)

```bash
# Create 1GB Redis instance
gcloud redis instances create stancesense-redis \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_6_x \
    --tier=basic

# Wait for it to be ready (takes 3-5 minutes)
gcloud redis instances describe stancesense-redis \
    --region=us-central1
```

### 5. Store Firebase Credentials in Secret Manager

```bash
cd BACKEND/core_api_service

gcloud secrets create firebase-credentials \
    --data-file=stancesense_qwerty_serviceAccountKey.json
```

### 6. Deploy Services

#### Option A: Automated Script (Recommended)
```bash
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh
```

#### Option B: Manual Deployment

**Deploy Node.js Service:**
```bash
cd BACKEND/node_ingestion_service

# Get Redis IP
REDIS_HOST=$(gcloud redis instances describe stancesense-redis \
    --region=us-central1 --format="value(host)")

gcloud run deploy node-ingestion-service \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="REDIS_HOST=$REDIS_HOST,USE_REDIS_CACHE=true" \
    --vpc-connector=redis-connector \
    --port=8080 \
    --memory=512Mi
```

**Deploy FastAPI Service:**
```bash
cd ../core_api_service

gcloud run deploy fastapi-core-service \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets=GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials:latest \
    --port=8000 \
    --memory=1Gi
```

**Deploy Frontend:**
```bash
cd ../../FRONTEND/stansence

# Create .env.production with backend URLs
cat > .env.production << EOF
NEXT_PUBLIC_FASTAPI_URL=https://fastapi-core-service-xxx.run.app
NEXT_PUBLIC_WS_URL=wss://node-ingestion-service-xxx.run.app
EOF

gcloud run deploy stancesense-frontend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port=3000 \
    --memory=1Gi
```

## 🔧 Local Development with Redis

### Install Redis Locally

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
```bash
# Use Docker
docker run -d -p 6379:6379 redis:6-alpine
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Install Node.js Dependencies

```bash
cd BACKEND/node_ingestion_service
npm install
```

### Run with Redis Caching

```bash
# Create .env file
cp .env.example .env

# Edit .env
REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS_CACHE=true
SIMULATOR=true

# Start service
npm start
```

## 📈 Monitoring & Debugging

### View Logs
```bash
# Node.js service
gcloud run logs tail node-ingestion-service --region us-central1

# FastAPI service
gcloud run logs tail fastapi-core-service --region us-central1

# Frontend
gcloud run logs tail stancesense-frontend --region us-central1
```

### Check Redis Stats
```bash
# Connect to Redis via bastion host
gcloud redis instances describe stancesense-redis \
    --region=us-central1

# View metrics in GCP Console
open https://console.cloud.google.com/memorystore/redis
```

### Monitor Firestore Usage
```bash
# View Firestore usage in console
open https://console.cloud.google.com/firestore/usage
```

## 💰 Cost Breakdown

### Monthly Costs (Demo/Light Usage):

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run (Node.js) | 1M requests | $0 (free tier) |
| Cloud Run (FastAPI) | 1M requests | $0 (free tier) |
| Cloud Run (Frontend) | 1M requests | $0 (free tier) |
| Memorystore Redis (1GB) | 24/7 | ~$40 |
| Firestore | 144 writes/day | ~$1 |
| **Total** | | **~$41/month** |

### Cost Optimization Tips:

1. **Use Free Tier**
   - Cloud Run: 2M requests/month free
   - Firestore: 20k writes/day free

2. **Scale to Zero** (Frontend)
   ```bash
   gcloud run services update stancesense-frontend \
       --region us-central1 \
       --min-instances=0
   ```

3. **Reduce Redis Size** (for demo)
   ```bash
   # Use 0.5GB instead of 1GB
   gcloud redis instances update stancesense-redis \
       --size=0.5 \
       --region=us-central1
   ```

4. **Shut Down During Inactivity**
   ```bash
   # Stop Redis when not in use
   gcloud redis instances update stancesense-redis \
       --maintenance-window-day=MONDAY \
       --region=us-central1
   ```

## 🔒 Security Best Practices

1. **Use IAM Roles**
   ```bash
   # Restrict service access
   gcloud run services remove-iam-policy-binding node-ingestion-service \
       --member="allUsers" \
       --role="roles/run.invoker" \
       --region=us-central1
   ```

2. **Enable Secret Manager**
   - All credentials stored in Secret Manager
   - Auto-rotation enabled

3. **VPC Connector**
   - Redis only accessible via VPC
   - No public IP exposure

## 🧪 Testing Deployment

```bash
# Test Node.js WebSocket
wscat -c wss://node-ingestion-service-xxx.run.app

# Test FastAPI
curl https://fastapi-core-service-xxx.run.app/health

# Test Frontend
curl https://stancesense-frontend-xxx.run.app
```

## 🚨 Troubleshooting

### Redis Connection Issues
```bash
# Check VPC connector
gcloud compute networks vpc-access connectors describe redis-connector \
    --region=us-central1

# Test from Cloud Shell
gcloud redis instances describe stancesense-redis --region=us-central1
```

### Cloud Run Build Failures
```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### High Costs
```bash
# Check current usage
gcloud run services describe node-ingestion-service \
    --region=us-central1 \
    --format="value(status.traffic)"
```

## 📚 Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Memorystore Redis](https://cloud.google.com/memorystore/docs/redis)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)

## ✅ Post-Deployment Checklist

- [ ] All services deployed successfully
- [ ] Redis connection working
- [ ] Firestore writes reduced to 144/day
- [ ] Frontend loads properly
- [ ] WebSocket connection established
- [ ] Real-time data updates working
- [ ] Aggregation service running (check logs every 10 min)
- [ ] Cost monitoring dashboard set up

---

**Need Help?** Check logs first, then refer to GCP documentation or Stack Overflow!
