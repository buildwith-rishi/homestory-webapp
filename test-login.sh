#!/bin/bash

# Quick Login Test Script
# Tests the API integration with your credentials

echo "╔══════════════════════════════════════════════════════════╗"
echo "║      Good Homestory - Login API Test                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

API_URL="https://ghs.oneweekmvps.com"
EMAIL="admin@example.com"
PASSWORD="admin123"

echo "📡 Testing API Endpoint..."
echo "   URL: $API_URL/api/auth/login"
echo "   Email: $EMAIL"
echo ""

# Test the login endpoint
echo "🔄 Sending login request..."
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
response_body=$(echo "$response" | sed '$d')

echo "📊 Response Status: $http_status"
echo ""

if [ "$http_status" = "200" ]; then
    echo "✅ SUCCESS! Login API is working!"
    echo ""
    echo "📦 Response Data:"
    echo "$response_body" | python3 -m json.tool 2>/dev/null || echo "$response_body"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ INTEGRATION TEST PASSED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. npm run dev"
    echo "   2. Visit: http://localhost:5173/login"
    echo "   3. Login with: $EMAIL / $PASSWORD"
    echo ""
else
    echo "❌ FAILED! HTTP Status: $http_status"
    echo ""
    echo "📦 Response:"
    echo "$response_body"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check if backend is running"
    echo "   - Verify credentials are correct"
    echo "   - Check backend logs for errors"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation:"
echo "   - LOGIN_CREDENTIALS.md   - Test credentials"
echo "   - INTEGRATION_SUMMARY.md - Complete guide"
echo "   - API_INTEGRATION.md     - Detailed docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
