import os
from twilio.rest import Client
from typing import Dict, Optional
from datetime import datetime

class TwilioVoiceService:
    def __init__(self):
        """Initialize Twilio Voice service"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')  # Your Twilio number
        self.target_phone = os.getenv('EMERGENCY_PHONE_NUMBER')  # Number to call
        
        try:
            # Initialize Twilio client
            self.client = Client(self.account_sid, self.auth_token)
            print(f"✅ Twilio Voice Service initialized")
            print(f"📞 Twilio Phone: {self.twilio_phone}")
            print(f"📞 Target Phone: {self.target_phone}")
            
            # Test the connection
            try:
                account = self.client.api.accounts(self.account_sid).fetch()
                print(f"✅ Twilio connection test successful - Account: {account.friendly_name}")
            except Exception as test_error:
                print(f"⚠️  Twilio connection test failed: {test_error}")
                
        except Exception as e:
            print(f"⚠️  Twilio Voice Service not available: {e}")
            self.client = None
    
    def make_emergency_call(self, incident_data: Dict) -> Dict:
        """
        Make an emergency voice call
        
        Args:
            incident_data: Dictionary containing incident information
            
        Returns:
            Dictionary with success status and call SID
        """
        if not self.client:
            return {
                'success': False,
                'error': 'Twilio Voice service not available'
            }
        
        try:
            # Create the message to speak
            message = self._create_voice_message(incident_data)
            print(f"📞 Making emergency call to {self.target_phone}")
            print(f"📝 Message: {message}")
            
            # Make the call
            call = self.client.calls.create(
                twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
                to=self.target_phone,
                from_=self.twilio_phone
            )
            
            print(f"🚨 Emergency call initiated!")
            print(f"📱 Call SID: {call.sid}")
            print(f"📞 Status: {call.status}")
            
            return {
                'success': True,
                'call_sid': call.sid,
                'status': call.status,
                'to_number': self.target_phone,
                'from_number': self.twilio_phone
            }
            
        except Exception as e:
            print(f"❌ Error making emergency call: {e}")
            print(f"   Error type: {type(e).__name__}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_voice_message(self, incident_data: Dict) -> str:
        """Create formatted voice message"""
        location = incident_data.get('location', 'Unknown location')
        incident_type = incident_data.get('type', 'Traffic incident')
        
        # Format the message
        message = f"Emergency alert. There is an accident. Please respond to it ASAP. "
        message += f"Location: {location}. "
        message += f"Incident type: {incident_type}. "
        message += f"Time: {datetime.now().strftime('%I:%M %p')}. "
        message += "This is an automated emergency alert from Oculon traffic monitoring system."
        
        return message
    
    def test_connection(self) -> bool:
        """Test Twilio connection"""
        if not self.client:
            return False
        
        try:
            # Try to fetch account info
            account = self.client.api.accounts(self.account_sid).fetch()
            print(f"Twilio connection test successful - Account: {account.friendly_name}")
            return True
        except Exception as e:
            print(f"Twilio connection test failed: {e}")
            return False

# Global instance
twilio_voice_service = TwilioVoiceService()
