// Format a watched_on date according to how precisely it's known.
export function formatWatched(dateStr, precision) {
  if (!dateStr) return 'Date not set'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return 'Date not set'
  if (precision === 'year') return String(d.getFullYear())
  if (precision === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
