# Oculon

A traffic monitoring dashboard that watches public DOT camera feeds, flags collisions on
recorded incident footage, and places an automated emergency voice call when one fires.

Live: https://oculon-one.vercel.app

## What it does

The dashboard shows 15 channels: 12 live HLS streams pulled straight from state DOT
camera networks, plus 3 recorded incident clips used for demonstration.

Live feeds come from five agencies — Caltrans District 4 (5 cameras), WisDOT (2),
NYSDOT (2), Nevada DOT (2) and Louisiana DOTD (1) — spanning six states. They are public,
unauthenticated HLS endpoints played with `hls.js`.

Recorded clips stay paused until an operator plays them. While one plays, the frontend
polls the backend with the clip's playback position; when the position falls inside that
clip's incident window the dashboard raises an alert and triggers a Twilio voice call to
the configured emergency number.

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
| `V3.mp4` — night intersection | 7.30s – 8.30s | **Staged.** The clip contains no collision. The vehicle marked by the source's burned-in annotation crosses at a constant 60–100 px/s and never contacts anything. |
| `V5.mp4` — snowy freeway | 24.0s – 29.0s | **Staged.** Ordinary traffic end to end, verified by frame-difference analysis. |

Two of the three clips are scripted demo cues, and they are labelled as such in the source.
Only `V1` is a genuine detection.

`yolov8n.pt` and a `CrashDetector` class are present in the repository from earlier work but
are **not** wired into the serving path.

## Stack

**Frontend** — React 18, Vite 5, Tailwind CSS, Radix primitives, `hls.js` for the live
streams, `lucide-react` for icons.

**Backend** — Flask with `flask-cors`, serving a small JSON API:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness plus which optional integrations resolved |
| `GET /api/videos` | Channel list: names, coordinates, stream URLs |
| `POST /api/detect-crash/<clip>` | Incident state at a playback position |
| `POST /api/security-alert` | Places the Twilio voice call |

**Alerting** — Twilio Voice. The API builds TwiML describing the incident and dials the
number in `EMERGENCY_PHONE_NUMBER`.

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
variables. Only the Twilio group is required — without it every endpoint still works and
the call fails with a message naming the missing variables.

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
EMERGENCY_PHONE_NUMBER=       # E.164, e.g. +15125550123
```

On a Twilio trial account the destination number must be verified first, and calls are
prefixed with a trial notice.

## Layout

```
api/index.py                        Vercel entry point; mounts the Flask app
backend/
  simple_app.py                     Flask app and routes
  real_crash_detector.py            Incident windows and detection lookup
  twilio_voice_service.py           Voice call service
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
- Two of the three clips have no real collision; their triggers are staged for demo.
- Public DOT cameras go offline or return no-signal frames without warning. Feeds are
  checked when added, not at runtime, so a dead camera shows as a black tile.
- Twilio trial accounts can only dial verified numbers.

## Credits

Recorded clips are public or permissively licensed footage; sources are listed in
`frontend/public/Videos/CREDITS.md`. Live imagery belongs to the respective state DOTs.
