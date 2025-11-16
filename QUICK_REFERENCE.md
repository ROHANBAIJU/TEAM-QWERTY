# 🚀 StanceSense Quick Reference Card

## 📊 System Overview

```
Sensors (3s) → Node.js → Redis (5min cache) → WebSocket → Frontend
                    ↓
              Aggregation (10min)
                    ↓
                FastAPI → Firestore (99.5% reduction)
```

## ⚡ Quick Commands

### Local Testing
```bash
# Mac/Linux
./quick-test-redis.sh

# Windows
.\quick-test-redis.ps1
```

### Start Services
```bash
# Node.js (port 8080)
cd BACKEND/node_ingestion_service
npm start

# FastAPI (port 8000)
cd BACKEND/core_api_service
uvicorn app.main:app --reload

# Frontend (port 3000)
cd FRONTEND/stansence
npm run dev
```

### Redis Commands
```bash
# Check if running
redis-cli ping

# View all keys
redis-cli KEYS 'patient:*'

# View recent data (last 5)
redis-cli LRANGE patient:test_patient_001:recent 0 4

# View latest reading
redis-cli GET patient:test_patient_001:latest

# Monitor real-time
redis-cli MONITOR

# Memory usage
redis-cli INFO memory

# Clear all data
redis-cli FLUSHALL
```

### GCP Deployment
```bash
# One-command deploy
./deploy-to-gcp.sh

# View logs
gcloud run logs tail node-ingestion-service --region us-central1
gcloud run logs tail fastapi-core-service --region us-central1

# Get service URLs
gcloud run services list --region us-central1
```

## 🔧 Configuration (.env)

```bash
# Redis
REDIS_HOST=localhost              # Use Memorystore IP in GCP
REDIS_PORT=6379
USE_REDIS_CACHE=true

# Services
FASTAPI_INGEST_URL=http://127.0.0.1:8000/ingest/data
SIMULATOR=true                    # false for real hardware
APP_ID=stancesense

# Users
ACTIVE_USERS=test_patient_001,test_patient_002

# Aggregation
AGGREGATION_INTERVAL=600000       # 10 minutes (60000 for testing)
```

## 📈 Key Metrics

### Storage Efficiency
- **Before**: 28,800 writes/day per patient
- **After**: 144 writes/day per patient  
- **Reduction**: 99.5% 🎉

### Cache Performance
- **Recent data**: Last 100 points (5 minutes)
- **Latest reading**: 60 second TTL
- **Aggregation buffer**: Cleared every 10 minutes
- **Memory usage**: ~10-20 MB per patient

### Critical Event Thresholds
- **Fall detected**: Immediate forwarding
- **Battery low**: Immediate forwarding
- **Tremor amplitude**: >15 (immediate)
- **Rigidity force**: >500 (immediate)
- **Gait instability**: >2.5 (immediate)

## 🎯 Testing Checklist

- [ ] Redis running (`redis-cli ping` returns `PONG`)
- [ ] Node.js starts without errors
- [ ] Console shows: `[Redis] ✓ Connected`
- [ ] Console shows: `[Aggregation] ✓ Aggregation service started`
- [ ] Data cached every 3 seconds: `[Node.js] ✓ Cached data`
- [ ] Aggregation runs every 10 min: `[Aggregation] Running aggregation`
- [ ] WebSocket clients receive `cache_stats` message
- [ ] Redis keys exist: `redis-cli KEYS 'patient:*'`
- [ ] Recent data auto-trims to 100: `redis-cli LLEN patient:*:recent`
- [ ] Health check works: `curl http://localhost:8080/health`

## 🐛 Common Issues

### "Redis connection failed"
```bash
# Check Redis is running
redis-cli ping

# Start Redis
brew services start redis           # Mac
docker start redis-stancesense      # Windows
```

### "Aggregation not running"
```bash
# Check environment
cat .env | grep AGGREGATION_INTERVAL

# Should be 60000 (test) or 600000 (prod)
```

### "Module not found: ioredis"
```bash
npm install
```

### "Port 8080 already in use"
```bash
# Find process
lsof -i :8080              # Mac/Linux
netstat -ano | findstr 8080  # Windows

# Kill process
kill -9 <PID>              # Mac/Linux
taskkill /PID <PID> /F      # Windows
```

## 💰 GCP Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run (3 services) | Free tier | $0 |
| Memorystore (1GB Redis) | 24/7 | ~$40 |
| Firestore | 144 writes/day | ~$1 |
| **Total** | | **~$41** |

### Cost Optimization
```bash
# Reduce Redis size
gcloud redis instances update stancesense-redis --size=0.5

# Scale to zero (frontend)
gcloud run services update stancesense-frontend --min-instances=0

# Monitor costs
gcloud billing accounts list
```

## 📊 Monitoring

### Real-time Logs
```bash
# Node.js
tail -f BACKEND/node_ingestion_service/logs/*.log

# GCP
gcloud run logs tail node-ingestion-service --region us-central1 --follow
```

### Redis Stats Endpoint
```javascript
// WebSocket message on connection
{
  "type": "cache_stats",
  "stats": {
    "connected": true,
    "recent_count": 20,
    "buffer_count": 18,
    "has_latest": true
  }
}
```

### Aggregation Stats
```bash
# Call FastAPI endpoint
curl http://localhost:8000/ingest/stats/test_patient_001
```

## 🔗 Important URLs

### Local Development
- **Node.js WebSocket**: `ws://localhost:8080`
- **Node.js Health**: `http://localhost:8080/health`
- **FastAPI**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **Redis**: `localhost:6379`

### GCP Production
- **Frontend**: `https://stancesense-frontend-xxx.run.app`
- **FastAPI**: `https://fastapi-core-service-xxx.run.app`
- **Node.js**: `wss://node-ingestion-service-xxx.run.app`
- **Memorystore**: Internal VPC IP (private)

## 📚 Documentation Files

1. **IMPLEMENTATION_COMPLETE.md** - Complete feature summary
2. **GCP_DEPLOYMENT_GUIDE.md** - GCP deployment walkthrough
3. **REDIS_TESTING_GUIDE.md** - Local testing procedures
4. **QUICK_REFERENCE.md** - This file!

## 🎊 System Status

✅ All 8 frontend screens redesigned  
✅ Redis caching implemented  
✅ Aggregation service running  
✅ 99.5% write reduction achieved  
✅ GCP deployment files created  
✅ Testing scripts provided  
✅ Documentation complete  

**System ready for hackathon demo and production deployment!** 🚀

---

**Questions?** Check the detailed guides or run quick tests!
