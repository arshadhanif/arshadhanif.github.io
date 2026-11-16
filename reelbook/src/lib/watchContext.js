// Where you watched something, and on what service. Shared by the Mark-watched
// modal (title level) and the episode tracker (per episode) so the two can't
// drift apart and produce two spellings of the same platform.
export const WHERE_OPTIONS = ['Cinema / Theatre', 'TV', 'Laptop', 'Computer', 'Mobile', 'Tablet', 'Projector', 'Other']
export const SERVICE_OPTIONS = ['Netflix', 'Prime Video', 'Disney+', 'Disney+ Hotstar', 'OSN+',
  'Apple TV+', 'Shahid', 'StarzPlay', 'Max', 'Hulu', 'YouTube', 'Cinema', 'Other']

// Remember the last where/service you picked, so ticking 20 episodes doesn't
// mean choosing Netflix 20 times. Stored per device, like the other prefs.
import { getPref, setPref } from './prefs'

// Where you watch most of the time, set in Settings. A default rather than a
// memory on purpose: picking Laptop once should not silently reroute
// everything logged afterwards. TV is the fallback, which is where Arshad has
// watched almost everything since May 2026.
export const DEFAULT_WHERE = 'TV'
export function defaultWhere() {
  const v = getPref('defaultWhere', DEFAULT_WHERE)
  return v === '' ? '' : (WHERE_OPTIONS.includes(v) ? v : DEFAULT_WHERE)
}

// The service does stay a memory: it changes per show, and ticking 20 episodes
// should not mean choosing Netflix 20 times.
export function lastWatchContext() {
  return { whereWatched: defaultWhere(), service: getPref('lastService', '') || '' }
}

export function rememberWatchContext({ service }) {
  if (service) setPref('lastService', service)
}
