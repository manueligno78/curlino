@echo off
REM Build and package the Curlino app for production

echo 🚀 Starting Curlino build process...

IF NOT EXIST node_modules (
  echo 📦 Installing dependencies...
  npm install
)

REM Build the app with electron-vite
echo 🔨 Building app with electron-vite...
npm run build

REM Package the app
echo 📦 Packaging app with electron-builder...
npm run pack

echo ✅ Build completed! App available in dist/ directory
