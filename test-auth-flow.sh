#!/bin/bash

echo "==============================================="
echo "Testing Complete Authentication Flow"
echo "==============================================="
echo ""

API_BASE_URL="https://ghs.oneweekmvps.com"
EMAIL="admin@example.com"
PASSWORD="admin123"

echo "Step 1: Testing Login..."
echo "----------------------------------------"

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Login successful!"
  echo ""
  echo "Response:"
  echo "$RESPONSE_BODY" | python3 -m json.tool
  
  # Extract tokens
  ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))")
  REFRESH_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('refreshToken', ''))")
  
  echo ""
  echo "Extracted Tokens:"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
  echo "❌ Login failed with status $HTTP_STATUS"
  echo "$RESPONSE_BODY" | python3 -m json.tool
  exit 1
fi

echo ""
echo "Step 2: Testing Refresh Token..."
echo "----------------------------------------"

REFRESH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_BASE_URL}/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")

HTTP_STATUS=$(echo "$REFRESH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Token refresh successful!"
  echo ""
  echo "Response:"
  echo "$RESPONSE_BODY" | python3 -m json.tool
  
  # Update tokens
  NEW_ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))")
  NEW_REFRESH_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('refreshToken', ''))")
  
  if [ -n "$NEW_ACCESS_TOKEN" ]; then
    ACCESS_TOKEN=$NEW_ACCESS_TOKEN
    echo ""
    echo "New Access Token: ${ACCESS_TOKEN:0:50}..."
  fi
  
  if [ -n "$NEW_REFRESH_TOKEN" ]; then
    REFRESH_TOKEN=$NEW_REFRESH_TOKEN
    echo "New Refresh Token: ${REFRESH_TOKEN:0:50}..."
  fi
else
  echo "❌ Token refresh failed with status $HTTP_STATUS"
  echo "$RESPONSE_BODY" | python3 -m json.tool
  exit 1
fi

echo ""
echo "Step 3: Testing Logout..."
echo "----------------------------------------"

LOGOUT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_BASE_URL}/api/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")

HTTP_STATUS=$(echo "$LOGOUT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LOGOUT_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
  echo "✅ Logout successful!"
  if [ -n "$RESPONSE_BODY" ] && [ "$RESPONSE_BODY" != "{}" ]; then
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool
  fi
else
  echo "❌ Logout failed with status $HTTP_STATUS"
  if [ -n "$RESPONSE_BODY" ]; then
    echo "$RESPONSE_BODY" | python3 -m json.tool
  fi
  exit 1
fi

echo ""
echo "==============================================="
echo "🎉 All authentication tests passed!"
echo "==============================================="
