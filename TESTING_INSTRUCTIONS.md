# 🧪 StanceSense Testing Instructions
## Test Vercel Frontend with Localhost Backend

---

## 🎯 **What We're Testing**

1. ✅ Interactive test script sends sensor data every 5 seconds
2. ✅ Node.js receives data and caches in Redis (or memory fallback)
3. ✅ Data aggregates every **1 minute** and writes to Firestore
4. ✅ RAG layer analyzes Firestore data after each write
5. ✅ FastAPI processes data and broadcasts to frontend WebSocket
6. ✅ Vercel frontend displays real-time data from localhost backend

---

## 📋 **Prerequisites**

### Required:
- ✅ Python 3.8+ with `websocket-client` installed
- ✅ Node.js 16+ installed
- ✅ Redis installed (optional - system works without it)
- ✅ Firebase service account key file

### Install Dependencies:
```powershell
# Install Python WebSocket client
pip install websocket-client

# Install Node.js dependencies
cd BACKEND\node_ingestion_service
npm install

# Activate Python virtual environment
cd D:\TEAM-QWERTY
.\.venv\Scripts\Activate.ps1

# Install FastAPI dependencies
cd BACKEND\core_api_service
pip install -r requirements.txt
```

---

## 🚀 **Step-by-Step Testing Guide**

### **Step 1: Start Redis (Optional)**

**Option A - Docker (Recommended):**
```powershell
docker run -d -p 6379:6379 --name redis-test redis:6-alpine
```

**Option B - Skip Redis:**
- System will automatically use in-memory fallback
- You'll see: `[Redis] ⚠️ Redis connection failed, using in-memory fallback`

---

### **Step 2: Configure Environment Variables**

**Backend - Node.js** (`BACKEND/node_ingestion_service/.env`):
```bash
PORT=8080
REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS_CACHE=true
FASTAPI_INGEST_URL=http://127.0.0.1:8000/ingest/data
SIMULATOR=false
AGGREGATION_INTERVAL=60000
FIREBASE_TEST_TOKEN=simulator_test_token
ACTIVE_USERS=test_patient_001
APP_ID=stancesense
```

**Backend - FastAPI** (`BACKEND/core_api_service/.env`):
```bash
APP_ID=stancesense
GOOGLE_APPLICATION_CREDENTIALS=stancesense_qwerty_serviceAccountKey.json
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
PORT=8000
```

**Frontend** (Already configured in `.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000
```

---

### **Step 3: Start Backend Services**

Open **3 separate PowerShell terminals**:

**Terminal 1 - FastAPI Core Service:**
```powershell
cd D:\TEAM-QWERTY
.\.venv\Scripts\Activate.ps1
cd BACKEND\core_api_service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
Firebase / Firestore initialized on startup.
```

**Terminal 2 - Node.js Ingestion Service:**
```powershell
cd D:\TEAM-QWERTY\BACKEND\node_ingestion_service
npm start
```

**Expected Output:**
```
[Node.js] Configuration:
  Port: 8080
  FastAPI URL: http://127.0.0.1:8000/ingest/data
  Redis: localhost:6379
  Redis Caching: ENABLED
[Node.js] HTTP Health Check running on http://localhost:8080/health
[Node.js] WebSocket Ingestion Service running on ws://localhost:8080
[Aggregation] Service started - will aggregate every 1 minute
```

---

### **Step 4: Run Interactive Test Script**

**Terminal 3 - Test Script:**
```powershell
cd D:\TEAM-QWERTY\BACKEND
python test_interactive.py
```

**You'll see a menu:**
```
🏥 STANCESENSE TEST SCRIPT - Interactive Mode
======================================================================

Choose a test scenario:

  [1] Normal/Healthy Readings
      No symptoms detected - all values normal

  [2] Tremor Detected (No Fall, No Rigidity)
      Moderate tremor detected

  [3] Tremor + Rigidity Detected (No Fall)
      High tremor and rigidity - critical symptoms

  [4] FALL DETECTED - CRITICAL EVENT
      Patient has fallen - emergency alert

  [5] High Rigidity Only
      Severe muscle stiffness detected

  [6] Gait Instability + Low Battery
      Poor gait and device needs charging

  [0] Exit

👉 Enter your choice (0-6):
```

---

### **Step 5: Choose a Test Scenario**

**Example - Test Scenario 2 (Tremor):**
```
👉 Enter your choice (0-6): 2

======================================================================
🚀 STARTING TEST: Tremor Detected (No Fall, No Rigidity)
📝 Moderate tremor detected
======================================================================

⏱️  Duration: 60 seconds
📦 Frequency: 1 packet every 5 seconds (12 packets total)

Press Ctrl+C to stop early...

✅ Packet 1 sent | Elapsed: 0s | Remaining: 60s
✅ Packet 2 sent | Elapsed: 5s | Remaining: 55s
✅ Packet 3 sent | Elapsed: 10s | Remaining: 50s
...
```

The script will:
- Send 12 packets over 60 seconds (1 every 5 seconds)
- After 60 seconds, ask if you want to run another test
- Loop until you choose to exit

---

### **Step 6: Monitor the Flow**

**Watch Terminal 1 (FastAPI):**
```
INFO:     POST /ingest/data
Saved raw packet to Firestore for user simulator_user_test_123 with id abc123
AI processing complete for abc123
Saved processed data for abc123
```

**Watch Terminal 2 (Node.js):**
```
[Node.js] Received data from device: { tremor: {...}, rigidity: {...} }
[Node.js] ✓ Cached data in Redis for test_patient_001
[Node.js] ✓ Forwarded to FastAPI - Status: 202

... (after 60 seconds) ...

[Aggregation] Starting aggregation cycle...
[Aggregation] Aggregating 12 data points for test_patient_001
[Aggregation] ✓ Sent to FastAPI - Status: 200
[Aggregation] Triggering RAG analysis for test_patient_001...
[Aggregation] ✓ RAG analysis triggered - Status: 200
[Aggregation] ✓ Cycle completed
```

---

### **Step 7: Verify Vercel Frontend**

1. **Open Vercel Frontend URL** in your browser
2. **Login** with Firebase credentials
3. **Navigate to Analytics Dashboard**

**You should see:**
- ✅ Real-time sensor data updating every 5 seconds
- ✅ Tremor/Rigidity/Gait charts showing live data
- ✅ Connection status: "Connected"
- ✅ Latest readings display

**Open Browser Console (F12):**
```
WebSocket connected to backend
Updated sensor data: {timestamp: "...", tremor: {...}, ...}
Analysis present? true {is_tremor_confirmed: true, ...}
Scores: {tremor: 0.476, rigidity: 0.11, slowness: 0.95, gait: 0.13}
```

---

## 🔍 **What to Look For**

### ✅ **Success Indicators:**

1. **Node.js Terminal:**
   - `[Node.js] ✓ Cached data in Redis`
   - `[Aggregation] ✓ Sent to FastAPI` (every 60 seconds)
   - `[Aggregation] ✓ RAG analysis triggered`

2. **FastAPI Terminal:**
   - `Saved raw packet to Firestore`
   - `AI processing complete`
   - `Saved processed data`

3. **Frontend Browser:**
   - Charts update in real-time
   - Scores displayed correctly
   - No console errors
   - WebSocket status: "Connected"

4. **Firebase Console:**
   - Check `/artifacts/stancesense/users/{userId}/sensor_data/`
   - Check `/artifacts/stancesense/users/{userId}/aggregated_data/`
   - New documents created every 60 seconds

---

## 🧪 **Test Scenarios Explained**

### **Scenario 1: Normal/Healthy**
- No symptoms detected
- All values within normal range
- Should NOT trigger alerts
- **Use for:** Baseline testing

### **Scenario 2: Tremor Detected**
- Moderate tremor (amplitude: 14.3g)
- Should trigger tremor warning
- **Use for:** Testing tremor detection

### **Scenario 3: Tremor + Rigidity**
- High tremor (18.7g) + high rigidity (520mV)
- Should trigger multiple warnings
- **Use for:** Testing multi-symptom detection

### **Scenario 4: FALL DETECTED**
- Critical event - patient has fallen
- Should trigger emergency alert
- RAG should generate urgent message
- **Use for:** Testing critical event handling

### **Scenario 5: High Rigidity Only**
- Severe muscle stiffness (650mV)
- No tremor or fall
- **Use for:** Testing rigidity-specific logic

### **Scenario 6: Gait Instability + Low Battery**
- Poor gait stability
- Device needs charging
- **Use for:** Testing multiple non-critical alerts

---

## 📊 **Verify RAG Analysis**

After 60 seconds (when aggregation runs), check Firestore:

**Path:** `/artifacts/stancesense/users/test_patient_001/aggregated_data/`

**Expected Document:**
```json
{
  "timestamp": "2025-11-16T10:00:00Z",
  "period_start": "2025-11-16T09:59:00Z",
  "period_end": "2025-11-16T10:00:00Z",
  "data_points_count": 12,
  "tremor": {
    "avg": 14.3,
    "min": 14.3,
    "max": 14.3,
    "median": 14.3,
    "std_dev": 0.0,
    "critical": false,
    "sample_count": 12
  },
  "rigidity": {...},
  "gait": {...},
  "safety": {
    "fall_detected_count": 0,
    "low_battery_count": 0,
    "any_falls": false
  },
  "alerts": []
}
```

---

## 🐛 **Troubleshooting**

### **Issue: WebSocket connection failed**
```
❌ Connection failed: [Errno 10061] No connection could be made
```

**Solution:**
- Verify Node.js server is running on port 8080
- Check `http://localhost:8080/health` returns `{"status":"healthy"}`

---

### **Issue: FastAPI not receiving data**
```
[Node.js] ❌ FAILED to forward to FastAPI
```

**Solution:**
- Verify FastAPI is running on port 8000
- Check `http://localhost:8000/health` returns `{"status":"ok"}`
- Verify `FASTAPI_INGEST_URL` in Node.js `.env` is correct

---

### **Issue: Frontend not updating**
```
WebSocket error: Connection refused
```

**Solution:**
- Frontend connects to FastAPI WebSocket at `ws://localhost:8000/ws/frontend-data`
- Verify FastAPI is running
- Check browser console for WebSocket errors
- Verify `.env.local` has correct URLs

---

### **Issue: Redis connection failed**
```
[Redis] ⚠️ Redis connection failed, using in-memory fallback
```

**Solution:**
- This is OK! System works without Redis
- To use Redis: `docker run -d -p 6379:6379 redis:6-alpine`
- Verify with: `redis-cli ping` (should return "PONG")

---

### **Issue: Aggregation not running**
```
No logs from [Aggregation] service
```

**Solution:**
- Check `.env` file: `AGGREGATION_INTERVAL=60000`
- Restart Node.js service
- Should see `[Aggregation] Service started - will aggregate every 1 minute`

---

### **Issue: RAG not called**
```
[Aggregation] RAG analysis failed (non-critical)
```

**Solution:**
- Add RAG endpoint to FastAPI: `POST /analyze-patient-data`
- Configure Gemini API key in `.env`
- This is non-critical - aggregation still works

---

## 🎯 **Quick Test Checklist**

- [ ] Redis running (or skip - system auto-fallbacks)
- [ ] FastAPI running on port 8000
- [ ] Node.js running on port 8080
- [ ] Health checks pass:
  - `http://localhost:8000/health`
  - `http://localhost:8080/health`
- [ ] Test script connects successfully
- [ ] Data packets sent every 5 seconds
- [ ] Node.js logs show cached data
- [ ] Aggregation runs every 60 seconds
- [ ] Firestore documents created
- [ ] Frontend displays real-time data
- [ ] WebSocket connected in browser
- [ ] Charts update in real-time

---

## 🔄 **Typical Testing Workflow**

1. **Start backends** (FastAPI + Node.js)
2. **Run test script** → Choose scenario 2 (Tremor)
3. **Wait 60 seconds** → Watch aggregation cycle
4. **Check Firestore** → Verify aggregated data saved
5. **Open frontend** → Verify real-time updates
6. **Run test script again** → Choose scenario 4 (Fall)
7. **Check frontend** → Should show critical alert
8. **Verify RAG** → Check alert message quality

---

## 📝 **Expected Test Results**

### **After 60 seconds of testing:**
- ✅ 12 data packets sent to Node.js
- ✅ 12 packets cached in Redis (or memory)
- ✅ 1 aggregated document in Firestore
- ✅ 12 processed documents in Firestore (if critical events)
- ✅ RAG analysis triggered
- ✅ Frontend shows real-time data
- ✅ No errors in any terminal

---

## 🎊 **Success Criteria**

Your system is working correctly if:

1. ✅ Test script sends data every 5 seconds for 60 seconds
2. ✅ Node.js receives and caches data
3. ✅ Aggregation runs every 60 seconds (1 minute)
4. ✅ Firestore receives aggregated data
5. ✅ RAG analysis triggered after Firestore write
6. ✅ Frontend displays real-time sensor data
7. ✅ WebSocket connection stable
8. ✅ No connection errors

---

## 🚀 **Next Steps After Successful Test**

1. **Configure Gemini API** for RAG insights
2. **Test all 6 scenarios** to verify different data patterns
3. **Check Firebase Console** to see aggregated data
4. **Verify cost savings** - only 1 write per minute instead of 12
5. **Deploy to GCP** using `deploy-to-gcp.ps1`

---

**Happy Testing! 🎉**

For issues, check:
- Node.js logs (Terminal 2)
- FastAPI logs (Terminal 1)
- Browser console (F12)
- Firestore database
