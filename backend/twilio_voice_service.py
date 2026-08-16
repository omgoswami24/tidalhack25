import os
from twilio.rest import Client
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

# Credentials come from safesight.env locally, or from real environment
# variables in hosting (Render). Load the file here rather than relying on the
# importer: this module builds its service singleton at import time, which used
# to run before simple_app.py called load_dotenv() - so every credential read
# as None and no call could ever be placed. Real env vars still take priority,
# because load_dotenv does not override what is already set.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'safesight.env'))
load_dotenv()


class TwilioVoiceService:
    def __init__(self):
        """Initialize Twilio Voice service"""
        self._client = None
        self._client_sid = None  # sid the cached client was built with

        print("✅ Twilio Voice Service initialized")
        print(f"📞 Twilio Phone: {self.twilio_phone}")
        print(f"📞 Target Phone: {self.target_phone}")
        if not self.is_configured:
            print("⚠️  Twilio credentials incomplete - calls will fail until "
                  "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are set")

    # Credentials are read on each access so values supplied after import
    # (or by the hosting platform) are picked up without a restart.
    @property
    def account_sid(self) -> Optional[str]:
        return os.getenv('TWILIO_ACCOUNT_SID') or None

    @property
    def auth_token(self) -> Optional[str]:
        return os.getenv('TWILIO_AUTH_TOKEN') or None

    @property
    def twilio_phone(self) -> Optional[str]:
        return os.getenv('TWILIO_PHONE_NUMBER') or None

    @property
    def target_phone(self) -> Optional[str]:
        return os.getenv('EMERGENCY_PHONE_NUMBER') or None

    @property
    def is_configured(self) -> bool:
        return all([self.account_sid, self.auth_token, self.twilio_phone, self.target_phone])

    @property
    def client(self) -> Optional[Client]:
        """Twilio client, built on first use and rebuilt if the SID changes."""
        sid, token = self.account_sid, self.auth_token
        if not sid or not token:
            return None
        if self._client is None or self._client_sid != sid:
            try:
                self._client = Client(sid, token)
                self._client_sid = sid
            except Exception as e:
                print(f"⚠️  Twilio client could not be created: {e}")
                self._client = None
        return self._client

    def make_emergency_call(self, incident_data: Dict) -> Dict:
        """
        Make an emergency voice call

        Args:
            incident_data: Dictionary containing incident information

        Returns:
            Dictionary with success status and call SID
        """
        # Report precisely which piece is missing - a bare "not available" here
        # is what made this hard to diagnose before.
        missing = [
            name for name, value in (
                ('TWILIO_ACCOUNT_SID', self.account_sid),
                ('TWILIO_AUTH_TOKEN', self.auth_token),
                ('TWILIO_PHONE_NUMBER', self.twilio_phone),
                ('EMERGENCY_PHONE_NUMBER', self.target_phone),
            ) if not value
        ]
        if missing:
            return {
                'success': False,
                'error': f"Twilio not configured - missing: {', '.join(missing)}"
            }

        client = self.client
        if not client:
            return {'success': False, 'error': 'Twilio client could not be created'}

        try:
            message = self._create_voice_message(incident_data)
            print(f"📞 Making emergency call to {self.target_phone}")
            print(f"📝 Message: {message}")

            call = client.calls.create(
                twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
                to=self.target_phone,
                from_=self.twilio_phone
            )

            print("🚨 Emergency call initiated!")
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

        message = f"Emergency alert. There is an accident. Please respond to it ASAP. "
        message += f"Location: {location}. "
        message += f"Incident type: {incident_type}. "
        message += f"Time: {datetime.now().strftime('%I:%M %p')}. "
        message += "This is an automated emergency alert from Oculon traffic monitoring system."

        return message

    def test_connection(self) -> bool:
        """Test Twilio connection"""
        client = self.client
        if not client:
            return False

        try:
            account = client.api.accounts(self.account_sid).fetch()
            print(f"Twilio connection test successful - Account: {account.friendly_name}")
            return True
        except Exception as e:
            print(f"Twilio connection test failed: {e}")
            return False


# Global instance
twilio_voice_service = TwilioVoiceService()
