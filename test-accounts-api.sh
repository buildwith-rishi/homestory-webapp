#!/bin/bash

# Test Accounts API Endpoints
# Usage: ./test-accounts-api.sh

API_BASE_URL="https://api.goodhomestory.com"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzg0YWFkNWI0YjQ3MzU0NTI3MmNiYjEiLCJlbWFpbCI6InZhbnNobWVodGExMDAzQGdtYWlsLmNvbSIsImlhdCI6MTczNjg2NDA0NSwiZXhwIjoxNzM3NDY4ODQ1fQ.Qd6JQSHSwI98hV02ySnGsIBZWWmZA5n0iVcmDZLaAgM"

echo "================================"
echo "🧪 Testing Account API Endpoints"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get Account Types
echo "📋 Test 1: GET /api/accounts/types"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/accounts/types")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

# Test 2: List Accounts (with pagination)
echo "📋 Test 2: GET /api/accounts?page=1&limit=10"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/accounts?page=1&limit=10")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
  
  # Save first account ID for later tests
  ACCOUNT_ID=$(echo "$BODY" | jq -r '.accounts[0].id // empty')
  if [ -n "$ACCOUNT_ID" ]; then
    echo -e "${YELLOW}📝 Saved Account ID for testing: $ACCOUNT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

# Test 3: Create Account
echo "📋 Test 3: POST /api/accounts"
echo "------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Account Company",
    "type": "COMPANY",
    "email": "testaccount@example.com",
    "phone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "state": "TS",
    "pincode": "12345",
    "leadId": null
  }' \
  "$API_BASE_URL/api/accounts")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
  
  # Save created account ID for update/delete tests
  CREATED_ACCOUNT_ID=$(echo "$BODY" | jq -r '.id // empty')
  if [ -n "$CREATED_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}📝 Created Account ID: $CREATED_ACCOUNT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

# Test 4: Get Account by ID (use created account or existing)
TEST_ACCOUNT_ID="${CREATED_ACCOUNT_ID:-$ACCOUNT_ID}"
if [ -n "$TEST_ACCOUNT_ID" ]; then
  echo "📋 Test 4: GET /api/accounts/$TEST_ACCOUNT_ID"
  echo "---------------------------------------"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE_URL/api/accounts/$TEST_ACCOUNT_ID")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
    echo "Response:"
    echo "$BODY" | jq '.'
  else
    echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
    echo "Response:"
    echo "$BODY"
  fi
  echo ""
fi

# Test 5: Update Account
if [ -n "$CREATED_ACCOUNT_ID" ]; then
  echo "📋 Test 5: PUT /api/accounts/$CREATED_ACCOUNT_ID"
  echo "---------------------------------------"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Account Company (Updated)",
      "email": "updated@example.com"
    }' \
    "$API_BASE_URL/api/accounts/$CREATED_ACCOUNT_ID")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
    echo "Response:"
    echo "$BODY" | jq '.'
  else
    echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
    echo "Response:"
    echo "$BODY"
  fi
  echo ""
fi

# Test 6: Convert Lead to Account (requires a valid Lead ID)
echo "📋 Test 6: POST /api/accounts/convert-lead"
echo "------------------------------------------"
echo -e "${YELLOW}⚠️  Skipping: Requires a valid Lead ID${NC}"
echo "To test manually, use:"
echo "curl -X POST \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"leadId\": \"your-lead-id\", \"name\": \"Converted Account\"}' \\"
echo "  \"$API_BASE_URL/api/accounts/convert-lead\""
echo ""

# Test 7: Delete Account (cleanup)
if [ -n "$CREATED_ACCOUNT_ID" ]; then
  echo "📋 Test 7: DELETE /api/accounts/$CREATED_ACCOUNT_ID"
  echo "---------------------------------------"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE_URL/api/accounts/$CREATED_ACCOUNT_ID")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
    echo "Account deleted successfully"
  else
    echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
    echo "Response:"
    echo "$BODY"
  fi
  echo ""
fi

# Test 8: Search Accounts
echo "📋 Test 8: GET /api/accounts?search=Test"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/accounts?search=Test&limit=5")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

# Test 9: Filter by Type
echo "📋 Test 9: GET /api/accounts?type=HOUSEHOLD"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/accounts?type=HOUSEHOLD&limit=5")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "Response:"
  echo "$BODY"
fi
echo ""

echo "================================"
echo "✅ Account API Tests Complete"
echo "================================"
