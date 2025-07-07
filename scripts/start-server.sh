#!/bin/bash

echo "🚀 Starting Two Wheeler CRM Backend Server..."
echo "📍 Server will run on http://localhost:5000"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to the scripts directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔄 Starting server with auto-restart..."
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev-auth
