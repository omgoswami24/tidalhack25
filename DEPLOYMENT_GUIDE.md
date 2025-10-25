# SafeSight Deployment Guide

## 🚀 Quick Start (36-Hour Hackathon Setup)

### Prerequisites
- AWS Account with admin permissions
- Google Gemini API key
- Python 3.9+ and Node.js 18+
- Git

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd tidalhack25
chmod +x setup.sh
./setup.sh
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your keys
nano .env
```

Required environment variables:
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Application
FLASK_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 3: Deploy AWS Infrastructure
```bash
# Deploy CloudFormation stack
./aws/scripts/deploy.sh
```

This will create:
- S3 bucket for video storage
- DynamoDB table for incidents
- SNS topic for alerts
- Lambda function for processing
- IAM roles and policies

### Step 4: Start Backend
```bash
cd backend
source venv/bin/activate
python app.py
```

Backend will be available at `http://localhost:5000`

### Step 5: Start Frontend
```bash
cd frontend
npm start
```

Frontend will be available at `http://localhost:3000`

## 🔧 Detailed Setup Instructions

### AWS Setup

#### 1. Create AWS Account
- Go to [AWS Console](https://aws.amazon.com)
- Create new account or sign in
- Enable billing alerts

#### 2. Create IAM User
```bash
# Create IAM user with programmatic access
aws iam create-user --user-name safesight-user

# Attach policies
aws iam attach-user-policy --user-name safesight-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-user-policy --user-name safesight-user --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess
aws iam attach-user-policy --user-name safesight-user --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-user-policy --user-name safesight-user --policy-arn arn:aws:iam::aws:policy/CloudFormationFullAccess

# Create access keys
aws iam create-access-key --user-name safesight-user
```

#### 3. Configure AWS CLI
```bash
aws configure
# Enter your access key, secret key, and region
```

### Google Gemini Setup

#### 1. Get API Key
- Go to [Google AI Studio](https://aistudio.google.com)
- Sign in with Google account
- Create new API key
- Copy the key to your `.env` file

#### 2. Enable Gemini API
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Enable Generative AI API
- Set up billing if required

### Local Development

#### Backend Development
```bash
cd backend
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

#### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    env_file:
      - .env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

## ☁️ AWS Production Deployment

### EC2 Instance Setup
```bash
# Launch EC2 instance (t3.medium or larger)
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone <your-repo-url>
cd tidalhack25

# Deploy with Docker Compose
docker-compose up -d
```

### Load Balancer Setup
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
    --name safesight-alb \
    --subnets subnet-12345 subnet-67890 \
    --security-groups sg-12345

# Create target group
aws elbv2 create-target-group \
    --name safesight-targets \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-12345

# Register targets
aws elbv2 register-targets \
    --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/safesight-targets/1234567890123456 \
    --targets Id=i-1234567890abcdef0
```

## 🔍 Monitoring and Logging

### CloudWatch Setup
```bash
# Create log group
aws logs create-log-group --log-group-name /aws/safesight

# Create log stream
aws logs create-log-stream \
    --log-group-name /aws/safesight \
    --log-stream-name backend
```

### Monitoring Dashboard
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
    --dashboard-name SafeSight-Monitoring \
    --dashboard-body file://monitoring-dashboard.json
```

## 🚨 Troubleshooting

### Common Issues

#### 1. YOLO Model Not Loading
```bash
# Check if model file exists
ls -la backend/yolov8n.pt

# Download model manually
cd backend
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

#### 2. Gemini API Errors
```bash
# Test API key
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1beta/models
```

#### 3. AWS Permissions Issues
```bash
# Test AWS credentials
aws sts get-caller-identity

# Check S3 access
aws s3 ls s3://your-bucket-name
```

#### 4. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
```bash
# Backend debug
export FLASK_DEBUG=1
python app.py

# Frontend debug
REACT_APP_DEBUG=true npm start
```

## 📊 Performance Optimization

### Backend Optimization
- Use Gunicorn for production
- Implement Redis for caching
- Optimize YOLO model inference
- Add connection pooling

### Frontend Optimization
- Implement code splitting
- Add service worker for caching
- Optimize bundle size
- Use CDN for static assets

### AWS Optimization
- Use CloudFront for CDN
- Implement auto-scaling
- Use RDS for database
- Add CloudWatch alarms

## 🔒 Security Considerations

### API Security
- Implement rate limiting
- Add authentication/authorization
- Use HTTPS in production
- Validate all inputs

### AWS Security
- Use IAM roles instead of access keys
- Enable CloudTrail logging
- Implement VPC security groups
- Use AWS Secrets Manager

### Data Protection
- Encrypt data at rest
- Use HTTPS for data in transit
- Implement data retention policies
- Regular security audits

## 📈 Scaling Considerations

### Horizontal Scaling
- Use ECS or EKS for container orchestration
- Implement load balancing
- Use auto-scaling groups
- Database read replicas

### Vertical Scaling
- Increase instance sizes
- Optimize database performance
- Use GPU instances for AI processing
- Implement caching layers

## 🎯 Demo Preparation

### Pre-Demo Checklist
- [ ] All services running
- [ ] Test video feed working
- [ ] Incident detection functioning
- [ ] AWS alerts configured
- [ ] Dashboard responsive
- [ ] Backup plan ready

### Demo Script
1. **Introduction** (2 min)
   - Show dashboard overview
   - Explain AI detection system

2. **Live Detection** (3 min)
   - Start video feed
   - Show object detection overlay
   - Demonstrate incident detection

3. **Alert System** (2 min)
   - Show incident notification
   - Display alert history
   - Explain AWS integration

4. **Analytics** (2 min)
   - Show detection statistics
   - Display incident trends
   - Explain system status

5. **Q&A** (3 min)
   - Answer technical questions
   - Discuss scalability
   - Explain business value

## 📞 Support

### Team Communication
- **Slack**: #safesight-dev
- **GitHub**: Issues and PRs
- **Email**: team@safesight.com

### Emergency Contacts
- **Lead Developer**: +1-555-0123
- **DevOps**: +1-555-0124
- **AI Specialist**: +1-555-0125

---

**Good luck with your hackathon! 🚀**
