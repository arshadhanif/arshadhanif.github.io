// Centralised date formatting. We use day-month-year with a short month name
// (e.g. 01-Jan-2026) everywhere - unambiguous and easy to read across regions.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr)
  const d = new Date(s.length <= 10 ? s + 'T00:00:00' : s)
  return isNaN(d) ? null : d
}

// Today's calendar date in the device's LOCAL timezone (YYYY-MM-DD).
// Using local time (not UTC) keeps "today" correct east of UTC, and it follows
// you automatically when you travel since the device's timezone updates.
export function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 01-Jan-2026
export function fmtDate(dateStr) {
  const d = toDate(dateStr)
  if (!d) return ''
  return `${String(d.getDate()).padStart(2, '0')}-${MON[d.getMonth()]}-${d.getFullYear()}`
}

// Format a watched_on date according to how precisely it's known.
export function formatWatched(dateStr, precision) {
  const d = toDate(dateStr)
  if (!d) return 'Date not set'
  if (precision === 'year') return String(d.getFullYear())
  if (precision === 'month') return `${MON[d.getMonth()]}-${d.getFullYear()}`
  return fmtDate(dateStr)
}
