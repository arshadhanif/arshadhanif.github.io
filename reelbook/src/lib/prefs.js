// Lightweight user preferences, stored locally (no schema change).
const KEY = 'reelbook.prefs'
export const DEFAULT_REGION = 'SA'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
function write(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {}
}
export function getPref(key, fallback) {
  const v = read()[key]
  return v === undefined || v === null ? fallback : v
}
export function setPref(key, value) {
  const p = read(); p[key] = value; write(p)
}

// Common regions for the "Where to watch" default selector.
export const REGIONS = ['SA', 'AE', 'PK', 'IN', 'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'EG', 'QA', 'KW', 'BH', 'OM']
export function regionName(code) {
  try { return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) || code }
  catch { return code }
}
