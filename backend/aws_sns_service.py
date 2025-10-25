"""
AWS SNS Service for SafeSight
Handles phone call alerts for security incidents
"""

import boto3
import os
import json
from typing import Dict, Optional
from datetime import datetime

class SNSService:
    def __init__(self):
        """Initialize AWS SNS service"""
        self.sns_client = None
        self.phone_number = "+12817265923"  # Security phone number
        
        try:
            # Initialize SNS client
            self.sns_client = boto3.client(
                'sns',
                region_name=os.getenv('AWS_DEFAULT_REGION', 'us-west-2'),
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                aws_session_token=os.getenv('AWS_SESSION_TOKEN')
            )
            print("✅ AWS SNS Service initialized")
        except Exception as e:
            print(f"⚠️  AWS SNS not available: {e}")
    
    def send_security_alert(self, incident_data: Dict) -> Dict:
        """
        Send security alert via phone call
        
        Args:
            incident_data: Dictionary containing incident information
            
        Returns:
            Dictionary with success status and message ID
        """
        if not self.sns_client:
            return {
                'success': False,
                'error': 'SNS service not available'
            }
        
        try:
            # Create alert message
            message = self._create_alert_message(incident_data)
            
            # Send SMS (phone call simulation)
            response = self.sns_client.publish(
                PhoneNumber=self.phone_number,
                Message=message,
                Subject="SafeSight Security Alert"
            )
            
            print(f"🚨 Security alert sent to {self.phone_number}")
            print(f"📱 Message ID: {response['MessageId']}")
            
            return {
                'success': True,
                'message_id': response['MessageId'],
                'phone_number': self.phone_number
            }
            
        except Exception as e:
            print(f"❌ Error sending security alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_alert_message(self, incident_data: Dict) -> str:
        """Create formatted alert message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        message = f"""
🚨 SAFESIGHT SECURITY ALERT 🚨

INCIDENT DETECTED: {incident_data.get('type', 'Unknown')}
LOCATION: {incident_data.get('location', 'Unknown')}
SEVERITY: {incident_data.get('severity', 'Unknown')}
TIME: {timestamp}

DESCRIPTION: {incident_data.get('description', 'No description available')}

ACTION REQUIRED: Please investigate immediately.

This is an automated alert from SafeSight Traffic Monitoring System.
        """.strip()
        
        return message
    
    def test_connection(self) -> bool:
        """Test SNS connection"""
        if not self.sns_client:
            return False
        
        try:
            # Try to get account attributes
            self.sns_client.get_account_attributes()
            return True
        except Exception as e:
            print(f"SNS connection test failed: {e}")
            return False

# Global instance
sns_service = SNSService()
