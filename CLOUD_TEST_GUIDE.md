# ☁️ Cloud System Test Guide

## 🎯 What We're Testing
Full pipeline: **Test Script → GCP Node.js → Firestore (1-min) → RAG Analysis → Vercel Frontend**

---

## 📋 Prerequisites

1. **Install websocket-client**:
   ```bash
   pip install websocket-client
   ```

2. **Verify GCP Services Running**:
   ```bash
   gcloud run services describe node-ingestion-service --region=us-central1
   gcloud run services describe fastapi-core-service --region=us-central1
   ```

3. **Open Vercel Frontend**:
   - Open your Vercel site in browser
   - Navigate to `/analytics` page
   - Open DevTools Console (F12)

---

## 🚀 Run Cloud Test

```bash
cd D:\TEAM-QWERTY\BACKEND
python test_cloud_system.py
```

### Test Menu Options:
1. **✅ All Normal** - No symptoms
2. **🤝 Tremor Detected** - Only tremor
3. **💪 Rigidity Detected** - Only rigidity
4. **🚨 Fall Detected** - Only fall
5. **⚠️ Tremor + Rigidity** - Both symptoms
6. **🆘 All Symptoms** - Critical (tremor + rigidity + fall)
7. **🔄 Moderate Tremor + Fall** - Mixed symptoms

### What Happens:
- Select a scenario (1-7)
- Script sends **12 packets over 60 seconds** (5-second intervals)
- After 60s, returns to menu for next test

---

## 🔍 What to Watch

### 1. **Frontend (Vercel Analytics Dashboard)**
- ✅ Real-time sensor cards update every 3s
- ✅ Live chart shows tremor/rigidity/gait lines
- ✅ Overall score updates
- ✅ AI Clinical Summary changes based on data
- ✅ Alerts appear if symptoms detected

### 2. **GCP Logs (Node.js)**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=node-ingestion-service" --limit=50 --format=json
```

**Look for**:
- `[WebSocket] New hardware connection from test_device_001`
- `[WebSocket] Received data from test_device_001`
- `[Aggregation] Starting aggregation cycle...` (every 1 minute)
- `[Aggregation] Aggregating X data points`
- `[Aggregation] ✓ Sent to FastAPI`
- `[Aggregation] Triggering RAG analysis...`
- `[Aggregation] ✓ RAG analysis triggered`

### 3. **Firestore Console**
- Open: https://console.firebase.google.com/project/stance-sense-qwerty/firestore
- Collection: `sensor_data`
- **Check**: New documents every 1 minute (was 10 minutes before)

### 4. **GCP Logs (FastAPI RAG)**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fastapi-core-service" --limit=30 --format=json
```

**Look for**:
- RAG endpoint hits: `POST /analyze-patient-data`
- Patient data analysis
- (Gemini integration comes later)

---

## 🎯 Success Criteria

✅ **Test Script**: Connects to `wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/hardware-stream`
✅ **WebSocket**: Sends 12 packets successfully
✅ **Node.js**: Receives and processes data
✅ **Firestore**: Aggregates written every 1 minute
✅ **RAG**: Endpoint called after each Firestore write
✅ **Frontend**: Real-time updates visible on dashboard

---

## 🐛 Troubleshooting

### WebSocket Connection Fails
```bash
# Check if Node.js service is running
gcloud run services describe node-ingestion-service --region=us-central1

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=node-ingestion-service" --limit=20
```

### No Data on Frontend
- Check WebSocket URL in `.env.production`
- Verify Vercel deployment completed
- Check browser console for WebSocket errors

### Firestore Not Updating
- Wait 1 minute for first aggregation
- Check Node.js logs for aggregation service
- Verify `USE_REDIS_CACHE=false` (we're using in-memory)

### RAG Not Triggered
- Check FastAPI is running
- Verify `FASTAPI_INGEST_URL` environment variable
- RAG failures are non-blocking (check logs)

---

## 📊 Expected Timeline

| Time | Event |
|------|-------|
| 0:00 | Start test script, select scenario |
| 0:00-0:60 | Send 12 packets (every 5s) |
| 0:03 | Frontend shows first real-time update |
| 1:00 | **First Firestore aggregation** |
| 1:00 | **RAG analysis triggered** |
| 1:00 | Test asks for next scenario |
| 2:00 | **Second Firestore aggregation** (if still sending) |
| ... | Repeat |

---

## 🎮 Testing Scenarios

### Test 1: Normal Baseline
- Select: **Option 1 (All Normal)**
- Verify: Green indicators, low scores, no alerts

### Test 2: Tremor Detection
- Select: **Option 2 (Tremor Only)**
- Verify: Tremor card shows red, amplitude increases, alerts appear

### Test 3: Critical Situation
- Select: **Option 6 (All Symptoms)**
- Verify: Multiple red indicators, fall alert, high overall score

### Test 4: Recovery Pattern
- Send Option 6 for 60s → Option 1 for 60s
- Verify: Scores gradually decrease on frontend

---

## 🚀 Next Steps After Testing

1. ✅ Verify all data flowing correctly
2. ✅ Confirm 1-minute aggregation working
3. ✅ Check RAG endpoint being called
4. 🔄 Integrate Gemini AI into RAG layer (Phase 2)
5. 🔄 Add actual AI insights generation
6. 🔄 Display RAG outputs on frontend

---

## 📞 Support

If issues persist:
1. Check all GCP logs
2. Verify environment variables
3. Confirm Firestore rules allow writes
4. Test WebSocket with `test-cloud-websocket.js`

**Current System Status:**
- Node.js: ✅ Deployed (revision 00006)
- FastAPI: ✅ Running
- Firestore: ✅ Configured
- Frontend: ✅ Deployed on Vercel
- Cost: 💰 ~$0-5/month (free tier)
