// Maps a user's subscription service names to TMDB watch-provider ids for a
// given region, and picks a watch region from their subscription currencies.

// Country to use for TMDB watch_region, inferred from subscription currency.
const CURRENCY_REGION = { SAR: 'SA', AED: 'AE', QAR: 'QA', PKR: 'PK', INR: 'IN', USD: 'US', GBP: 'GB', EUR: 'DE' }

export function regionFromSubs(subs) {
  const counts = {}
  for (const s of subs || []) {
    if (!s.active) continue
    const r = CURRENCY_REGION[s.currency]
    if (r) counts[r] = (counts[r] || 0) + 1
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : 'US'
}

// Normalise a name for fuzzy matching (drop punctuation/“plus”/“vip” noise).
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(vip|premium|streaming|tv|video|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Hints to bridge common naming differences (sub name -> words that appear in
// the TMDB provider name for that service).
const ALIASES = {
  'prime video': 'amazon prime',
  'prime': 'amazon prime',
  'disney plus': 'disney',
  'apple tv plus': 'apple',
  'max': 'max',
  'osn plus': 'osn',
  'shahid': 'shahid',
  'starzplay': 'starzplay',
  'starz play': 'starzplay',
}

// Given the user's active subscription names and TMDB's provider list for the
// region, return the matching provider ids.
export function matchProviderIds(subNames, providerList) {
  const providers = providerList.map((p) => ({ id: p.id, n: norm(p.name) }))
  const ids = new Set()
  for (const raw of subNames) {
    const key = norm(raw)
    if (!key) continue
    const needle = ALIASES[key] || key
    const hit = providers.find((p) => p.n === needle || p.n.includes(needle) || needle.includes(p.n))
    if (hit) ids.add(hit.id)
  }
  return [...ids]
}
