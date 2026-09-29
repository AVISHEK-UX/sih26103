# Deploying PRAGUKTI

Two services on two hosts: the Next.js frontend on Vercel, the FastAPI backend on Render.

## Why the backend is not on Vercel

| | Vercel serverless | This backend |
|---|---|---|
| Bundle size | 250 MB unzipped | ~540 MB installed — xgboost, shap (pulls llvmlite + numba), scipy, pandas, scikit-learn, pyproj |
| Filesystem | Read-only except an ephemeral `/tmp` | Writes the SQLite analyses store, uploaded documents, and the GIS boundary and assessment stores |
| Startup | 10 s function limit on Hobby | Model and SHAP explainer take ~15 s to load |

Render's free web service is a real container with a writable disk and no request timeout, so nothing has to be cut.

---

## Step 1 — Backend on Render

Generate the token registry first, locally:

```bash
cd backend && source venv/bin/activate
python scripts/generate_api_tokens.py
```

It prints the JSON registry and the raw token. Keep both: the registry goes to Render, the raw token to Vercel in Step 2. The raw token is shown once and is not recoverable.

Then:

1. Sign in to <https://render.com> with GitHub.
2. **New → Blueprint**, select the `sih26103` repo. Render reads `render.yaml` and configures the service.
3. Set the two variables marked `sync: false`:

   | Variable | Value |
   |---|---|
   | `GIS_API_TOKENS` | the JSON registry from above |
   | `CORS_ORIGINS` | leave empty for now — Step 3 fills it in |

4. Deploy. The first build takes 5–10 minutes while the ML wheels install.
5. Check `https://<service>.onrender.com/health`. Every engine should report `loaded` or `ready`.

> **GIS boundaries.** `backend/data/gis/boundaries.geojson` is gitignored runtime state, so a fresh server starts with an empty boundary store and collision checks screen against nothing. Seed it once from the committed demo dataset — either add `&& python scripts/seed_gis_boundaries.py` to the build command in `render.yaml`, or run it once from the Render shell.

> **Free plan sleeps** after 15 minutes idle and takes ~30 s to wake. Open the URL a minute before a live demo.

## Step 2 — Frontend on Vercel

```bash
cd /Users/avishekpaswan/sih2026/sih26103
npx vercel login
npx vercel --prod
```

Accept the detected Next.js settings. Then in **Settings → Environment Variables** add all three:

| Variable | Value | Visibility |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | the Render URL, no trailing slash | shipped to the browser |
| `GIS_API_URL` | the same Render URL | server-only |
| `GIS_API_TOKEN` | the raw token from Step 1 | server-only |

Redeploy with `npx vercel --prod` afterwards — `NEXT_PUBLIC_*` values are compiled into the bundle at build time, so they do not take effect until a rebuild.

## Step 3 — Connect them

In Render, set `CORS_ORIGINS` to the Vercel production URL:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Render restarts on save. Without this the browser blocks every API call with a CORS error. Multiple origins are comma-separated; whitespace around each is ignored.

## Step 4 — Verify

Open the Vercel URL:

- `/landing` — real figures mean the portfolio API is reachable
- `/dashboard` — every chart renders
- `/projects` → open one → **Run AI analysis** → risk %, SHAP factors, historical matches
- `/gis-check` → `26.8467`, `80.9462` → the buffer ring draws (needs the boundary store seeded)
- `/documents` → upload a PDF → fields extract

---

## Environment variables at a glance

**Render (backend)** — see `backend/.env.example`

| Variable | Required | Purpose |
|---|---|---|
| `GIS_API_TOKENS` | yes | Bearer token registry as inline JSON |
| `CORS_ORIGINS` | yes | Comma-separated allowed browser origins |
| `PYTHON_VERSION` | set in `render.yaml` | 3.12.7 |
| `GIS_AUTH_MODE` | no | `token` by default; `disabled` is local-only |
| `SAVED_ANALYSES_DB`, `UPLOAD_DIR` | no | Override the write paths for a mounted disk |
| `MSG91_*`, `MINISTRY_ALERT_PHONE` | no | SLA SMS escalation; off unless `MSG91_ENABLED=true` |

**Vercel (frontend)** — see `.env.example`

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend URL for browser-side calls. Public — never a secret |
| `GIS_API_URL` | yes | Backend URL for the server-side GIS proxy |
| `GIS_API_TOKEN` | yes | Bearer token, server-only, never reaches the browser |

## Data that does not deploy

`boundaries.geojson`, `backend/data/auth/api_tokens.json`, `saved_analyses.db` and `backend/uploads/` are gitignored runtime state rather than source. Saved analyses and uploads start empty on a fresh deploy, and on the free plan they are lost on restart — attach a Render persistent disk and point `SAVED_ANALYSES_DB` and `UPLOAD_DIR` at it if they need to survive.
