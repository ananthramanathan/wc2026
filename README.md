# WC2026 Predictor

Mobile-first World Cup 2026 predictor for friends & family. Pick scores, see a live leaderboard, talk trash. Next.js 16 + Supabase + Vercel.

## Setup (first time, ~15 min)

### 1. Supabase
1. New project at supabase.com (region: closest to friends).
2. **Auth → Providers → Google**: enable, paste the Google OAuth client ID/secret. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel>.vercel.app/auth/callback`
3. **SQL editor**: paste `supabase/migrations/001_init.sql`, run.
4. **Settings → API**: copy URL, anon key, service role key into `.env.local`.

### 2. API-Football
1. Sign up at [api-football.com](https://www.api-football.com/) (free tier = 100 req/day).
2. Copy your key → `API_FOOTBALL_KEY` in `.env.local`.
3. World Cup league ID is `1` and the season tag is `2026` — defaults already set.

### 3. `.env.local`
Copy `.env.example` → `.env.local` and fill in.

### 4. Seed the matches
```bash
npm install
npm run seed
```
This pulls all 104 fixtures + any already-played scores into the `matches` table.

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000.

## Deploy

```bash
gh repo create wc2026 --private --source=. --remote=origin --push
```
Then import the repo on vercel.com. Add the same env vars in Vercel project settings. Vercel will pick up `vercel.json` and schedule the crons automatically.

## Architecture

- **Pages**: Login → Onboarding → Today / Fixtures / Profile / Leaderboards (mobile-only layout, bottom nav)
- **Auth**: Supabase Google OAuth, session refreshed via `proxy.ts` (Next.js 16 proxy fka middleware)
- **Predict**: bottom-sheet, server action `app/actions/savePrediction.ts`. Database trigger rejects late edits (don't trust client time).
- **Scoring**: SQL view `v_scored_predictions` computes 1 / 1.5 / 3 pts per match; `v_leaderboard` aggregates per user.
- **Crons**: lock (5m), ingest-results (15m), odds (3h), resolve-knockouts (daily). Guarded by `CRON_SECRET`.

## What's stubbed

- **Fallback LLM agent for missing results** (brief §Automations) — not built yet. If API-Football misses a final score, fix manually in the DB or wire the agent later.
- **PWA manifest / install prompt** — skipped for v1; iOS Safari "Add to home screen" still works on the responsive layout.
- **Custom avatar upload** — preset grid only.

## Manual ops

- **Force-rerun a cron**:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-vercel>.vercel.app/api/cron/ingest-results`
- **Backfill a missing result**: edit the row in `matches`; the scoring view recomputes on read.
