# 🚀 Vercel Frontend Deployment Guide

## ✅ Backend Status

### Node.js Ingestion Service
- **URL**: https://node-ingestion-service-315465328987.us-central1.run.app
- **Status**: ✅ HEALTHY
- **Redis**: ✅ Connected to Memorystore
- **Health**: `/health` endpoint responding

### FastAPI Core Service
- **URL**: https://fastapi-core-service-315465328987.us-central1.run.app
- **Status**: ✅ RUNNING
- **Docs**: https://fastapi-core-service-315465328987.us-central1.run.app/docs
- **Note**: Firestore will initialize on first data write

### Infrastructure
- **Redis**: 10.212.181.139:6379 (1GB Memorystore)
- **VPC**: redis-connector (READY)
- **Region**: us-central1
- **Project**: stance-sense-qwerty

---

## 📋 Vercel Deployment Steps

### 1️⃣ Prepare Frontend

Navigate to your frontend directory:
```bash
cd D:\TEAM-QWERTY\FRONTEND\stansence
```

### 2️⃣ Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 3️⃣ Login to Vercel
```bash
vercel login
```

### 4️⃣ Configure Environment Variables

Create `.env.production` with backend URLs (already created):
```env
NEXT_PUBLIC_API_URL=https://fastapi-core-service-315465328987.us-central1.run.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://node-ingestion-service-315465328987.us-central1.run.app
NEXT_PUBLIC_NODE_SERVICE_URL=https://node-ingestion-service-315465328987.us-central1.run.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### 5️⃣ Deploy to Vercel

**Option A: Deploy via CLI**
```bash
# Deploy to production
vercel --prod

# Or deploy with specific project name
vercel --prod --name stancesense
```

**Option B: Deploy via Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository: `ROHANBAIJU/TEAM-QWERTY`
3. Set Root Directory: `FRONTEND/stansence`
4. Framework Preset: Next.js
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WEBSOCKET_URL`
   - `NEXT_PUBLIC_NODE_SERVICE_URL`
   - `NEXT_PUBLIC_ENVIRONMENT`
6. Click "Deploy"

### 6️⃣ Add Environment Variables in Vercel Dashboard

After deployment, add these in Vercel Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://fastapi-core-service-315465328987.us-central1.run.app` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://node-ingestion-service-315465328987.us-central1.run.app` |
| `NEXT_PUBLIC_NODE_SERVICE_URL` | `https://node-ingestion-service-315465328987.us-central1.run.app` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |

---

## 🧪 Testing Your Deployment

### Test Backend Endpoints

**Node.js Health Check:**
```bash
curl https://node-ingestion-service-315465328987.us-central1.run.app/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

**FastAPI Health Check:**
```bash
curl https://fastapi-core-service-315465328987.us-central1.run.app/health
```
Expected: `{"status":"ok","firestore":true}`

**FastAPI Interactive Docs:**
Open in browser: https://fastapi-core-service-315465328987.us-central1.run.app/docs

### Test WebSocket Connection

Test WebSocket from frontend:
```javascript
const ws = new WebSocket('wss://node-ingestion-service-315465328987.us-central1.run.app/ws/frontend-data');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (event) => console.log('Data:', event.data);
```

---

## 🔧 CORS Configuration (if needed)

If you encounter CORS issues, update FastAPI CORS settings in `BACKEND/core_api_service/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-app.vercel.app",  # Add your Vercel URL
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy FastAPI:
```bash
cd D:\TEAM-QWERTY\BACKEND\core_api_service
gcloud run deploy fastapi-core-service --source . --region us-central1
```

---

## 📊 Monitoring & Logs

### View Cloud Run Logs
```bash
# FastAPI logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fastapi-core-service" --limit 50

# Node.js logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=node-ingestion-service" --limit 50
```

### Monitor in GCP Console
- Cloud Run Services: https://console.cloud.google.com/run?project=stance-sense-qwerty
- Firestore: https://console.cloud.google.com/firestore?project=stance-sense-qwerty
- Redis: https://console.cloud.google.com/memorystore/redis?project=stance-sense-qwerty

---

## 🎯 Quick Test Script

Test complete backend flow:

```bash
# Test Node.js health
curl https://node-ingestion-service-315465328987.us-central1.run.app/health

# Test FastAPI health
curl https://fastapi-core-service-315465328987.us-central1.run.app/health

# Test data ingestion (simulate sensor data)
curl -X POST https://fastapi-core-service-315465328987.us-central1.run.app/ingest/data \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_patient_001",
    "timestamp": "2025-11-16T00:00:00Z",
    "tremor": 45.5,
    "rigidity": 38.2,
    "gait": 62.8,
    "balance": 55.0
  }'
```

---

## 🚀 Next Steps

1. ✅ Backend deployed and running
2. ⏳ Deploy frontend to Vercel
3. ⏳ Test complete data flow (Frontend → Node.js → Redis → FastAPI → Firestore)
4. ⏳ Configure Firebase Auth (if needed)
5. ⏳ Set up monitoring alerts
6. ⏳ Performance testing

---

## 📝 Important URLs

| Service | URL |
|---------|-----|
| FastAPI (Main Backend) | https://fastapi-core-service-315465328987.us-central1.run.app |
| FastAPI Docs | https://fastapi-core-service-315465328987.us-central1.run.app/docs |
| Node.js (WebSocket) | https://node-ingestion-service-315465328987.us-central1.run.app |
| GCP Console | https://console.cloud.google.com/run?project=stance-sense-qwerty |
| Firestore | https://console.cloud.google.com/firestore?project=stance-sense-qwerty |

---

## 🆘 Troubleshooting

### Issue: Frontend can't connect to backend
- **Solution**: Check CORS configuration, add Vercel domain to allowed origins

### Issue: WebSocket connection fails
- **Solution**: Ensure using `wss://` (not `ws://`) for secure connections

### Issue: Firestore errors
- **Solution**: Check service account permissions and Secret Manager access

### Issue: Redis connection fails
- **Solution**: Verify VPC connector is attached and Redis instance is running

---

## 💡 Tips for Hackathon Demo

1. Keep GCP Console open to show real-time metrics
2. Open Firestore console to show data flowing in
3. Use FastAPI `/docs` to demonstrate API endpoints
4. Monitor Cloud Run logs during demo for debugging
5. Have backup plan: localhost deployment ready if needed

---

**Status**: ✅ Backend fully deployed and ready for Vercel integration!
