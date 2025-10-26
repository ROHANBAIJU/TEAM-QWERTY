# Frontend ↔ Backend Integration (local dev)

This document explains how to run the frontend (`stansence`) and backend (`core_api_service`) together locally for a smooth developer experience.

Prerequisites
- Node >= 18, npm
- Python 3.11+ and the project venv activated

1) Backend (FastAPI)
- From the backend folder:
```powershell
cd BACKEND/core_api_service
# Ensure venv activated and credentials are available (see main repo README)
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\secrets\stancesense_key.json'
# or set FIREBASE_SERVICE_ACCOUNT_JSON in the shell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

2) Frontend (Next.js) - dev
- From the frontend folder:
```powershell
cd FRONTEND/stansence
npm install
# copy .env.local.example -> .env.local and update if needed
npm run dev
```

3) Using the dev proxy
- The frontend dev server rewrites `/api/*` to the backend at `http://127.0.0.1:8000/*` so client code can use `NEXT_PUBLIC_API_BASE` or call `/api/ingest/...` directly.
- For WebSocket connections use the `NEXT_PUBLIC_WS_URL` value (by default `ws://127.0.0.1:8000/ws/frontend-data`). Note: Next dev server does not automatically proxy raw WebSocket connections; connect directly to the backend WS URL from the client.

4) Authentication / internal forwarder key
- For local forwarding from `node_ingestion_service` to FastAPI we added support for an `X-Internal-Key` header. Set the same secret in both environments:
```powershell
# for Node (session)
$env:INTERNAL_KEY='some-long-secret'
npm start

# for FastAPI (session)
$env:INTERNAL_KEY='some-long-secret'
$env:INTERNAL_FORWARDER_UID='node_forwarder'
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

5) Firestore
- The backend attempts to initialize Firestore using either:
  - The path in `GOOGLE_APPLICATION_CREDENTIALS`, or
  - The full JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` env var.

6) For production
- Build the frontend (`npm run build`) and serve it with a proper reverse proxy (nginx) or host it separately. Configure the frontend to point to the production API and WS endpoints.


If you want, I can:
- Add a simple Next.js client example page that connects to the backend WS and displays incoming messages.
- Add CI steps or an npm script that starts backend + frontend together for dev.
