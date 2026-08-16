import json
import os
import urllib.error
import urllib.request
from datetime import datetime
from typing import Dict, Optional

from dotenv import load_dotenv

# Same reasoning as the Twilio service: load config here rather than relying on
# the importer, because this module builds its singleton at import time.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'safesight.env'))
load_dotenv()

# Discord renders a red embed for 0xED4245, its own danger colour.
EMBED_COLOUR = 0xED4245
REQUEST_TIMEOUT_SECONDS = 10

# Discord sits behind Cloudflare, which rejects urllib's default
# "Python-urllib/3.x" agent with HTTP 403 error code 1010 before the request
# ever reaches the webhook. Their API docs ask for an identifying agent, so
# send one.
USER_AGENT = 'Oculon-TrafficMonitor (https://oculon-one.vercel.app, 1.0)'


class DiscordAlertService:
    """Posts incident alerts to a Discord channel via an incoming webhook.

    Uses urllib rather than requests so the serverless bundle gains no new
    dependency - the whole point of keeping that bundle slim.
    """

    name = 'discord'

    @property
    def webhook_url(self) -> Optional[str]:
        return os.getenv('DISCORD_WEBHOOK_URL') or None

    @property
    def is_configured(self) -> bool:
        return bool(self.webhook_url)

    def send_emergency_alert(self, incident_data: Dict) -> Dict:
        if not self.is_configured:
            return {
                'success': False,
                'error': 'Discord not configured - missing: DISCORD_WEBHOOK_URL',
            }

        incident_type = incident_data.get('type', 'Traffic incident')
        location = incident_data.get('location', 'Unknown location')
        severity = incident_data.get('severity', 'High')
        description = incident_data.get('description', '')

        payload = {
            'username': 'Oculon',
            'embeds': [{
                'title': f"🚨 {incident_type.capitalize()} detected",
                'description': description,
                'color': EMBED_COLOUR,
                'fields': [
                    {'name': 'Location', 'value': location, 'inline': False},
                    {'name': 'Severity', 'value': str(severity), 'inline': True},
                    {'name': 'Time', 'value': datetime.now().strftime('%I:%M %p'), 'inline': True},
                ],
                'footer': {'text': 'Oculon traffic monitoring'},
            }],
        }

        request = urllib.request.Request(
            self.webhook_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'User-Agent': USER_AGENT},
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                status = response.status
            print(f"🚨 Discord alert posted (HTTP {status})")
            return {
                'success': True,
                'channel': 'discord',
                'status': f'HTTP {status}',
                'destination': 'Discord channel',
            }
        except urllib.error.HTTPError as e:
            # Discord puts the actual reason in the body, so surface it rather
            # than a bare status code.
            body = e.read().decode('utf-8', 'replace')[:200]
            print(f"❌ Discord alert failed: HTTP {e.code} {body}")
            return {'success': False, 'error': f'Discord webhook returned HTTP {e.code}: {body}'}
        except Exception as e:
            print(f"❌ Discord alert failed: {e}")
            return {'success': False, 'error': f'Discord webhook error: {e}'}


discord_alert_service = DiscordAlertService()
