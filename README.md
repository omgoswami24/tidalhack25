# Oculon - AI-Powered Traffic Incident Detection System

## 🎯 Project Overview

Oculon is an AI-powered real-time traffic incident detection system that analyzes live camera feeds from roads or highways, detects accidents or emergencies, and automatically alerts nearby hospitals, police stations, and emergency responders.

## 🏗️ Architecture

- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: Flask + Python
- **AI Models**: YOLOv8 (object detection) + Google Gemini VLM (semantic understanding)
- **Cloud Services**: AWS S3, SNS, Lambda, DynamoDB
- **Database**: AWS DynamoDB for alert logs and metadata

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- AWS Account with S3, SNS, Lambda, DynamoDB access
- Google Gemini API key

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## 🧑‍💻 Team Task Breakdown

### Member 1 - Frontend (React Dashboard)
- Build responsive dashboard with video player
- Implement alert feed with real-time updates
- Create detection overlay with bounding boxes
- Design incident log sidebar

### Member 2 - Backend (Flask API)
- Set up Flask endpoints for video processing
- Integrate YOLO detection pipeline
- Handle video streaming and frame capture
- Manage API communication with frontend

### Member 3 - AI Integration
- Implement YOLOv8 for real-time object detection
- Integrate Google Gemini VLM API
- Create semantic analysis pipeline
- Optimize model performance

### Member 4 - AWS & Alerts
- Set up AWS SNS for notifications
- Configure S3 for video storage
- Implement Lambda functions for event processing
- Set up DynamoDB for data persistence

## 🔧 Configuration

### Required Environment Variables

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
SNS_TOPIC_ARN=your_sns_topic_arn
S3_BUCKET_NAME=your_s3_bucket

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Application
FLASK_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
tidalhack25/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── backend/                 # Flask backend
│   ├── app.py              # Main Flask application
│   ├── models/             # AI model integration
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── requirements.txt
├── aws/                    # AWS infrastructure
│   ├── lambda/             # Lambda functions
│   ├── cloudformation/     # Infrastructure as code
│   └── scripts/            # Deployment scripts
├── docs/                   # Documentation
└── .env.example           # Environment variables template
```

## 🎥 Demo Features

- Real-time video feed with object detection overlay
- Live incident detection and alert generation
- Historical incident log with timestamps and descriptions
- AWS notification system integration
- Responsive dashboard design

## 🚨 Emergency Alert Flow

1. **Video Capture**: Live camera feed or uploaded video
2. **Object Detection**: YOLOv8 detects vehicles, people, objects
3. **Semantic Analysis**: Gemini VLM analyzes frames for incident patterns
4. **Alert Trigger**: System confirms incident and triggers alert
5. **Notification**: AWS SNS sends alerts to emergency services
6. **Dashboard Update**: Real-time UI updates with incident details

## 📱 Mobile Support

The dashboard is fully responsive and works on desktop, tablet, and mobile devices.

## 🔒 Security

- API keys stored in environment variables
- AWS IAM roles for secure service access
- Input validation and sanitization
- HTTPS in production

## 📈 Performance

- Optimized video processing pipeline
- Efficient model inference
- Real-time updates with minimal latency
- Scalable AWS infrastructure

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
