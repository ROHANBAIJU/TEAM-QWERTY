#!/bin/bash
# deploy-to-gcp.sh
# Complete deployment script for StanceSense to Google Cloud Platform

set -e

# Configuration
PROJECT_ID="stancesense-prod"
REGION="us-central1"
NODE_SERVICE_NAME="node-ingestion-service"
FASTAPI_SERVICE_NAME="fastapi-core-service"
FRONTEND_SERVICE_NAME="stancesense-frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  StanceSense GCP Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo -e "\n${GREEN}[1/8] Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${GREEN}[2/8] Enabling required GCP APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    firestore.googleapis.com \
    redis.googleapis.com \
    secretmanager.googleapis.com

# Create Redis instance (Memorystore) if not exists
echo -e "\n${GREEN}[3/8] Setting up Redis (Memorystore)...${NC}"
if ! gcloud redis instances describe stancesense-redis --region=$REGION &> /dev/null; then
    echo "Creating Redis instance..."
    gcloud redis instances create stancesense-redis \
        --size=1 \
        --region=$REGION \
        --redis-version=redis_6_x \
        --tier=basic
    
    echo "Waiting for Redis to be ready..."
    gcloud redis instances describe stancesense-redis --region=$REGION --format="value(state)" | \
        while read state; do
            if [ "$state" == "READY" ]; then
                break
            fi
            sleep 10
        done
else
    echo "Redis instance already exists."
fi

# Get Redis host IP
REDIS_HOST=$(gcloud redis instances describe stancesense-redis --region=$REGION --format="value(host)")
echo "Redis Host: $REDIS_HOST"

# Deploy Node.js Ingestion Service
echo -e "\n${GREEN}[4/8] Deploying Node.js Ingestion Service...${NC}"
cd BACKEND/node_ingestion_service

gcloud run deploy $NODE_SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="REDIS_HOST=$REDIS_HOST,REDIS_PORT=6379,USE_REDIS_CACHE=true,SIMULATOR=false" \
    --vpc-connector=projects/$PROJECT_ID/locations/$REGION/connectors/redis-connector \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=10

NODE_SERVICE_URL=$(gcloud run services describe $NODE_SERVICE_NAME --region $REGION --format="value(status.url)")
echo "Node.js Service URL: $NODE_SERVICE_URL"

cd ../..

# Deploy FastAPI Core Service
echo -e "\n${GREEN}[5/8] Deploying FastAPI Core Service...${NC}"
cd BACKEND/core_api_service

# Upload Firebase credentials to Secret Manager
if ! gcloud secrets describe firebase-credentials &> /dev/null; then
    gcloud secrets create firebase-credentials \
        --data-file=stancesense_qwerty_serviceAccountKey.json
fi

gcloud run deploy $FASTAPI_SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_INGESTION_URL=$NODE_SERVICE_URL" \
    --set-secrets=GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials:latest \
    --port=8000 \
    --memory=1Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=10

FASTAPI_SERVICE_URL=$(gcloud run services describe $FASTAPI_SERVICE_NAME --region $REGION --format="value(status.url)")
echo "FastAPI Service URL: $FASTAPI_SERVICE_URL"

cd ../..

# Update Node.js environment with FastAPI URL
echo -e "\n${GREEN}[6/8] Updating Node.js service with FastAPI URL...${NC}"
gcloud run services update $NODE_SERVICE_NAME \
    --region $REGION \
    --set-env-vars="FASTAPI_INGEST_URL=$FASTAPI_SERVICE_URL/ingest/data"

# Deploy Frontend (Next.js)
echo -e "\n${GREEN}[7/8] Deploying Next.js Frontend...${NC}"
cd FRONTEND/stansence

# Create .env.production with backend URLs
cat > .env.production << EOF
NEXT_PUBLIC_FASTAPI_URL=$FASTAPI_SERVICE_URL
NEXT_PUBLIC_WS_URL=${NODE_SERVICE_URL/https/wss}
EOF

gcloud run deploy $FRONTEND_SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port=3000 \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --region $REGION --format="value(status.url)")

cd ../..

# Display deployment summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${GREEN}Service URLs:${NC}"
echo -e "Frontend:       ${FRONTEND_URL}"
echo -e "FastAPI:        ${FASTAPI_SERVICE_URL}"
echo -e "Node.js WS:     ${NODE_SERVICE_URL}"
echo -e "Redis Host:     ${REDIS_HOST}"
echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "1. Visit ${FRONTEND_URL} to access your application"
echo -e "2. Monitor logs: ${BLUE}gcloud run logs tail $FRONTEND_SERVICE_NAME --region $REGION${NC}"
echo -e "3. View Redis metrics in GCP Console"
echo -e "\n${GREEN}Cost Estimate (24/7 operation):${NC}"
echo -e "- Cloud Run: ~\$5-10/month (free tier covers demo usage)"
echo -e "- Redis (1GB): ~\$40/month"
echo -e "- Firestore: ~\$1-5/month (with optimized writes)"
echo -e "\n${BLUE}========================================${NC}"
