#!/bin/bash

# Good Homestory - API Setup Helper
# This script helps you configure and test the API integration

echo "=========================================="
echo "  Good Homestory - API Setup Helper"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

# Display current API URL
echo "Current API Configuration:"
echo "-------------------------"
if [ -f .env ]; then
    API_URL=$(grep VITE_API_BASE_URL .env | cut -d '=' -f2)
    echo "API Base URL: $API_URL"
else
    echo "API Base URL: Not configured"
fi
echo ""

# Ask if user wants to update API URL
read -p "Do you want to update the API URL? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Enter new API URL (e.g., http://localhost:3000 or https://api.example.com):"
    read NEW_API_URL
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$NEW_API_URL|g" .env
    else
        # Linux
        sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$NEW_API_URL|g" .env
    fi
    
    echo "✅ API URL updated to: $NEW_API_URL"
    echo ""
fi

# Test API connection
echo ""
echo "Testing API Connection..."
echo "-------------------------"
API_URL=$(grep VITE_API_BASE_URL .env | cut -d '=' -f2)

# Remove any trailing slashes
API_URL="${API_URL%/}"

echo "Testing: $API_URL/api/auth/login"
echo ""

# Test with curl if available
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test"}' \
        --connect-timeout 5 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if [ "$HTTP_CODE" = "000" ]; then
            echo "❌ Cannot connect to API server"
            echo "   Make sure your backend is running at: $API_URL"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo "⚠️  API server responded but endpoint not found (404)"
            echo "   Check if /api/auth/login endpoint exists"
        elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
            echo "✅ API server is running! (Got expected auth error)"
        else
            echo "✅ API server is responding (HTTP $HTTP_CODE)"
        fi
    else
        echo "❌ Cannot reach API server"
        echo "   Make sure your backend is running at: $API_URL"
    fi
else
    echo "⚠️  curl not found - skipping connection test"
    echo "   Install curl to test API connectivity"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Make sure your backend API is running"
echo "2. Start the frontend: npm run dev"
echo "3. Navigate to: http://localhost:5173/login"
echo "4. Test login with your backend credentials"
echo ""
echo "For more details, read: API_INTEGRATION.md"
echo ""
