// Appearance: light/dark/system theme + accent colour. Stored in local prefs
// and applied to <html> (data-theme attribute + CSS custom properties).
import { getPref, setPref } from './prefs'

export const ACCENTS = {
  gold: '#e8a838', blue: '#5b9aff', pink: '#ff6b9d', green: '#4ecb71',
  purple: '#b46bff', orange: '#ff8c42', teal: '#42d4d4', red: '#ff5c5c',
}
const mq = () => window.matchMedia('(prefers-color-scheme: light)')

export function resolveTheme(mode) {
  const m = mode || getPref('theme', 'dark')
  return m === 'system' ? (mq().matches ? 'light' : 'dark') : m
}

export function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', resolveTheme(mode))
}

export function applyAccent(name) {
  const c = ACCENTS[name || getPref('accent', 'gold')] || ACCENTS.gold
  const root = document.documentElement.style
  root.setProperty('--accent', c)
  root.setProperty('--accent-soft', c + '22')
}

// Call once at startup, before first paint where possible.
export function initAppearance() {
  applyTheme(getPref('theme', 'dark'))
  applyAccent(getPref('accent', 'gold'))
  const m = mq()
  const onChange = () => { if (getPref('theme', 'dark') === 'system') applyTheme('system') }
  m.addEventListener ? m.addEventListener('change', onChange) : m.addListener?.(onChange)
}

export function setTheme(mode) { setPref('theme', mode); applyTheme(mode) }
export function setAccent(name) { setPref('accent', name); applyAccent(name) }
