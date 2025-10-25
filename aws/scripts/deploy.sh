#!/bin/bash

# SafeSight AWS Deployment Script
# This script deploys the SafeSight infrastructure to AWS

set -e

# Configuration
STACK_NAME="safesight-infrastructure"
TEMPLATE_FILE="aws/cloudformation/safesight-infrastructure.yaml"
REGION="us-east-1"
ENVIRONMENT="dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SafeSight AWS Deployment Script${NC}"
echo "=================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Validate CloudFormation template
echo -e "${YELLOW}🔍 Validating CloudFormation template...${NC}"
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Template validation successful${NC}"
else
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}📝 Stack exists. Updating...${NC}"
    OPERATION="update-stack"
else
    echo -e "${YELLOW}🆕 Stack doesn't exist. Creating...${NC}"
    OPERATION="create-stack"
fi

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying infrastructure...${NC}"
aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment initiated successfully${NC}"
    
    # Wait for stack to complete
    echo -e "${YELLOW}⏳ Waiting for stack to complete...${NC}"
    aws cloudformation wait stack-$OPERATION-complete \
        --stack-name $STACK_NAME \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 Stack deployment completed successfully!${NC}"
        
        # Get stack outputs
        echo -e "${YELLOW}📊 Stack Outputs:${NC}"
        aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
            --output table
        
        # Get SNS Topic ARN
        SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
            --output text)
        
        # Get S3 Bucket Name
        S3_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
            --output text)
        
        # Get DynamoDB Table Name
        DYNAMODB_TABLE=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
            --output text)
        
        echo ""
        echo -e "${GREEN}🔧 Environment Variables for .env file:${NC}"
        echo "SNS_TOPIC_ARN=$SNS_TOPIC_ARN"
        echo "S3_BUCKET_NAME=$S3_BUCKET"
        echo "DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE"
        echo "AWS_REGION=$REGION"
        
    else
        echo -e "${RED}❌ Stack deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to initiate deployment${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "1. Update your .env file with the environment variables above"
echo "2. Configure your Google Gemini API key"
echo "3. Start the backend: cd backend && python app.py"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo -e "${GREEN}✨ SafeSight is ready to deploy!${NC}"
