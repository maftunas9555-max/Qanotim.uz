# Qanotim

A women's personal-growth app: adaptive coaching Q&A with an AI coach chat, daily/weekly/monthly/yearly goal tracking, and a two-stage "Kasb yo'nalishi" (career direction) test built on globally recognized frameworks — the classical four temperaments and Holland's RIASEC career-interest model.

This is the real implementation of the design handed off from Claude Design (see `project/Qanotim.dc.html` and `chats/chat1.md` for the original prototype and the design conversation it came from — kept here for provenance, not used at runtime).

## Layout

```
server/   Express + TypeScript API, SQLite (Node's built-in node:sqlite — no native compiler needed), Google OAuth, Gemini-backed coach chat
web/      Vite + React + TypeScript frontend (mobile-styled, works as a phone-sized card on desktop)
project/  Original Claude Design export bundle (reference only)
chats/    Design conversation transcript (reference only)
```

## Why these frameworks

- **Coaching section**: the exact 10 adaptive questions from the design conversation, scored into three patterns (perfectionism, people-pleasing, quiet self-neglect) plus a named strength, ported verbatim into `server/src/content/coaching.ts`. Once the user sees their analysis, they can start a live conversation with an AI coach (Gemini) that's instructed to use real coaching-skill grounding — active listening, reflection, one open question at a time — rather than generic chat.
- **Kasb yo'nalishi (career direction)**: stage 1 uses the classical four-temperament model (choleric/sanguine/phlegmatic/melancholic); stage 2 uses **Holland's RIASEC model** — the world's most widely used career-interest framework (it underlies O*NET's Interest Profiler and most professional career-guidance tools) — implemented as a genuine 6-type forced-choice inventory (`server/src/content/riasec.ts`), reported back as a two-letter Holland code with a matched track and growth steps.

## Setup

Requires **Node.js 22.5+** (uses the built-in `node:sqlite` module — no native build tools like Visual Studio needed, unlike `better-sqlite3`).

```
cp server/.env.example server/.env
npm install               # installs root, server, and web (npm workspaces)
```

Fill in `server/.env`:
- `GOOGLE_CLIENT_ID` — from Google Cloud Console → Credentials → OAuth client ID (type "Web application"). Add your web app's origin (e.g. `http://localhost:5173`) as an authorized JavaScript origin.
- `GEMINI_API_KEY` — from aistudio.google.com/apikey. Powers the AI coach chat.
- `JWT_SECRET` — any long random string, used to sign session cookies.

Without `GOOGLE_CLIENT_ID`/`GEMINI_API_KEY` the app still boots: the sign-in screen explains Google isn't configured yet, and the coach chat returns a clear "not configured" error instead of crashing. There's no guest/skip option — signing in requires a real Google account.

For local testing without a Google account, set `ALLOW_DEV_LOGIN=1` to enable a name-only login box on the sign-in screen. **Never enable this in production.**

- `ADMIN_PASSWORD` — set this to enable the admin panel at `/admin.html` (served by the API server, e.g. `http://localhost:8787/admin.html`). It lists every user with their goal/coaching counts and subscription status, with a search box and a "+1 oy" button that grants one month of access (stacking on top of any remaining time, not replacing it). Leave it empty to disable the panel entirely (its routes 404).

```
npm run dev       # runs server (:8787) + web (:5173) together
```

Or run them separately: `npm run dev -w server` / `npm run dev -w web`.

Open `http://localhost:5173`. The Google client ID is served from the backend's `/api/health`, so there's nothing to configure on the frontend side.

`npm run build` builds both for production (server → `server/dist`, web → `web/dist`).

## Data model

SQLite file at `server/data/qanotim.db` (created automatically). Tables: `users`, `goals`, `daily_log` (per-day completion snapshots, used for the streak and the weekly activity chart), `coaching_sessions`, `coach_messages`, `kasb_results`.

## Admin panel

`server/public/admin.html` is a small, dependency-free HTML/JS page (no build step, no separate login system) served directly by the API. It's gated by a single shared password (`ADMIN_PASSWORD` in `.env`) sent as a header on every request — proportionate for a single-owner tool, not meant for multiple admin accounts or fine-grained roles. See `server/src/routes/admin.ts` for the two endpoints it uses (`GET /api/admin/users`, `PATCH /api/admin/users/:id/subscription`).

## Notes on scope

- Goals, streak, weekly activity, coaching history and kasb results are all real, persisted per signed-in user — nothing resets on reload.
- The coach chat calls the Gemini API (`gemini-3.6-flash` by default, configurable via `COACH_MODEL`) with a system prompt built from the user's own analysis, so the conversation is grounded in what they actually answered.
- Question and result copy is authored in Uzbek only (matching the original design), while all UI chrome (buttons, labels, nav) is fully bilingual UZ/RU via the profile language toggle.

## Deployment

`npm run start` runs a single process (the Express server) that serves the API *and* the built React app (`web/dist`) together — no separate frontend host or CORS setup needed in production. Deploy it anywhere that keeps a long-running Node process with a persistent disk (Railway, Render, Fly.io); **avoid serverless platforms like Vercel or Firebase Functions** — the SQLite database is a file on disk, and serverless containers don't keep that disk between requests, so user data would randomly disappear.

Steps (Railway):
1. Push this repo to GitHub, then on railway.app: New Project → Deploy from GitHub repo.
2. Railway auto-detects Node and runs `npm install && npm run build`, then `npm run start`.
3. Add a **Volume**, mount it at e.g. `/data`, and set the env var `DATA_DIR=/data` so the SQLite file survives redeploys (without this, every deploy wipes all users/goals/history).
4. Set the same env vars as `server/.env.example`: `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `COACH_MODEL`, `JWT_SECRET` (a real random string), `ADMIN_PASSWORD`, and `NODE_ENV=production`. Leave `WEB_ORIGIN` and `ALLOW_DEV_LOGIN` unset/`0` — the frontend is now served from the same origin, so cross-origin isn't needed.
5. Once deployed, Railway gives a public URL (`https://your-app.up.railway.app`) — add it as an authorized JavaScript origin on the Google OAuth client (Google Cloud Console → Credentials).
