#!/bin/bash

# SafeSight Restart Script
# Kills existing processes and starts fresh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting SafeSight Application${NC}"
echo "=================================="

# Kill existing processes
echo -e "${YELLOW}🧹 Killing existing processes...${NC}"
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "node.*react-scripts" 2>/dev/null || true
sleep 2

# Start backend
echo -e "${YELLOW}🐍 Starting backend server...${NC}"
cd backend
source venv/bin/activate
python simple_app.py &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
echo -e "${YELLOW}⚛️  Starting frontend server...${NC}"
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend
sleep 10

echo ""
echo -e "${GREEN}🎉 SafeSight restarted successfully!${NC}"
echo ""
echo -e "${YELLOW}📱 Access the application:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo -e "${YELLOW}🛑 To stop: Press Ctrl+C${NC}"

# Keep running
wait
