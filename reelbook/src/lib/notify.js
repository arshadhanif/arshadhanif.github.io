// Cross-device notification state. localStorage is a fast local cache; the
// source of truth is the per-user `notif_state` table in Supabase, so baselines,
// dismissals and read-status follow you across phones and laptops.
//
// The public API stays synchronous (it reads/writes the local cache so the UI
// is instant); every mutation also writes through to the server in the
// background, and `syncNotifState()` hydrates the cache from the server on load.
import { loadNotifState, saveNotifState, saveNotifBaselines } from './db'

const K_BASE = 'reelbook.notif.baseline'     // titleId -> aired count you've acknowledged
const K_DISM = 'reelbook.notif.dismissed'    // notification key -> 1
const K_UNREAD = 'reelbook.notif.unread'     // cached badge number

const rd = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {} } catch { return {} } }
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// Dismissed keys are stored flat in localStorage (`new:42`, `next:42:2-3`) but
// grouped per-title on the server. Helpers to map between the two shapes.
const titleOfKey = (key) => key.split(':')[1]   // new:<id> / next:<id>:<s-e>

// Pull server state into the local cache (server wins on conflicts). Call on app
// load. Returns true if anything changed so callers can refresh the badge.
export async function syncNotifState() {
  let rows
  try { rows = await loadNotifState() } catch { return false }
  const base = rd(K_BASE), dism = rd(K_DISM)
  for (const r of rows) {
    if (r.baseline_aired != null) base[r.title_id] = r.baseline_aired
    const d = r.dismissed || {}
    for (const k of Object.keys(d)) dism[k] = 1
  }
  wr(K_BASE, base); wr(K_DISM, dism)
  return true
}

// Collect the dismissed keys for one title back into the server's grouped shape.
function dismissedForTitle(titleId) {
  const d = rd(K_DISM), out = {}
  for (const k of Object.keys(d)) if (titleOfKey(k) === String(titleId)) out[k] = 1
  return out
}

// First time we see a show, record its current aired count so we don't flag
// already-aired episodes as "new". New baselines are pushed to the server.
export function initBaselines(shows) {
  const b = rd(K_BASE); const fresh = {}
  for (const s of shows) if (s.aired != null && b[s.id] == null) { b[s.id] = s.aired; fresh[s.id] = s.aired }
  if (Object.keys(fresh).length) {
    wr(K_BASE, b)
    saveNotifBaselines(fresh).catch(() => {})   // write-through
  }
  return b
}

const nextKey = (s) => `next:${s.id}:${s.next?.season}-${s.next?.episode}`

// shows: [{ id, title, tmdb_id, media_type, poster_path, watched, aired, next }]
export function buildNotifications(shows) {
  const b = rd(K_BASE), d = rd(K_DISM)
  const soon = Date.now() + 21 * 864e5
  const newItems = [], comingItems = [], catchItems = []
  for (const s of shows) {
    const base = b[s.id] ?? s.aired ?? 0
    const newCount = s.aired != null ? Math.max(0, s.aired - base) : 0
    if (newCount > 0 && !d[`new:${s.id}`]) newItems.push({ ...s, count: newCount, key: `new:${s.id}` })
    if (s.next?.air_date) {
      const t = new Date(s.next.air_date + 'T00:00:00').getTime()
      if (t <= soon && !d[nextKey(s)]) comingItems.push({ ...s, key: nextKey(s) })
    }
    const unwatched = s.aired != null ? Math.max(0, s.aired - s.watched) : 0
    if (unwatched > 0) catchItems.push({ ...s, unwatched })
  }
  catchItems.sort((a, b2) => b2.unwatched - a.unwatched)
  const unread = newItems.length + comingItems.length
  wr(K_UNREAD, unread)
  return { newItems, comingItems, catchItems, unread }
}

export function getUnread() { return Number(localStorage.getItem(K_UNREAD) || 0) }

export function dismiss(key) {
  const d = rd(K_DISM); d[key] = 1; wr(K_DISM, d)
  const titleId = titleOfKey(key)
  saveNotifState({ titleId, dismissed: dismissedForTitle(titleId) }).catch(() => {})   // write-through
}

export function markAllRead(shows) {
  const b = rd(K_BASE), d = rd(K_DISM)
  const baselineUpdates = {}
  for (const s of shows) if (s.aired != null) { b[s.id] = s.aired; baselineUpdates[s.id] = s.aired }
  for (const s of shows) if (s.next) d[nextKey(s)] = 1
  wr(K_BASE, b); wr(K_DISM, d); wr(K_UNREAD, 0)
  // Write-through: one upsert per touched title carrying its new baseline + dismissals.
  for (const s of shows) {
    if (s.aired == null && !s.next) continue
    saveNotifState({
      titleId: s.id,
      baselineAired: s.aired != null ? s.aired : undefined,
      dismissed: dismissedForTitle(s.id),
    }).catch(() => {})
  }
}
