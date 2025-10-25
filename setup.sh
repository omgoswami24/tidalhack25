#!/bin/bash

# SafeSight Setup Script
# This script sets up the SafeSight project for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SafeSight Setup Script${NC}"
echo "=========================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9+ first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create virtual environment for Python
echo -e "${YELLOW}🐍 Setting up Python virtual environment...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLO model
echo -e "${YELLOW}🤖 Downloading YOLO model...${NC}"
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

cd ..

# Setup frontend
echo -e "${YELLOW}⚛️  Setting up React frontend...${NC}"
cd frontend
npm install

cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please update .env file with your API keys${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/models
mkdir -p backend/data
mkdir -p frontend/public/images

# Make scripts executable
chmod +x aws/scripts/deploy.sh

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update .env file with your API keys:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - GEMINI_API_KEY"
echo ""
echo "2. Deploy AWS infrastructure:"
echo "   ./aws/scripts/deploy.sh"
echo ""
echo "3. Start the backend:"
echo "   cd backend && source venv/bin/activate && python app.py"
echo ""
echo "4. Start the frontend (in a new terminal):"
echo "   cd frontend && npm start"
echo ""
echo -e "${GREEN}✨ SafeSight is ready for development!${NC}"
