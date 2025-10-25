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
        self.phone_number = os.getenv('SECURITY_ALERT_PHONE', '2817265923')
        # Ensure phone number has proper format
        if not self.phone_number.startswith('+1'):
            self.phone_number = f"+1{self.phone_number}"
        
        try:
            # Initialize SNS client
            self.sns_client = boto3.client(
                'sns',
                region_name=os.getenv('AWS_DEFAULT_REGION', 'us-west-2'),
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                aws_session_token=os.getenv('AWS_SESSION_TOKEN')
            )
            print(f"✅ AWS SNS Service initialized for phone: {self.phone_number}")
            
            # Test the connection
            try:
                self.sns_client.get_account_attributes()
                print("✅ AWS SNS connection test successful")
            except Exception as test_error:
                print(f"⚠️  AWS SNS connection test failed: {test_error}")
                
        except Exception as e:
            print(f"⚠️  AWS SNS not available: {e}")
            print(f"   AWS_ACCESS_KEY_ID: {'Set' if os.getenv('AWS_ACCESS_KEY_ID') else 'Not set'}")
            print(f"   AWS_SECRET_ACCESS_KEY: {'Set' if os.getenv('AWS_SECRET_ACCESS_KEY') else 'Not set'}")
            print(f"   AWS_SESSION_TOKEN: {'Set' if os.getenv('AWS_SESSION_TOKEN') else 'Not set'}")
    
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
            print(f"📱 Attempting to send SMS to {self.phone_number}")
            print(f"📝 Message: {message}")
            
            # Send SMS
            response = self.sns_client.publish(
                PhoneNumber=self.phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
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
            print(f"   Error type: {type(e).__name__}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_alert_message(self, incident_data: Dict) -> str:
        """Create formatted alert message"""
        return "🚨 ALERT: Suspicious activity detected! Please check immediately."
    
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
