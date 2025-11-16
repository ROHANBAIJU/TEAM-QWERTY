#!/bin/bash
# verify-system-ready.sh
# Complete system verification before deployment

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  StanceSense System Verification${NC}"
echo -e "${BLUE}========================================${NC}"

# Helper function for checks
check() {
    local name="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}Checking: ${name}${NC}"
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# 1. Check Node.js installation
check "Node.js installed (v16+)" "node --version | grep -E 'v(1[6-9]|[2-9][0-9])'"

# 2. Check npm installation
check "npm installed" "npm --version"

# 3. Check Redis availability
if check "Redis installed" "command -v redis-server"; then
    check "Redis running" "redis-cli ping"
fi

# 4. Check Docker (for Windows users)
check "Docker installed (optional)" "command -v docker"

# 5. Check gcloud CLI (for GCP deployment)
check "gcloud CLI installed (optional)" "command -v gcloud"

# 6. Verify file structure
echo -e "\n${YELLOW}Checking: File structure${NC}"
MISSING_FILES=0

files=(
    "BACKEND/node_ingestion_service/redis-cache.js"
    "BACKEND/node_ingestion_service/aggregation-service.js"
    "BACKEND/node_ingestion_service/package.json"
    "BACKEND/node_ingestion_service/.env.example"
    "BACKEND/node_ingestion_service/Dockerfile"
    "BACKEND/core_api_service/app/routes/aggregated.py"
    "BACKEND/core_api_service/Dockerfile"
    "deploy-to-gcp.sh"
    "GCP_DEPLOYMENT_GUIDE.md"
    "REDIS_TESTING_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (MISSING)"
        ((MISSING_FILES++))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - All files present"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - $MISSING_FILES files missing"
    ((CHECKS_FAILED++))
fi

# 7. Check Node.js dependencies
echo -e "\n${YELLOW}Checking: Node.js dependencies${NC}"
cd BACKEND/node_ingestion_service

if [ -d "node_modules" ]; then
    if [ -d "node_modules/ioredis" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - ioredis installed"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} - ioredis not installed (run: npm install)"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAILED${NC} - node_modules not found (run: npm install)"
    ((CHECKS_FAILED++))
fi

cd ../..

# 8. Check .env configuration
echo -e "\n${YELLOW}Checking: Environment configuration${NC}"
if [ -f "BACKEND/node_ingestion_service/.env" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - .env file exists"
    ((CHECKS_PASSED++))
    
    # Verify required variables
    ENV_ISSUES=0
    while IFS= read -r var; do
        if grep -q "^$var=" BACKEND/node_ingestion_service/.env 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} $var set"
        else
            echo -e "  ${YELLOW}⚠${NC} $var not set (optional)"
        fi
    done <<< "REDIS_HOST
REDIS_PORT
USE_REDIS_CACHE
AGGREGATION_INTERVAL"
else
    echo -e "${RED}✗ FAILED${NC} - .env file not found (copy from .env.example)"
    ((CHECKS_FAILED++))
fi

# 9. Check Python dependencies (FastAPI)
echo -e "\n${YELLOW}Checking: Python FastAPI setup${NC}"
if [ -f "BACKEND/core_api_service/requirements.txt" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - requirements.txt exists"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - requirements.txt not found"
    ((CHECKS_FAILED++))
fi

# 10. Check frontend build
echo -e "\n${YELLOW}Checking: Frontend setup${NC}"
if [ -d "FRONTEND/stansence/node_modules" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Frontend dependencies installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Frontend dependencies not installed (run: cd FRONTEND/stansence && npm install)"
fi

# Final summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Verification Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ System is ready for deployment!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "1. Test locally:       ${YELLOW}./quick-test-redis.sh${NC}"
    echo -e "2. Deploy to GCP:      ${YELLOW}./deploy-to-gcp.sh${NC}"
    echo -e "3. Read documentation: ${YELLOW}cat IMPLEMENTATION_COMPLETE.md${NC}"
    exit 0
else
    echo -e "\n${RED}✗ System has issues that need to be resolved.${NC}"
    echo -e "\n${YELLOW}Common fixes:${NC}"
    echo -e "- Run: ${BLUE}cd BACKEND/node_ingestion_service && npm install${NC}"
    echo -e "- Run: ${BLUE}cp BACKEND/node_ingestion_service/.env.example BACKEND/node_ingestion_service/.env${NC}"
    echo -e "- Install Redis: ${BLUE}brew install redis${NC} (Mac) or ${BLUE}docker run -d -p 6379:6379 redis:6-alpine${NC} (Windows)"
    exit 1
fi
