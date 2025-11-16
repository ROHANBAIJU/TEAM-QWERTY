# 🚨 CRITICAL: CORRECT BACKEND URLS

## ✅ VERIFIED CLOUD RUN SERVICE URLS

Your actual Cloud Run URLs are **DIFFERENT** from what was in the env file:

### ✅ CORRECT URLs (Use These):
```
Node.js Service: https://node-ingestion-service-5chvuuiaeq-uc.a.run.app
FastAPI Service: https://fastapi-core-service-5chvuuiaeq-uc.a.run.app
```

### ❌ OLD WRONG URLs (Don't use these):
```
Node.js: https://node-ingestion-service-315465328987.us-central1.run.app
FastAPI: https://fastapi-core-service-315465328987.us-central1.run.app
```

---

## 🔧 TWO WAYS TO FIX

### OPTION 1: Automatic (Recommended) ⚡

Run this command in PowerShell:
```powershell
cd D:\TEAM-QWERTY
.\setup-vercel-env.ps1
```

This will:
- ✅ Install Vercel CLI if needed
- ✅ Set all environment variables automatically
- ✅ Trigger redeployment with correct URLs

### OPTION 2: Manual Setup 📝

If the script doesn't work, add these **MANUALLY** in Vercel Dashboard:

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Select your project (stansence or TEAM-QWERTY)

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add These Variables** (Click "Add New" for each):

   | Variable Name | Value | Environments |
   |--------------|-------|--------------|
   | `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app` | ✅ Production, Preview, Development |
   | `NEXT_PUBLIC_API_URL` | `https://fastapi-core-service-5chvuuiaeq-uc.a.run.app` | ✅ Production, Preview, Development |
   | `NEXT_PUBLIC_NODE_SERVICE_URL` | `https://node-ingestion-service-5chvuuiaeq-uc.a.run.app` | ✅ Production, Preview, Development |
   | `NEXT_PUBLIC_FASTAPI_URL` | `https://fastapi-core-service-5chvuuiaeq-uc.a.run.app` | ✅ Production, Preview, Development |
   | `NEXT_PUBLIC_ENVIRONMENT` | `production` | ✅ Production |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `stance-sense-qwerty` | ✅ All |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `stance-sense-qwerty.firebaseapp.com` | ✅ All |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `stance-sense-qwerty.appspot.com` | ✅ All |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `315465328987` | ✅ All |

4. **Redeploy**
   - Go to **Deployments** tab
   - Find latest deployment (commit a0a22dc)
   - Click **•••** menu → **Redeploy**

---

## 🧪 TESTING AFTER DEPLOYMENT

### 1. Verify Backend Services are Healthy

```powershell
# Test Node.js service
curl https://node-ingestion-service-5chvuuiaeq-uc.a.run.app/health
# Should return: {"status":"healthy","timestamp":"..."}

# Test FastAPI service
curl https://fastapi-core-service-5chvuuiaeq-uc.a.run.app/
# Should return: {"message":"StanceSense Core API is running."}
```

### 2. Check WebSocket Connection in Browser

After Vercel redeploys:
1. Open your Vercel site
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for:
   ```
   ✅ WebSocket connected to backend
   ✅ Connected to real-time data stream
   ```
5. Check **Network** tab → **WS** filter
   - Should show connection to: `wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/frontend-data`
   - Status: `101 Switching Protocols` (success)

### 3. Verify Dashboard Displays Data

- ✅ Tremor score visible (0-100)
- ✅ Rigidity score visible (0-100)
- ✅ Gait score visible (0-100)
- ✅ Charts animating with data
- ✅ Alerts displaying

---

## 🚨 TROUBLESHOOTING

### "Still connecting to localhost"
**Cause**: Environment variables not loaded in Vercel
**Fix**: 
1. Verify variables are in Vercel Dashboard → Settings → Environment Variables
2. Redeploy (Deployments → Latest → Redeploy)
3. Hard refresh browser (Ctrl+Shift+R)

### "WebSocket connection failed"
**Cause**: CORS or service not allowing connections
**Fix**: Check Cloud Run allows unauthenticated access:
```powershell
gcloud run services add-iam-policy-binding node-ingestion-service `
  --region=us-central1 `
  --member="allUsers" `
  --role="roles/run.invoker"
```

### "Firebase auth not initialized"
**Cause**: Missing Firebase credentials
**Status**: Fixed in commit a0a22dc (Firebase now initializes with fallback values)
**Optional**: Add real Firebase API keys to Vercel for actual authentication

---

## ✅ VERIFICATION CHECKLIST

After setup, verify:

- [ ] Ran `setup-vercel-env.ps1` OR manually added all variables in Vercel
- [ ] Redeployed after adding variables
- [ ] Vercel build completed successfully (check Deployments tab)
- [ ] Browser console shows: "WebSocket connected to backend"
- [ ] Network tab shows WebSocket to: `wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app`
- [ ] Dashboard displays sensor metrics (tremor, rigidity, gait)
- [ ] No errors about "Firebase auth not initialized"
- [ ] No errors about "localhost connection failed"

---

## 📋 WHAT WAS FIXED

**Commit a0a22dc** (Just pushed):
1. ✅ Updated `.env.production` with correct Cloud Run URLs
2. ✅ Fixed Firebase auth initialization to always create auth instance
3. ✅ Created `setup-vercel-env.ps1` for automatic environment setup
4. ✅ Verified both backend services are healthy and responding

**Previous Commit c8c4e5e**:
- ✅ Fixed useWebSocket.ts to use environment variables

---

## 🎯 EXPECTED RESULT

After Vercel rebuilds (2-3 minutes), your frontend will:

1. ✅ Connect to correct GCP backend (not localhost)
2. ✅ WebSocket streams real-time sensor data
3. ✅ Dashboard updates live with tremor/rigidity scores
4. ✅ Firebase auth initialized (no errors)
5. ✅ Complete end-to-end integration working

---

## 📞 QUICK REFERENCE

**Latest Commit**: a0a22dc
**Node.js URL**: https://node-ingestion-service-5chvuuiaeq-uc.a.run.app
**FastAPI URL**: https://fastapi-core-service-5chvuuiaeq-uc.a.run.app
**WebSocket Path**: /ws/frontend-data

**Vercel Dashboard**: https://vercel.com/dashboard
**Automatic Setup Script**: `.\setup-vercel-env.ps1`

---

**🚀 Your system is ready - just add the environment variables and redeploy!**
