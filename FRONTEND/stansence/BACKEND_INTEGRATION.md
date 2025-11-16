# Backend Integration Guide for Frontend

## ✅ Backend Services (DEPLOYED)

### 1. FastAPI Core Service
- **URL**: `https://fastapi-core-service-315465328987.us-central1.run.app`
- **Docs**: `https://fastapi-core-service-315465328987.us-central1.run.app/docs`
- **Status**: ✅ Running

### 2. Node.js Ingestion Service
- **URL**: `https://node-ingestion-service-315465328987.us-central1.run.app`
- **WebSocket**: `wss://node-ingestion-service-315465328987.us-central1.run.app`
- **Status**: ✅ Running, Redis Connected

---

## 🔧 Environment Variables

Add these to your `.env.production` (already created):

```env
NEXT_PUBLIC_API_URL=https://fastapi-core-service-315465328987.us-central1.run.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://node-ingestion-service-315465328987.us-central1.run.app
NEXT_PUBLIC_NODE_SERVICE_URL=https://node-ingestion-service-315465328987.us-central1.run.app
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📡 API Endpoints

### FastAPI Endpoints

#### Health Check
```javascript
GET https://fastapi-core-service-315465328987.us-central1.run.app/health
Response: { "status": "ok", "firestore": true }
```

#### Data Ingestion
```javascript
POST https://fastapi-core-service-315465328987.us-central1.run.app/ingest/data
Content-Type: application/json

{
  "user_id": "patient_001",
  "timestamp": "2025-11-16T00:00:00Z",
  "tremor": 45.5,
  "rigidity": 38.2,
  "gait": 62.8,
  "balance": 55.0
}
```

#### Get User Data
```javascript
GET https://fastapi-core-service-315465328987.us-central1.run.app/api/users/{user_id}/data
```

---

## 🔌 WebSocket Integration

### Connect to Real-time Data

```javascript
// In your React component
import { useEffect, useState } from 'react';

function RealtimeData() {
  const [data, setData] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket(
      'wss://node-ingestion-service-315465328987.us-central1.run.app/ws/frontend-data'
    );

    websocket.onopen = () => {
      console.log('✅ Connected to real-time data stream');
    };

    websocket.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      console.log('📊 Received data:', receivedData);
      setData(receivedData);
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('🔌 Disconnected from real-time data stream');
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  return (
    <div>
      {data && (
        <div>
          <h3>Real-time Data</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## 📦 API Client Setup

### Create API Client (`src/lib/api.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fastapi-core-service-315465328987.us-central1.run.app';
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://node-ingestion-service-315465328987.us-central1.run.app';

export class StanceSenseAPI {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = API_URL;
    this.wsUrl = WS_URL;
  }

  // Health Check
  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  // Submit Sensor Data
  async submitSensorData(data: {
    user_id: string;
    timestamp: string;
    tremor: number;
    rigidity: number;
    gait: number;
    balance: number;
  }) {
    const response = await fetch(`${this.baseUrl}/ingest/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Get User Data
  async getUserData(userId: string) {
    const response = await fetch(`${this.baseUrl}/api/users/${userId}/data`);
    return response.json();
  }

  // Connect to WebSocket
  connectWebSocket(onMessage: (data: any) => void) {
    const ws = new WebSocket(`${this.wsUrl}/ws/frontend-data`);
    
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    return ws;
  }
}

export const api = new StanceSenseAPI();
```

---

## 🧪 Testing Integration

### Test from Browser Console

```javascript
// Test Health
fetch('https://fastapi-core-service-315465328987.us-central1.run.app/health')
  .then(r => r.json())
  .then(console.log);

// Test WebSocket
const ws = new WebSocket('wss://node-ingestion-service-315465328987.us-central1.run.app/ws/frontend-data');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Data:', JSON.parse(e.data));
```

---

## 🚀 Deployment Checklist

### Before Deploying to Vercel:

- [x] Backend services deployed to GCP
- [x] Environment variables configured in `.env.production`
- [ ] Update API client to use environment variables
- [ ] Test API endpoints from frontend
- [ ] Test WebSocket connection
- [ ] Configure CORS if needed
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Test deployed frontend with backend

---

## 🔍 Troubleshooting

### CORS Issues
If you get CORS errors, the backend already has CORS configured to allow all origins. If issues persist:

1. Check Vercel domain is accessible
2. Ensure using HTTPS (not HTTP)
3. Check browser console for specific errors

### WebSocket Connection Fails
- Ensure using `wss://` (secure WebSocket)
- Check browser console for connection errors
- Verify backend health endpoint is responding

### API Not Responding
1. Check backend health: `curl https://fastapi-core-service-315465328987.us-central1.run.app/health`
2. View GCP logs: GCP Console → Cloud Run → fastapi-core-service → Logs
3. Check environment variables are set correctly

---

## 📊 Data Flow

```
User Device (Wearable)
    ↓
Node.js WebSocket Server (Real-time)
    ↓
Redis Cache (10min aggregation)
    ↓
FastAPI (Processing & AI)
    ↓
Firestore (Storage)
    ↓
Frontend Dashboard (Real-time updates)
```

---

## 🎯 Key Features

✅ **Real-time Data Streaming**: WebSocket connection for live sensor data
✅ **Data Aggregation**: Redis cache reduces Firestore writes by 99.5%
✅ **Scalable Infrastructure**: Auto-scaling Cloud Run services
✅ **Low Latency**: Sub-millisecond Redis cache access
✅ **Cost Efficient**: From 28,800 to 144 Firestore writes/day

---

## 📝 Next Steps

1. **Update Frontend API Calls**
   - Replace localhost URLs with production URLs
   - Use environment variables for all API calls

2. **Test Locally First**
   ```bash
   npm run dev
   # Test all features with production backend
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Monitor in Production**
   - GCP Cloud Run Dashboard
   - Vercel Analytics
   - Browser Console for errors

---

**Backend Status**: ✅ READY FOR INTEGRATION
**Next**: Deploy frontend to Vercel!
