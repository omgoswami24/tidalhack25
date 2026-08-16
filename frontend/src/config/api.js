// Backend API base URL.
//
// On Vercel the API is served from the same deployment (api/index.py, routed by
// vercel.json), so an empty base makes requests same-origin - no CORS, no URL to
// configure per environment. VITE_API_URL still overrides it if the backend is
// ever hosted separately. Locally it falls back to the Flask dev server.
const sameOrigin = '';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? sameOrigin : 'http://localhost:5001');
