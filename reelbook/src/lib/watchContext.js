// Where you watched something, and on what service. Shared by the Mark-watched
// modal (title level) and the episode tracker (per episode) so the two can't
// drift apart and produce two spellings of the same platform.
export const WHERE_OPTIONS = ['Cinema / Theatre', 'TV', 'Laptop', 'Computer', 'Mobile', 'Tablet', 'Projector', 'Other']
export const SERVICE_OPTIONS = ['Netflix', 'Prime Video', 'Disney+', 'Disney+ Hotstar', 'OSN+', 'OSN',
  'Apple TV+', 'Shahid', 'StarzPlay', 'Max', 'Hulu', 'YouTube', 'Cinema', 'Other']

// Remember the last where/service you picked, so ticking 20 episodes doesn't
// mean choosing Netflix 20 times. Stored per device, like the other prefs.
import { getPref, setPref } from './prefs'

export function lastWatchContext() {
  return { whereWatched: getPref('lastWhere', '') || '', service: getPref('lastService', '') || '' }
}

export function rememberWatchContext({ whereWatched, service }) {
  if (whereWatched) setPref('lastWhere', whereWatched)
  if (service) setPref('lastService', service)
}
