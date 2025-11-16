# Redis Caching + Aggregation Testing Guide

## 🎯 Testing Strategy

This guide walks you through testing the Redis caching system locally before deploying to GCP.

## 📋 Prerequisites

- Node.js 16+ installed
- Redis installed locally
- FastAPI service running (optional for full test)

## 🚀 Quick Start (Automated)

```bash
chmod +x quick-test-redis.sh
./quick-test-redis.sh
```

## 📝 Manual Testing Steps

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows (Docker):**
```powershell
docker run -d --name redis-test -p 6379:6379 redis:6-alpine
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

### 3. Install Node.js Dependencies

```bash
cd BACKEND/node_ingestion_service
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS_CACHE=true
SIMULATOR=true
ACTIVE_USERS=test_patient_001
AGGREGATION_INTERVAL=60000  # 1 minute for testing (10 min in production)
```

### 5. Start Node.js Service

```bash
npm start
```

**Expected Output:**
```
[Node.js] HTTP Health Check running on http://localhost:8080/health
[Node.js] WebSocket Ingestion Service running on ws://localhost:8080
[Node.js] Simulator mode: ENABLED ✓
[Node.js] Redis caching: ENABLED ✓
[Redis] ✓ Connected to Redis at localhost:6379
[Aggregation] ✓ Aggregation service started (interval: 60000ms)
[Node.js] Starting hardware simulator...
[Node.js] ✓ Cached data in Redis for test_patient_001
```

## 🔍 Monitoring Redis Cache

### View Cached Keys
```bash
redis-cli KEYS 'patient:*'
```

**Expected Output:**
```
1) "patient:test_patient_001:recent"
2) "patient:test_patient_001:aggregate_buffer"
3) "patient:test_patient_001:latest"
```

### View Recent Data (last 5 points)
```bash
redis-cli LRANGE patient:test_patient_001:recent 0 4
```

### View Latest Reading
```bash
redis-cli GET patient:test_patient_001:latest
```

### View Aggregation Buffer
```bash
redis-cli LRANGE patient:test_patient_001:aggregate_buffer 0 -1
```

### Monitor Real-Time Updates
```bash
redis-cli MONITOR
```

### Check Memory Usage
```bash
redis-cli INFO memory
```

## 🧪 Testing Scenarios

### Test 1: Data Caching (Every 3 seconds)

1. Start Node.js service
2. Watch console logs: `[Node.js] ✓ Cached data in Redis`
3. Check Redis keys grow: `redis-cli LLEN patient:test_patient_001:recent`
4. Verify max 100 points: `redis-cli LLEN patient:test_patient_001:recent` (should cap at 100)

**Success Criteria:**
- ✓ Console shows caching every 3 seconds
- ✓ Redis keys exist
- ✓ Recent data list auto-trims to 100 entries

### Test 2: Aggregation Service (Every 1 minute)

1. Wait 60 seconds after starting service
2. Watch for: `[Aggregation] Running aggregation for 1 user(s)...`
3. Check console: `[Aggregation] ✓ Aggregated 20 data points`
4. Check buffer cleared: `redis-cli LLEN patient:test_patient_001:aggregate_buffer` (should be 0)

**Success Criteria:**
- ✓ Aggregation runs every 60 seconds
- ✓ Console shows data point count
- ✓ Buffer clears after aggregation
- ✓ Aggregated data sent to FastAPI (or logged if FastAPI not running)

### Test 3: Critical Event Detection

1. Modify simulator to generate critical event:
   - Edit `simulator.js`: Set `fallDetected = true` or `tremor.amplitude_g = 20`
2. Watch for: `[Node.js] ⚠️ CRITICAL EVENT - forwarding to FastAPI immediately`
3. Verify data forwarded: Check FastAPI logs or Firestore

**Success Criteria:**
- ✓ Critical events detected
- ✓ Immediate forwarding to FastAPI
- ✓ Still cached in Redis

### Test 4: Redis Fallback Mode

1. Stop Redis: `brew services stop redis` or `docker stop redis-test`
2. Restart Node.js service
3. Watch for: `[Redis] ⚠️ Redis connection failed, using in-memory fallback`

**Success Criteria:**
- ✓ Service continues running
- ✓ In-memory Map used instead of Redis
- ✓ No crash or errors

### Test 5: WebSocket Client Connection

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080
```

**Expected Messages:**
1. `cache_stats` message on connection
2. `sensor_update` messages every 3 seconds

**Success Criteria:**
- ✓ Connection established
- ✓ Receives cache stats
- ✓ Receives real-time sensor updates

## 📊 Performance Metrics

### Before Redis Caching:
- Firestore writes: 28,800/day per patient
- Dashboard updates: Every 3 seconds via Firestore queries
- Cost: High (read + write operations)

### After Redis Caching:
- Firestore writes: 144/day per patient (99.5% reduction)
- Dashboard updates: Every 3 seconds via WebSocket from Redis
- Cost: Low (minimal Firestore writes)

### Verify Write Reduction:

```bash
# Count aggregation runs in 1 hour
# Expected: 60 aggregations (1 per minute in test mode)
# Production: 6 aggregations (1 per 10 minutes)

# Check Firestore Console
# Navigate to: /artifacts/stancesense/users/test_patient_001/aggregated_data/
# Count documents created in last hour
# Expected: 60 documents (test mode) or 6 documents (production)
```

## 🐛 Troubleshooting

### Issue: Redis connection timeout

**Symptoms:**
```
[Redis] ❌ Redis connection error: connect ETIMEDOUT
```

**Solutions:**
1. Check Redis is running: `redis-cli ping`
2. Verify port: `netstat -an | grep 6379` (Mac/Linux) or `netstat -an | findstr 6379` (Windows)
3. Check firewall blocking port 6379
4. Verify REDIS_HOST in .env

### Issue: Aggregation not running

**Symptoms:**
- No aggregation logs after 60 seconds
- Buffer keeps growing

**Solutions:**
1. Check AGGREGATION_INTERVAL in .env
2. Verify ACTIVE_USERS includes test_patient_001
3. Check Node.js console for errors
4. Restart service

### Issue: Critical events not forwarding

**Symptoms:**
- `⚠️ CRITICAL EVENT` not appearing
- No immediate FastAPI calls

**Solutions:**
1. Check `isCriticalEvent()` thresholds in index.js
2. Verify simulator generates critical values
3. Check FASTAPI_INGEST_URL is correct
4. Test FastAPI endpoint separately

### Issue: Memory leak

**Symptoms:**
- Redis memory keeps growing
- Node.js process using excessive RAM

**Solutions:**
1. Check TTL on keys: `redis-cli TTL patient:test_patient_001:recent` (should be 600)
2. Verify LTRIM happening: `redis-cli LLEN patient:test_patient_001:recent` (should max at 100)
3. Restart Redis: `brew services restart redis`
4. Monitor with: `redis-cli INFO memory`

## 🔄 Reset Testing Environment

```bash
# Clear all Redis data
redis-cli FLUSHALL

# Restart Node.js service
# Press Ctrl+C, then npm start

# Clear Firestore (if needed)
# Go to Firestore Console → Delete collection
```

## ✅ Test Completion Checklist

Before deploying to GCP, verify:

- [ ] Redis caching working locally
- [ ] Aggregation service runs every 60 seconds (test) or 600 seconds (prod)
- [ ] Buffer clears after aggregation
- [ ] Critical events forwarded immediately
- [ ] WebSocket broadcasts sensor updates
- [ ] In-memory fallback works when Redis unavailable
- [ ] No memory leaks after 10+ minutes
- [ ] Cache stats returned on WebSocket connection
- [ ] Recent data auto-trims to 100 entries
- [ ] Latest reading has 60s TTL

## 📈 Expected Performance

### Local Testing (1 patient, 1-minute aggregation):
- Redis memory: ~10-20 MB
- Node.js RAM: ~50-100 MB
- CPU usage: <5%
- Firestore writes: 60/hour → 1/minute

### Production (10 patients, 10-minute aggregation):
- Redis memory: ~100-200 MB
- Node.js RAM: ~200-300 MB
- CPU usage: <10%
- Firestore writes: 1,440/day → 144/day per patient

## 🚀 Ready for Production?

If all tests pass:

1. Update `.env` for production:
   ```bash
   AGGREGATION_INTERVAL=600000  # 10 minutes
   SIMULATOR=false
   ACTIVE_USERS=patient_001,patient_002,...
   ```

2. Deploy to GCP:
   ```bash
   ./deploy-to-gcp.sh
   ```

3. Monitor GCP logs:
   ```bash
   gcloud run logs tail node-ingestion-service --region us-central1
   ```

---

**All tests passing?** Proceed to `GCP_DEPLOYMENT_GUIDE.md` for cloud deployment! 🎉
