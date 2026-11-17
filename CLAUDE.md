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

## ReelBook / WatchLog (removed)
- The app formerly served here at `/reelbook-app/` was renamed to
  WatchLog and moved to its own repo, deployed on Cloudflare Workers.
- `reelbook/` and `reelbook-app/` were deleted from this repo. Do not
  re-add them; the history is still in git if you need the old files.
