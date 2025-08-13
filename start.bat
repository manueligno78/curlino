@echo off
REM Start the cUrlino app (development mode)
IF NOT EXIST node_modules (
  echo Installing dependencies...
  npm install
)
npm start
