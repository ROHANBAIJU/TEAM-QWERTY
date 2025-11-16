# StanceSense Frontend - Vercel Deployment

This is the frontend application built with Next.js 16.0.0.

## Vercel Deployment

### Environment Variables Required:

1. `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (e.g., `https://your-backend.onrender.com`)
2. `NEXT_PUBLIC_WS_URL` - WebSocket URL (e.g., `wss://your-backend.onrender.com`)

### Deployment Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   cd FRONTEND/stansence
   vercel
   ```

4. **Set Environment Variables** (via Vercel Dashboard or CLI):
   ```bash
   vercel env add NEXT_PUBLIC_BACKEND_URL
   vercel env add NEXT_PUBLIC_WS_URL
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Build Configuration:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x

### Features Deployed:

- ✅ Real-time sensor data monitoring
- ✅ AI-powered symptom analysis
- ✅ Interactive charts and visualizations
- ✅ Care recommendations system
- ✅ Game therapy suggestions
- ✅ PDF report generation
- ✅ Medication logging
- ✅ Rewards system
- ✅ Firebase authentication (demo mode)

### Notes:

- Firebase is disabled by default for demo mode
- WebSocket connection requires backend to be deployed separately
- All TypeScript errors resolved ✅
- Production build successful ✅
