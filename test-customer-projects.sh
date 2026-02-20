#!/bin/bash

# Test Customer Projects API
# Usage: ./test-customer-projects.sh <CUSTOMER_ID>

API_BASE_URL="https://ghs.oneweekmvps.com"
CUSTOMER_ID="${1}"

if [ -z "$CUSTOMER_ID" ]; then
  echo "Usage: ./test-customer-projects.sh <CUSTOMER_ID>"
  echo "Example: ./test-customer-projects.sh 67cc2ee0-0cca-4e44-b97f-4c24f9f0da27"
  exit 1
fi

# Get token from localStorage or provide it here
echo "Enter your auth token (or press Enter to use .env):"
read -r TOKEN_INPUT

if [ -n "$TOKEN_INPUT" ]; then
  TOKEN="$TOKEN_INPUT"
else
  # Try to get from .env
  if [ -f .env ]; then
    TOKEN=$(grep VITE_AUTH_TOKEN .env | cut -d= -f2 | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "$TOKEN" ]; then
  echo "Error: No auth token provided"
  exit 1
fi

echo "================================"
echo "🧪 Testing Customer Projects API"
echo "================================"
echo "Customer ID: $CUSTOMER_ID"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get Customer by ID (should include projects)
echo "📋 GET /api/customers/$CUSTOMER_ID"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/customers/$CUSTOMER_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo ""
  echo "Full Response:"
  echo "$BODY" | jq '.'
  echo ""
  echo "================================"
  echo "Projects from API:"
  echo "================================"
  PROJECTS=$(echo "$BODY" | jq '.customer.projects')
  echo "$PROJECTS" | jq '.'
  
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo ""
  echo -e "${YELLOW}Project Count: $PROJECT_COUNT${NC}"
  
  if [ "$PROJECT_COUNT" -eq 0 ] || [ "$PROJECT_COUNT" = "null" ]; then
    echo -e "${RED}⚠️  No projects found for this customer${NC}"
    echo ""
    echo "Possible reasons:"
    echo "1. No projects are assigned to this customer in the database"
    echo "2. Backend API isn't including projects in the response"
    echo "3. Projects relationship isn't properly configured in Prisma schema"
  else
    echo -e "${GREEN}✓ Projects found!${NC}"
  fi
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

echo "================================"
echo "✅ Test Complete"
echo "================================"
