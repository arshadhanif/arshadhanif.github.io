import { useEffect, useState } from 'react'
import { listTrackedShows, setTitleTotalEpisodes } from '../lib/db'
import { getTvStatus } from '../lib/tmdb'
import { initBaselines, buildNotifications, dismiss, markAllRead, syncNotifState } from '../lib/notify'
import { Poster, Spinner, Empty, TitleLink } from '../components/ui'
import { fmtDate } from '../lib/dates'

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
  const [notif, setNotif] = useState({ newItems: [], comingItems: [], catchItems: [], unread: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('new')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await syncNotifState().catch(() => {})
        let tracked = []
        try { tracked = (await listTrackedShows()).slice(0, 60) } catch { tracked = [] }
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
        // Enrich with live TMDB status (aired counts + next episode) in the
        // background, each with a timeout, keeping the cached row on failure.
        const out = await Promise.allSettled(base.map(async (s) => {
          const st = await withTimeout(getTvStatus(s.tmdb_id), 8000)
          const aired = st.aired_episodes ?? st.number_of_episodes ?? s.aired
          if (aired && aired !== s.aired) setTitleTotalEpisodes(s.id, aired).catch(() => {})
          return { ...s, aired, next: st.next_episode }
        }))
        const objs = out.map((r, i) => (r.status === 'fulfilled' ? r.value : base[i]))
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
    ['catch', 'Catch up', notif.catchItems.length],
  ]
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
        </div>
      )}
    </div>
  )
}
