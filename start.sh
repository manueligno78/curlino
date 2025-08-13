#!/bin/bash
# Start the cUrlino app (development mode)

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the app
npm start
