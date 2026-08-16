"""Formats the time an incident is reported, in one fixed zone.

Alerts used to call datetime.now() directly, which reads the server clock. That
is the developer's laptop locally but UTC in deployment, so a Discord alert sent
at 5pm Central arrived stamped 10pm. The zone is pinned here and the client's
own timestamp is preferred, so the alert says when the incident was raised
rather than where the server happens to run.
"""

from datetime import datetime, timezone
from typing import Dict
from zoneinfo import ZoneInfo

ALERT_TZ = ZoneInfo('America/Chicago')
ALERT_TZ_LABEL = 'CT'


def alert_timestamp(incident_data: Dict) -> str:
    """Return the incident time as e.g. '5:02 PM CT'."""
    moment = None
    raw = incident_data.get('timestamp')

    if raw:
        try:
            # The frontend sends an ISO string ending in Z, which fromisoformat
            # rejects before Python 3.11.
            moment = datetime.fromisoformat(str(raw).replace('Z', '+00:00'))
        except ValueError:
            moment = None

    if moment is None:
        moment = datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)

    local = moment.astimezone(ALERT_TZ)
    return f"{local.strftime('%I:%M %p').lstrip('0')} {ALERT_TZ_LABEL}"
