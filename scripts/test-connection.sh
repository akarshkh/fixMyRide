#!/bin/bash

echo "🔍 Testing MongoDB Connection..."
echo ""

# Test MongoDB connection
npm run check-connection

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MongoDB connection test passed!"
    echo ""
    echo "🚀 Now you can start the server with:"
    echo "   npm run dev-auth"
else
    echo ""
    echo "❌ MongoDB connection test failed!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check your internet connection"
    echo "2. Verify MongoDB Atlas cluster is running"
    echo "3. Check if your IP is whitelisted in MongoDB Atlas"
    echo "4. Verify the connection string is correct"
fi
