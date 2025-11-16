# Vercel Environment Variables Setup

## ✅ WebSocket Fix Deployed
**Commit c8c4e5e** pushed successfully - Vercel is auto-deploying now!

## 🔧 Required: Add Environment Variables in Vercel Dashboard

Your frontend needs these environment variables to connect to your GCP backend:

### Steps:

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project: **stansence** (or TEAM-QWERTY)

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add These Variables (Production)**

   Click **Add New** for each:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://node-ingestion-service-315465328987.us-central1.run.app` |
   | `NEXT_PUBLIC_API_URL` | `https://fastapi-core-service-315465328987.us-central1.run.app` |
   | `NEXT_PUBLIC_NODE_SERVICE_URL` | `https://node-ingestion-service-315465328987.us-central1.run.app` |
   | `NEXT_PUBLIC_ENVIRONMENT` | `production` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `stance-sense-qwerty` |

4. **Important Settings**
   - ✅ Check **Production** environment
   - ✅ Check **Preview** environment (optional)
   - ✅ Check **Development** environment (optional)

5. **Redeploy**
   - After adding variables, click **Deployments** tab
   - Find the latest deployment (commit c8c4e5e)
   - Click **•••** menu → **Redeploy**
   - This ensures environment variables are included

---

## 🧪 Testing After Deployment

Once Vercel finishes building (2-3 minutes):

### 1. **Check WebSocket Connection**
```javascript
// Open browser DevTools Console (F12)
// You should see:
✓ "WebSocket connected to backend"
✓ "Connected to real-time data stream"

// NOT this:
✗ "WebSocket connection to 'ws://localhost:8080' failed"
```

### 2. **Verify Backend URLs**
```javascript
// In browser console, check:
console.log(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
// Should show: wss://node-ingestion-service-315465328987.us-central1.run.app

console.log(process.env.NEXT_PUBLIC_API_URL);
// Should show: https://fastapi-core-service-315465328987.us-central1.run.app
```

### 3. **Test Real-Time Data**
- Dashboard should show live sensor metrics
- Charts should animate with new data
- Tremor/Rigidity scores should update
- Alerts should appear in real-time

---

## 📊 Backend URLs Reference

**Node.js Ingestion Service (WebSocket):**
- Base URL: `https://node-ingestion-service-315465328987.us-central1.run.app`
- WebSocket: `wss://node-ingestion-service-315465328987.us-central1.run.app/ws/frontend-data`
- Health Check: `https://node-ingestion-service-315465328987.us-central1.run.app/health`

**FastAPI Core Service (REST API):**
- Base URL: `https://fastapi-core-service-315465328987.us-central1.run.app`
- Docs: `https://fastapi-core-service-315465328987.us-central1.run.app/docs`
- Health Check: `https://fastapi-core-service-315465328987.us-central1.run.app/`

---

## 🔥 Optional: Firebase Authentication

If you want to enable real Firebase authentication (currently using fallback values):

### Add These Variables to Vercel:

| Name | Where to Get Value |
|------|-------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Authentication → Settings → Authorized domains |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Storage → Files (URL without https://) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Cloud Messaging → Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings → General → App ID |

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **stance-sense-qwerty** project
3. Click ⚙️ **Project Settings**
4. Scroll to **Your apps** → Web app
5. Copy configuration values
6. Add to Vercel environment variables
7. Redeploy

---

## ✅ Verification Checklist

- [ ] All 5 required environment variables added in Vercel
- [ ] Redeployed after adding variables
- [ ] WebSocket connects to GCP (not localhost) in browser console
- [ ] Dashboard displays real-time data
- [ ] No console errors about failed connections
- [ ] Tremor/Rigidity metrics visible
- [ ] Charts animate with data updates
- [ ] Alerts display correctly

---

## 🚨 Troubleshooting

### "WebSocket still connecting to localhost"
- **Cause**: Environment variables not loaded
- **Fix**: Go to Vercel → Settings → Environment Variables → Verify added → Redeploy

### "WebSocket connection failed (403/401)"
- **Cause**: CORS or authentication issue
- **Fix**: Check Cloud Run service allows unauthenticated access:
  ```bash
  gcloud run services add-iam-policy-binding node-ingestion-service \
    --region=us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"
  ```

### "No data displayed on dashboard"
- **Cause**: Backend services not running or no data in Redis
- **Fix**: 
  1. Check service health: `https://node-ingestion-service-315465328987.us-central1.run.app/health`
  2. Check Redis connection in logs: `gcloud logging read "resource.type=cloud_run_revision" --limit=50`

---

## 🎉 Success Indicators

When everything works:

1. **Console Log**:
   ```
   WebSocket connected to backend
   Updated sensor data: {patient_id: "...", timestamp: ...}
   Scores: {tremor: 0.XX, rigidity: 0.XX, gait: 0.XX}
   ```

2. **Dashboard**:
   - Live tremor score (0-100)
   - Live rigidity score (0-100)
   - Live gait score (0-100)
   - Animated line charts
   - Recent alerts list

3. **Network Tab** (DevTools):
   - WebSocket connection to `wss://node-ingestion-service-315465328987.us-central1.run.app/ws/frontend-data`
   - Status: `101 Switching Protocols` (success)
   - Messages tab shows incoming data

---

## 📝 What Changed

**Fixed in useWebSocket.ts:**
```typescript
// BEFORE (hardcoded):
export function useWebSocket(url: string = 'ws://localhost:8000/ws/frontend-data')

// AFTER (environment variable):
export function useWebSocket(url?: string): UseWebSocketReturn {
  const defaultUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL 
    ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/frontend-data`
    : 'ws://localhost:8080/ws/frontend-data';
  
  const wsUrl = url || defaultUrl;
  // ... uses wsUrl for connection
}
```

**Impact**: Frontend now reads WebSocket URL from environment variables, allowing production deployment to connect to GCP backend instead of localhost.

---

## 🎯 Next Steps After Setup

1. **Test end-to-end flow**:
   - Hardware → Node.js → Redis → FastAPI → Firestore
   - Frontend WebSocket → Live dashboard updates

2. **Monitor Cloud Run logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=20
   ```

3. **Check Redis cache hits**:
   ```bash
   gcloud redis instances describe stancesense-redis --region=us-central1
   ```

4. **Optional: Set up custom domain** in Vercel

5. **Optional: Enable Firebase Auth** (see above)

---

**Your system is ready for production! 🚀**
