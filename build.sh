#!/bin/bash
# Build and package the Curlino app for production

echo "🚀 Starting Curlino build process..."

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the app with electron-vite
echo "🔨 Building app with electron-vite..."
npm run build

# Package the app
echo "📦 Packaging app with electron-builder..."
npm run pack

echo "✅ Build completed! App available in dist/ directory"
