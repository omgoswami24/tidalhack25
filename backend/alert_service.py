"""Dispatches an incident alert to whichever channel is configured.

Providers are tried in order and the first success wins, so deployment decides
the channel rather than the code: set DISCORD_WEBHOOK_URL and alerts go to
Discord, set the Twilio group instead and they go out as SMS.

Discord is first because it is the channel that works on a free account with
the full incident text. A Twilio trial refuses custom message bodies and
substitutes canned template text, so it can deliver a message but not this one.
"""

from typing import Dict

from discord_alert_service import discord_alert_service
from twilio_alert_service import twilio_alert_service

PROVIDERS = (discord_alert_service, twilio_alert_service)


def send_emergency_alert(incident_data: Dict) -> Dict:
    attempts = []

    for provider in PROVIDERS:
        if not provider.is_configured:
            attempts.append(f'{provider.name}: not configured')
            continue

        result = provider.send_emergency_alert(incident_data)
        if result.get('success'):
            return result
        attempts.append(f"{provider.name}: {result.get('error', 'unknown error')}")

    return {
        'success': False,
        'error': 'No alert channel succeeded — ' + '; '.join(attempts),
    }


def configured_channels() -> list:
    return [p.name for p in PROVIDERS if p.is_configured]
