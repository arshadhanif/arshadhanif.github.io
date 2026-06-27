# ReelBook 🎬

A private movie & TV tracking web app for Arshad & Muneeza. Combines the best of
IMDb / TV Time / Simkl / Letterboxd, plus two things they don't do:

1. **Groups** — every watch is tagged with *who watched it* (e.g. "Arshad & Muneeza",
   "Just Arshad", "Family"). Lists are filtered views per group, never separate copies.
2. **Dual ratings** — each title can be rated /10 separately by each person, enabling
   "where we disagree" views and per-person averages.

## Tech
- **Frontend:** React + Vite (web first; iOS later via Expo reusing the same backend)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Metadata:** TMDB API

> This product uses the TMDB API but is not endorsed or certified by TMDB.

## Run locally

```bash
cd reelbook
npm install
cp .env.example .env      # then paste your TMDB token into .env
npm run dev               # opens http://localhost:5173
```

### Environment variables (`reelbook/.env`)
| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `VITE_TMDB_TOKEN` | TMDB **API Read Access Token** (v4 bearer) |

The `.env` file is git-ignored — never commit real keys.

## Features
- **Discover** — TMDB search, add to a watchlist or mark watched
- **Watchlist** — per-group, mark watched moves it to the diary
- **Mark as watched** — pick group, date, episodes (for TV), dual /10 ratings, note
- **Diary** — full history with dual ratings; edit ratings/notes/progress inline
- **Lists** — by-group views + "Where we disagree" (rating gaps)
- **Groups** — create groups, add members without logins (just names), set colours
- **Import** — IMDb ratings CSV + TV Time CSV/JSON → matched to TMDB → merged in
- **Insights** — per-person averages (preview; full version deferred)

## Structure
```
src/
  lib/        supabase client, tmdb client, db (data access)
  context/    AuthContext, AppData (groups + profiles)
  components/ Layout, MarkWatchedModal, shared ui (Poster, StarRating, …)
  pages/      Login, Discover, Watchlist, Diary, Lists, Groups, Import, About, Insights
```
