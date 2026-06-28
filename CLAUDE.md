# Project rules

## Writing style (STRICT)
- **NEVER use em-dashes (—) or en-dashes (–) anywhere** — not in UI copy, code
  comments, commit messages, PR text, or chat. This is a hard rule the user has
  asked for repeatedly.
- Instead use: a comma, a colon, parentheses, a period (two sentences), or a
  plain hyphen `-` for compound words only. When tempted to write " — ",
  restructure the sentence instead.
- A PreToolUse hook (`.claude/hooks/no-emdash.mjs`) blocks edits that contain
  em/en dashes. If an edit is rejected, remove the dash and retry.

## ReelBook app (in `reelbook/`)
- Deployed to GitHub Pages at `/reelbook-app/`. Build then publish:
  1. Temporarily set the real `VITE_TMDB_TOKEN` in `reelbook/.env`,
     run `VITE_BASE=/reelbook-app/ npm run build`, then restore the placeholder.
  2. Copy `reelbook/dist` to `reelbook-app/` and copy `index.html` to `404.html`.
  3. Commit on the feature branch, then cherry-pick onto `main` (Pages serves `main`).
- `index.html` has no-cache meta so deploys aren't masked by stale HTML.
- Supabase project id: `knarfokskbgtyrphibvm` (use `net.http_get` to verify the
  live bundle hash after deploy).
