// Appearance: light/dark/system theme + accent colour. Stored in local prefs
// and applied to <html> (data-theme attribute + CSS custom properties).
import { getPref, setPref } from './prefs'

export const ACCENTS = {
  gold: '#e8a838', blue: '#5b9aff', pink: '#ff6b9d', green: '#4ecb71',
  purple: '#b46bff', orange: '#ff8c42', teal: '#42d4d4', red: '#ff5c5c',
}

// Selectable themes (id matches the html[data-theme] CSS blocks). bg/fg are
// preview swatch colours; `system` follows the OS setting.
export const THEMES = [
  { id: 'system', label: 'System', bg: 'linear-gradient(135deg,#0e1018 0 50%,#f5f7fa 50% 100%)', fg: '#9aa3b4' },
  { id: 'dark', label: 'Dark', bg: '#0e1018', fg: '#eef1f7' },
  { id: 'light', label: 'Light', bg: '#f5f7fa', fg: '#141821' },
  { id: 'oled', label: 'OLED', bg: '#000000', fg: '#f2f3f7' },
  { id: 'slate', label: 'Slate', bg: '#0f172a', fg: '#e8eef7' },
  { id: 'mocha', label: 'Mocha', bg: '#1c1714', fg: '#f3ece2' },
  { id: 'sepia', label: 'Sepia', bg: '#f4ecd8', fg: '#3a3326' },
]
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
