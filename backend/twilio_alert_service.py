import os
from twilio.rest import Client
from typing import Dict, Optional
from dotenv import load_dotenv

from alert_time import alert_timestamp

# Credentials come from safesight.env locally, or from real environment
# variables in hosting (Vercel). Load the file here rather than relying on the
# importer: this module builds its service singleton at import time, which used
# to run before simple_app.py called load_dotenv() - so every credential read
# as None and no alert could ever be sent. Real env vars still take priority,
# because load_dotenv does not override what is already set.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'safesight.env'))
load_dotenv()

# SMS is billed per 160-character segment, so keep the body to one segment where
# the location allows it and truncate rather than silently spill into a second.
SMS_MAX_CHARS = 160


class TwilioAlertService:
    name = 'sms'

    def __init__(self):
        """Initialize the Twilio SMS alert service"""
        self._client = None
        self._client_sid = None  # sid the cached client was built with

        print("✅ Twilio Alert Service initialized")
        print(f"📱 Twilio Phone: {self.twilio_phone}")
        print(f"📱 Target Phone: {self.target_phone}")
        if not self.is_configured:
            print("⚠️  Twilio credentials incomplete - alerts will fail until "
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

    def send_emergency_alert(self, incident_data: Dict) -> Dict:
        """
        Send an emergency alert as an SMS.

        Args:
            incident_data: Dictionary containing incident information

        Returns:
            Dictionary with success status and message SID
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
            body = self._create_alert_message(incident_data)
            print(f"📱 Sending emergency SMS to {self.target_phone}")
            print(f"📝 Body: {body}")

            message = client.messages.create(
                body=body,
                to=self.target_phone,
                from_=self.twilio_phone
            )

            print("🚨 Emergency alert sent!")
            print(f"📱 Message SID: {message.sid}")
            print(f"📱 Status: {message.status}")

            return {
                'success': True,
                'channel': 'sms',
                'message_sid': message.sid,
                'status': message.status,
                'destination': self.target_phone,
                'from_number': self.twilio_phone
            }

        except Exception as e:
            print(f"❌ Error sending emergency alert: {e}")
            print(f"   Error type: {type(e).__name__}")
            return {
                'success': False,
                'error': str(e)
            }

    def _create_alert_message(self, incident_data: Dict) -> str:
        """Build the SMS body, trimming the location before the alert loses meaning."""
        location = incident_data.get('location', 'Unknown location')
        incident_type = incident_data.get('type', 'Traffic incident')
        severity = incident_data.get('severity', 'High')

        prefix = f"OCULON ALERT: {incident_type} detected at "
        suffix = f". Threat level: {severity}."
        # Same reasoning as the Discord embed: only a live feed gets a time.
        if incident_data.get('isLive'):
            suffix += f" Time: {alert_timestamp(incident_data)}."
        suffix += " Respond ASAP."

        room = SMS_MAX_CHARS - len(prefix) - len(suffix)
        if room < 12:                       # nothing sensible left to trim to
            return (prefix + location + suffix)[:SMS_MAX_CHARS]
        if len(location) > room:
            location = location[:room - 1].rstrip(' ,') + '…'
        return prefix + location + suffix

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
twilio_alert_service = TwilioAlertService()
