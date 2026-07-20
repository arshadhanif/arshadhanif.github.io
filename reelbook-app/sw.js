// ReelBook service worker: minimal, safe app-shell caching.
// BUILD is stamped with the deployed bundle hash on every deploy, so this file
// changes each release. That makes the browser detect a new service worker,
// re-install, purge the old cache and claim clients with fresh assets. Without
// it a PWA / mobile browser can serve a stale bundle indefinitely.
const BUILD = 'DG9Wnp6w'
const CACHE = `reelbook-${BUILD}`
// Relative to the SW's own scope so this works whether served at '/' or a subpath.
const SHELL = ['./', './icon-192.png', './icon-512.png', './manifest.webmanifest']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}))
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

// ---- Web Push ----
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { body: e.data && e.data.text() } }
  const title = data.title || 'ReelBook'
  const options = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: data.url || '/notifications' },
    tag: data.tag || undefined,
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/notifications'
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus() }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url)
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // Never intercept Supabase / TMDB / other origins — let them hit the network.
  if (url.origin !== self.location.origin) return

  // Navigations: network-first (avoids stale HTML), fall back to cached shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./')))
    return
  }

  // Same-origin static assets (hashed filenames): cache-first.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
    )
  )
})
