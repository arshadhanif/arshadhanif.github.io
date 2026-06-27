// Client-side notifications state (localStorage). Distinguishes genuinely-new
// episodes (badge-worthy) from your standing catch-up backlog (not a notification).
const K_BASE = 'reelbook.notif.baseline'     // titleId -> aired count you've acknowledged
const K_DISM = 'reelbook.notif.dismissed'    // notification key -> 1
const K_UNREAD = 'reelbook.notif.unread'     // cached badge number

const rd = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {} } catch { return {} } }
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// First time we see a show, record its current aired count so we don't flag
// already-aired episodes as "new".
export function initBaselines(shows) {
  const b = rd(K_BASE); let changed = false
  for (const s of shows) if (s.aired != null && b[s.id] == null) { b[s.id] = s.aired; changed = true }
  if (changed) wr(K_BASE, b)
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

export function dismiss(key) { const d = rd(K_DISM); d[key] = 1; wr(K_DISM, d) }

export function markAllRead(shows) {
  const b = rd(K_BASE)
  for (const s of shows) if (s.aired != null) b[s.id] = s.aired
  wr(K_BASE, b)
  const d = rd(K_DISM)
  for (const s of shows) if (s.next) d[nextKey(s)] = 1
  wr(K_DISM, d)
  wr(K_UNREAD, 0)
}
