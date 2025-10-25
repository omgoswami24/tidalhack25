#!/bin/bash

# SafeSight Quick Demo Setup
# This script sets up a demo-ready version of SafeSight

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SafeSight Quick Demo Setup${NC}"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp env.example .env
    echo -e "${RED}❌ Please update .env file with your API keys before continuing${NC}"
    echo "Required keys:"
    echo "- AWS_ACCESS_KEY_ID"
    echo "- AWS_SECRET_ACCESS_KEY" 
    echo "- GEMINI_API_KEY"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Load environment variables
source .env

# Check if API keys are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ Missing required API keys in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Setup backend
echo -e "${YELLOW}🐍 Setting up backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLO model
echo -e "${YELLOW}🤖 Downloading YOLO model...${NC}"
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" || echo "YOLO model download failed, will use mock data"

cd ..

# Setup frontend
echo -e "${YELLOW}⚛️  Setting up frontend...${NC}"
cd frontend

# Install dependencies
npm install

cd ..

# Deploy AWS infrastructure (optional)
echo -e "${YELLOW}☁️  Deploying AWS infrastructure...${NC}"
read -p "Deploy AWS infrastructure? (y/n): " deploy_aws

if [ "$deploy_aws" = "y" ] || [ "$deploy_aws" = "Y" ]; then
    ./aws/scripts/deploy.sh
else
    echo -e "${YELLOW}⚠️  Skipping AWS deployment. Using mock data for demo.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed!${NC}"
echo ""
echo -e "${YELLOW}🚀 Starting SafeSight Demo...${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✨ SafeSight is now running!${NC}"
echo ""
echo -e "${YELLOW}📱 Access the application:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo -e "${YELLOW}🎯 Demo Features:${NC}"
echo "• Live video feed with AI detection"
echo "• Real-time incident detection"
echo "• AWS alert system integration"
echo "• Responsive dashboard"
echo ""
echo -e "${YELLOW}🛑 To stop the demo:${NC}"
echo "Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for user to stop
trap "echo -e '\n${YELLOW}Stopping SafeSight...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
