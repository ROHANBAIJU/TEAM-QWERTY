#!/bin/bash
# Vercel Deployment Script for StanceSense Frontend

echo "========================================="
echo "  🚀 DEPLOYING TO VERCEL"
echo "========================================="
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/FRONTEND/stansence"

echo "📁 Current directory: $(pwd)"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Show environment variables that will be used
echo "📋 Environment Variables:"
echo "   NEXT_PUBLIC_API_URL=https://fastapi-core-service-315465328987.us-central1.run.app"
echo "   NEXT_PUBLIC_WEBSOCKET_URL=wss://node-ingestion-service-315465328987.us-central1.run.app"
echo "   NEXT_PUBLIC_NODE_SERVICE_URL=https://node-ingestion-service-315465328987.us-central1.run.app"
echo ""

echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel production
vercel --prod \
  --env NEXT_PUBLIC_API_URL=https://fastapi-core-service-315465328987.us-central1.run.app \
  --env NEXT_PUBLIC_WEBSOCKET_URL=wss://node-ingestion-service-315465328987.us-central1.run.app \
  --env NEXT_PUBLIC_NODE_SERVICE_URL=https://node-ingestion-service-315465328987.us-central1.run.app \
  --env NEXT_PUBLIC_ENVIRONMENT=production

echo ""
echo "========================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "========================================="
