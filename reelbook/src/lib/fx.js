// Currency conversion via a free, no-key rates API (open.er-api.com),
// cached in localStorage for the day. Base is USD; we cross-convert.
const KEY = 'reelbook.fx.v1'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getRates() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && s.day === today() && s.rates) return s.rates
  } catch {}
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const d = await res.json()
    if (d && d.result === 'success' && d.rates) {
      try { localStorage.setItem(KEY, JSON.stringify({ day: today(), rates: d.rates })) } catch {}
      return d.rates
    }
  } catch {}
  // fall back to any cached rates, even if stale
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.rates) return s.rates } catch {}
  return null
}

// Convert `amount` from one ISO currency to another using USD-based rates.
export function convert(amount, from, to, rates) {
  if (from === to) return amount
  if (!rates) return null
  const rf = rates[from], rt = rates[to]
  if (!rf || !rt) return null
  return (amount / rf) * rt
}
