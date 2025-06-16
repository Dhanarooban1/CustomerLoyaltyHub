@echo off
echo =======================================
echo Customer Loyalty Hub - Development Mode
echo =======================================
echo.

echo This script starts the application in development mode with proper
echo environment variable configuration for Windows.
echo.

echo Starting server with cross-env for Windows compatibility...
echo (This replaces the Unix-style NODE_ENV=development syntax)
echo.

npx cross-env NODE_ENV=development tsx server/index.ts

echo.
echo If the server didn't start correctly, try running:
echo npm run dev
echo.
echo To stop the server, press Ctrl+C
