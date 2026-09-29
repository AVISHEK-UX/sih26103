# Deploying PRAGUKTI

Two services, two hosts. The frontend goes to Vercel; the backend cannot, and goes to Render.

## Why the backend is not on Vercel

| Constraint | Vercel serverless | This backend |
|---|---|---|
| Bundle size | 250 MB unzipped | ~540 MB installed (xgboost, shap → llvmlite/numba, scipy, pandas, scikit-learn, pyproj) |
| Filesystem | Read-only except ephemeral `/tmp` | Writes SQLite analyses, uploaded PDFs, GIS boundary + assessment stores |
| Cold start | 10 s function limit on Hobby | Model + SHAP explainer load takes ~15 s |

Render's free web service gives a real container with a writable disk and no request timeout, so nothing has to be cut.

---

## Step 1 — Backend on Render

1. Go to <https://render.com> and sign in with GitHub.
2. **New → Blueprint**, pick the `sih26103` repo. Render reads `render.yaml` and configures the service itself.
3. Before the first deploy, set two environment variables in the dashboard:

   - `GIS_API_TOKENS` — generate it locally first:
     ```bash
     cd backend && source venv/bin/activate
     python scripts/generate_api_tokens.py
     ```
     Copy the JSON registry into this variable, and keep the raw token it prints once — Step 2 needs it.
   - `ALLOWED_ORIGINS` — leave blank for now; fill it in after Step 2 gives you the Vercel URL.

4. Deploy. The first build takes 5–10 minutes (it compiles the ML wheels).
5. Confirm it is live: `https://<your-service>.onrender.com/health` should report every engine as `loaded` / `ready`.

> The free plan sleeps after 15 minutes idle, so the first request after a pause takes ~30 s to wake. For a live demo, hit the URL a minute beforehand.

## Step 2 — Frontend on Vercel

```bash
cd /Users/avishekpaswan/sih2026/sih26103
npx vercel login      # opens the browser
npx vercel            # preview deploy; accept the detected Next.js defaults
npx vercel --prod     # production deploy
```

Then in the Vercel dashboard, under **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the Render URL from Step 1, no trailing slash |
| `GIS_API_TOKEN` | the raw token printed in Step 1 |

Redeploy after adding them (`npx vercel --prod`) — Next.js bakes `NEXT_PUBLIC_*` in at build time.

## Step 3 — Connect the two

Back in Render, set `ALLOWED_ORIGINS` to your Vercel production URL, for example:

```
https://pragukti.vercel.app
```

Save; Render restarts automatically. Without this the browser blocks every API call with a CORS error.

## Step 4 — Verify

Open the Vercel URL and check:

- `/landing` shows real figures (proves the portfolio API is reachable)
- `/dashboard` renders every chart
- `/projects` → open one → **Run AI analysis** → risk %, SHAP factors, historical matches
- `/gis-check` → enter `26.8467`, `80.9462` → map draws the buffer ring
- `/documents` → upload a PDF → fields extract

---

## Alternative: everything on Render

Simpler for a one-off demo — one host, one URL, no CORS setup. Add a second service to `render.yaml`:

```yaml
  - type: web
    name: pragukti-web
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://pragukti-api.onrender.com
      - key: GIS_API_TOKEN
        sync: false
```

You lose Vercel's CDN and preview deploys, but there is one less thing to wire up.

## Note on data

`boundaries.geojson`, the auth registry and `saved_analyses.db` are gitignored runtime state, not source. The Render build runs `seed_gis_boundaries.py` to recreate the boundary store from the committed `demo_boundaries.geojson`. Saved analyses and uploaded documents start empty on a fresh deploy, and on the free plan they are lost when the instance restarts — attach a Render persistent disk if they need to survive.
