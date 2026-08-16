# Deployment

Oculon deploys to Vercel as one project: the Vite build is served statically and the Flask
API runs as a Python serverless function. `vercel.json` handles build and routing, so the
project needs no framework preset and no custom build settings in the dashboard.

## First-time setup

1. Import the repository at vercel.com/new.
2. Leave **Root Directory** empty (repository root). It must not be set to `frontend` —
   `vercel.json`, `api/` and `requirements.txt` all live at the root, and pointing the root
   at `frontend/` makes Vercel ignore them and serve nothing.
3. Accept the detected settings. `vercel.json` supplies the build command
   (`cd frontend && npm install && npm run build`) and output directory (`frontend/dist`).
4. Add the environment variables below.
5. Deploy. Subsequent pushes to `main` deploy automatically.

## Environment variables

Set these under Settings → Environment Variables. None are needed for the dashboard,
channel list or detection endpoints to work; they are required only for the emergency call.

| Variable | Notes |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | From the Twilio console |
| `TWILIO_AUTH_TOKEN` | From the Twilio console |
| `TWILIO_PHONE_NUMBER` | A voice-capable Twilio number, E.164 |
| `EMERGENCY_PHONE_NUMBER` | Number to dial, E.164 |

`GET /api/health` reports which optional integrations resolved, and a failed call names the
specific variables that are missing rather than failing generically.

Credentials are never committed. `backend/safesight.env` holds them locally and is
gitignored.

## Deploying from the CLI

Useful when the Git integration is unavailable — the CLI reads the local `vercel.json`
directly and does not depend on the project's dashboard settings.

```bash
npm i -g vercel
vercel login
vercel link --project oculon
vercel deploy --prod
```

The Python builder requires `uv` on PATH for local builds (`brew install uv`).

## Notes from setting this up

Things that cost time and are not obvious:

**Do not add a `.vercelignore`.** Any path listed in it that exists locally causes the build
to fail with `ENOENT: no such file or directory, lstat '/vercel/path0/<path>'`. Vercel already
honours `.gitignore`, which excludes `backend/venv/` and `node_modules/`, so the upload stays
small without one.

**A project can show "Connect Git Repository ✓" while having no repository linked.** If pushes
do not trigger builds, check the project's `link` field via the API — if it is `null`, nothing
is connected regardless of what the checklist says.

**Connecting a repository requires the Vercel GitHub App on the repository owner's account,**
not merely push access to the repository. Connecting a repo owned by another account fails
until that owner installs the app.

**A deployment that builds in ~2 seconds did not really build.** That is the signature of
Vercel finding no build command and publishing an empty output — usually because the commit
predates `vercel.json`, which surfaces as `NOT_FOUND` on every route.

## Local development

See the README. Backend on port 5001, frontend on 3000.
