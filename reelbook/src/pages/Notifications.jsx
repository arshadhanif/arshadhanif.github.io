import { useEffect, useState } from 'react'
import { listTrackedShows, setTitleTotalEpisodes } from '../lib/db'
import { getTvStatus } from '../lib/tmdb'
import { initBaselines, buildNotifications, dismiss, markAllRead, syncNotifState } from '../lib/notify'
import { Poster, Spinner, Empty, TitleLink } from '../components/ui'
import { fmtDate } from '../lib/dates'

// How many shows get a live TMDB lookup, and how many at a time. tracked_shows()
// returns shows most recently watched first, so these are the ones where an
// "airing next" date is actually useful.
const LIVE_LIMIT = 40
const LIVE_BATCH = 6

// Reject if a promise takes too long, so one hung TMDB request can't stall the
// whole background refresh (the underlying fetch is left to resolve on its own).
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export default function Notifications() {
  const [shows, setShows] = useState([])
  const [notif, setNotif] = useState({ newItems: [], comingItems: [], catchItems: [], catchTotal: 0, unread: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('new')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await syncNotifState().catch(() => {})
        // Every tracked show, not an arbitrary sample. The cached pass below is
        // free (one RPC row per show) and the nightly push job now keeps
        // total_episodes fresh, so a show no longer has to win a 60-row lottery
        // to have its new episodes noticed.
        let tracked = []
        try { tracked = await listTrackedShows() } catch { tracked = [] }
        // Render immediately from cached episode counts. The page must never
        // block on TMDB: a single hung request would otherwise freeze it.
        const base = tracked.map((s) => ({
          id: s.title.id, title: s.title, tmdb_id: s.title.tmdb_id, media_type: 'tv',
          poster_path: s.title.poster_path, watched: s.watched, aired: s.cachedTotal || null, next: null,
        }))
        if (alive) {
          setShows(base)
          initBaselines(base)
          const n = buildNotifications(base)
          setNotif(n)
          setTab(n.newItems.length ? 'new' : n.comingItems.length ? 'coming' : 'catch')
          setLoading(false)
        }
        // Enrich with live TMDB status (aired counts + next episode). Only the
        // most recently watched shows get a live call ("Coming up" needs the
        // next air date, which nothing caches), and they go in small batches
        // rather than all at once: firing 60 parallel requests was what got us
        // rate-limited, which is how live counts went missing in the first
        // place. Cached rows are kept for everything else and on failure.
        const live = base.slice(0, LIVE_LIMIT)
        const objs = base.slice()
        for (let i = 0; i < live.length; i += LIVE_BATCH) {
          if (!alive) return
          const chunk = live.slice(i, i + LIVE_BATCH)
          const out = await Promise.allSettled(chunk.map(async (s) => {
            const st = await withTimeout(getTvStatus(s.tmdb_id), 8000)
            const aired = st.aired_episodes ?? st.number_of_episodes ?? s.aired
            if (aired && aired !== s.aired) setTitleTotalEpisodes(s.id, aired).catch(() => {})
            return { ...s, aired, next: st.next_episode }
          }))
          out.forEach((r, j) => { if (r.status === 'fulfilled') objs[i + j] = r.value })
        }
        if (!alive) return
        setShows(objs)
        initBaselines(objs)
        setNotif(buildNotifications(objs))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  function refresh() { setNotif(buildNotifications(shows)) }
  function onDismiss(key) { dismiss(key); refresh() }
  function onMarkRead() { markAllRead(shows); refresh() }

  if (loading) return <div className="page"><Spinner label="Checking your shows…" /></div>

  const TABS = [
    ['new', 'New', notif.newItems.length],
    ['coming', 'Coming up', notif.comingItems.length],
    ['catch', 'Catch up', notif.catchTotal ?? notif.catchItems.length],
  ]
  const catchHidden = Math.max(0, (notif.catchTotal ?? 0) - notif.catchItems.length)
  const list = tab === 'new' ? notif.newItems : tab === 'coming' ? notif.comingItems : notif.catchItems

  return (
    <div className="page">
      <div className="page-head">
        <h1>Notifications</h1>
        {notif.unread > 0 && <button className="btn sm" onClick={onMarkRead}>Mark all read</button>}
      </div>
      <p className="sub">New episodes get flagged here. Your ongoing backlog lives under “Catch up.”</p>

      <div className="seg" style={{ marginBottom: 16 }}>
        {TABS.map(([v, l, c]) => (
          <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>
            {l}{c > 0 ? ` (${c})` : ''}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty icon={tab === 'new' ? '🔔' : tab === 'coming' ? '📅' : '🍿'}>
          {tab === 'new' ? 'No new episodes. You’re all caught up on new releases.'
            : tab === 'coming' ? 'Nothing airing in the next few weeks.'
            : 'No shows to catch up on.'}
        </Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((s) => (
            <div className="card row" key={s.key || s.id} style={{ gap: 12, alignItems: 'center' }}>
              <TitleLink className="tile" tmdbId={s.tmdb_id} media="tv" style={{ width: 46, flexShrink: 0 }}>
                <Poster title={s.title.title} mediaType="tv" posterPath={s.poster_path} />
              </TitleLink>
              <TitleLink className="" tmdbId={s.tmdb_id} media="tv" style={{ flex: 1, minWidth: 0 }}>
                <strong>{s.title.title}</strong>
                <div className="faint" style={{ marginTop: 3 }}>
                  {tab === 'new' && `🆕 ${s.count} new episode${s.count > 1 ? 's' : ''} aired`}
                  {tab === 'coming' && `📅 Next: S${s.next.season}·E${s.next.episode} on ${fmtDate(s.next.air_date)}`}
                  {tab === 'catch' && `${s.unwatched} episode${s.unwatched > 1 ? 's' : ''} to watch`}
                </div>
              </TitleLink>
              {tab !== 'catch' && (
                <button className="btn sm ghost" title="Dismiss" onClick={() => onDismiss(s.key)}>✕</button>
              )}
            </div>
          ))}
          {tab === 'catch' && catchHidden > 0 && (
            <div className="faint" style={{ textAlign: 'center', padding: '6px 0' }}>
              + {catchHidden} more show{catchHidden > 1 ? 's' : ''} with episodes left, biggest backlogs first.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
