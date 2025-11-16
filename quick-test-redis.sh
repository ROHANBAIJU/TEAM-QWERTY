#!/bin/bash
# quick-test-redis.sh
# Quick Redis testing script for local development

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  StanceSense Redis Testing${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Redis is installed
echo -e "\n${YELLOW}[1/6] Checking Redis installation...${NC}"
if ! command -v redis-server &> /dev/null; then
    echo -e "${RED}❌ Redis not found!${NC}"
    echo -e "${YELLOW}Install Redis:${NC}"
    echo -e "  macOS:   ${BLUE}brew install redis${NC}"
    echo -e "  Windows: ${BLUE}docker run -d -p 6379:6379 redis:6-alpine${NC}"
    echo -e "  Linux:   ${BLUE}sudo apt-get install redis-server${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Redis installed${NC}"
fi

# Check if Redis is running
echo -e "\n${YELLOW}[2/6] Checking Redis server...${NC}"
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${YELLOW}Starting Redis...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
    else
        redis-server --daemonize yes
    fi
    sleep 2
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis started${NC}"
    else
        echo -e "${RED}❌ Failed to start Redis${NC}"
        exit 1
    fi
fi

# Install Node.js dependencies
echo -e "\n${YELLOW}[3/6] Installing Node.js dependencies...${NC}"
cd BACKEND/node_ingestion_service
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Create .env if not exists
echo -e "\n${YELLOW}[4/6] Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Test Redis connection
echo -e "\n${YELLOW}[5/6] Testing Redis connection...${NC}"
cat > test-redis-connection.js << 'EOF'
const Redis = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6379 });

redis.on('connect', () => {
  console.log('✓ Connected to Redis');
  
  // Test basic operations
  redis.set('test_key', 'test_value', 'EX', 10)
    .then(() => redis.get('test_key'))
    .then((value) => {
      console.log('✓ Write/Read test passed:', value);
      return redis.del('test_key');
    })
    .then(() => {
      console.log('✓ Delete test passed');
      redis.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Test failed:', err);
      redis.disconnect();
      process.exit(1);
    });
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(1);
}, 5000);
EOF

node test-redis-connection.js
rm test-redis-connection.js

# Start Node.js service with simulator
echo -e "\n${YELLOW}[6/6] Starting Node.js service with Redis caching...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop${NC}"
echo -e "\n${GREEN}Monitor Redis keys:${NC} ${BLUE}redis-cli KEYS 'patient:*'${NC}"
echo -e "${GREEN}View data:${NC} ${BLUE}redis-cli LRANGE patient:test_patient_001:recent 0 5${NC}"
echo -e "\n${BLUE}========================================${NC}\n"

npm start
