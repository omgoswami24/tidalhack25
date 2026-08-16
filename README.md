# Oculon

A traffic monitoring dashboard that watches public DOT camera feeds, flags collisions on
recorded incident footage, and dispatches an automated emergency alert when one fires.

Live: https://oculon-one.vercel.app

## What it does

The dashboard shows 15 channels: 12 live HLS streams pulled straight from state DOT
camera networks, plus 3 recorded incident clips used for demonstration.

Live feeds come from five agencies — Caltrans District 4 (5 cameras), WisDOT (2),
NYSDOT (2), Nevada DOT (2) and Louisiana DOTD (1) — spanning six states. They are public,
unauthenticated HLS endpoints played with `hls.js`.

Recorded clips stay paused until an operator plays them. While one plays, the frontend
polls the backend with the clip's playback position; when the position falls inside that
clip's incident window the dashboard raises an alert and dispatches it to the configured
channel.

## How detection actually works

This is the part worth being precise about.

Detection is **timeline-based, not a live vision model**. Each recorded clip has an
incident window in `backend/real_crash_detector.py`, and the API answers "is there a
collision at time *t*" by checking the playback position against that window. There is no
per-frame inference in the request path.

The windows were derived from the footage rather than guessed:

| Clip | Window | Basis |
|------|--------|-------|
| `V1.mp4` — box truck strikes a low-clearance bridge | 6.85s – 8.50s | Real impact. The truck was tracked against a median-background model: it reaches the underpass around 5.3s, decelerates hard through 6.1s, and is fully stationary from 6.9s (centroid drift under 10 px/s after). |
| `V3.mp4` — vehicle strikes a pedestrian at a night intersection | 9.25s – 12.00s | Real impact, timed frame by frame. The pedestrian is upright in the crosswalk at 9.20s and has been struck by 9.30s. The window runs to the end of the clip, through the aftermath. |
| `V5.mp4` — snowy freeway | 24.0s – 29.0s | **Staged.** Ordinary traffic end to end, with no collision, verified by frame-difference analysis. Kept as a scripted demo cue and labelled as such in the source. |

Two of the three windows mark real collisions. `V5` does not and is flagged in the code.

The `V3` source shipped with a red annotation ring burned over the footage. It has been
removed by keying the overlay's colour and inpainting those pixels per frame, so the clip
plays as plain CCTV.

## Stack

**Frontend** — React 18, Vite 5, Tailwind CSS, Radix primitives, `hls.js` for the live
streams, `lucide-react` for icons.

**Backend** — Flask with `flask-cors`, serving a small JSON API:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness plus which optional integrations resolved |
| `GET /api/videos` | Channel list: names, coordinates, stream URLs |
| `POST /api/detect-crash/<clip>` | Incident state at a playback position |
| `POST /api/security-alert` | Dispatches the alert to the configured channel |

**Alerting** — pluggable. `backend/alert_service.py` tries each provider in order and the
first success wins, so deployment picks the channel rather than the code:

- **Discord** (`DISCORD_WEBHOOK_URL`) posts a red embed naming the incident type, location,
  severity and time.
- **Twilio SMS** (the `TWILIO_*` group) sends a one-segment text with the same detail.

Discord is tried first because it carries the full incident text on a free account. A
Twilio *trial* rejects custom message bodies and substitutes canned template text, so it
can deliver a message but not this one — the SMS path needs an upgraded Twilio account.

## Deployment

Deployed to Vercel as a single project. The Vite build is served statically and the Flask
app runs as a Python serverless function via `api/index.py`, with `vercel.json` routing
`/api/*` to it. Frontend and API share an origin, so there is no CORS layer and no backend
URL to configure per environment — `frontend/src/config/api.js` falls back to relative URLs
in production.

The serverless bundle installs only Flask, `flask-cors`, `python-dotenv` and Twilio.
`boto3`, `google-generativeai`, OpenCV, Pillow and NumPy are imported defensively in
`simple_app.py` and are absent from the deployed function — none of the serving endpoints
need them.

Pushes to `main` deploy automatically.

## Running locally

Backend, from `backend/` (Python 3.9+):

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python simple_app.py          # http://localhost:5001
```

Frontend, from `frontend/` (Node 18+):

```bash
npm install
npm run dev                   # http://localhost:3000
```

The frontend targets `http://localhost:5001` in development. Port 5001 is deliberate —
macOS binds 5000 to AirPlay Receiver.

## Configuration

Locally these live in `backend/safesight.env`; in deployment they are environment
variables. None are required — without them every endpoint still works and only the alert
fails, reporting which channel was missing what.

Configure whichever channel you want. Discord needs one value:

```bash
DISCORD_WEBHOOK_URL=          # Server Settings > Integrations > Webhooks
```

Twilio SMS needs four, and an upgraded (non-trial) account:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=          # a number Twilio issued you, the sender
EMERGENCY_PHONE_NUMBER=       # E.164, e.g. +15125550123, the recipient
```

## Layout

```
api/index.py                        Vercel entry point; mounts the Flask app
backend/
  simple_app.py                     Flask app and routes
  real_crash_detector.py            Incident windows and detection lookup
  alert_service.py                  Chooses the configured alert channel
  discord_alert_service.py          Discord webhook alerts
  twilio_alert_service.py           SMS alerts
  load_videos.py                    Channel data loader
  processed_videos.json             Channel definitions
frontend/
  src/pages/Dashboard.js            Dashboard shell
  src/components/SurveillanceGrid.js   Camera grid, detection polling
  src/components/VideoDetailView.js    Per-camera detail, map, alerting
  src/components/LiveStreamPlayer.js   hls.js player
  public/Videos/                    Recorded clips (see CREDITS.md)
vercel.json                         Build and routing config
```

## Known limitations

- Detection runs against fixed windows on three recorded clips. Live feeds are displayed
  and monitored but never analysed — nothing infers on them.
- One of the three clips (`V5`) has no real collision; its trigger is a staged demo cue.
- Public DOT cameras go offline or return no-signal frames without warning. Feeds are
  checked when added, not at runtime, so a dead camera shows as a black tile.
- Twilio trial accounts cannot send custom message bodies at all; they substitute canned
  template text. Custom SMS needs an upgraded account, which is why Discord is the default.

## Credits

Recorded clips are public or permissively licensed footage; sources are listed in
`frontend/public/Videos/CREDITS.md`. Live imagery belongs to the respective state DOTs.
