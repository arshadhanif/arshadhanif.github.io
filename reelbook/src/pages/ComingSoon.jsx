import { useEffect, useState } from 'react'
import { listTrackedShows, listWatchlist } from '../lib/db'
import { getTvStatus, getMovieRelease } from '../lib/tmdb'
import { Poster, Spinner, Empty, TitleLink } from '../components/ui'
import { fmtDate } from '../lib/dates'

const CACHE_KEY = 'reelbook.coming.v1'
const TTL = 6 * 3600 * 1000

// Run async tasks with a concurrency limit so we don't fire 100 TMDB calls at once.
async function pool(items, fn, limit = 10) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]).catch(() => null) }
  }))
  return out
}

function dayDiff(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return Math.round((d - today) / 864e5)
}
function relative(diff) {
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} ago`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return `In ${diff} days`
  if (diff < 14) return 'Next week'
  return fmtDate(new Date(Date.now() + diff * 864e5).toISOString().slice(0, 10))
}
function bucketOf(diff) {
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7) return 'This week'
  if (diff <= 31) return 'This month'
  return 'Later'
}
const BUCKETS = ['Today', 'Tomorrow', 'This week', 'This month', 'Later']

export default function ComingSoon() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')   // all | tv | movie
  const [refreshing, setRefreshing] = useState(false)

  async function build() {
    const [tracked, wl] = await Promise.all([listTrackedShows(), listWatchlist()])
    // Unique TV shows we follow (tracked + any TV on the watchlist).
    const tvMap = new Map()
    for (const s of tracked) tvMap.set(s.title.tmdb_id, s.title)
    for (const w of wl) if (w.titles?.media_type === 'tv') tvMap.set(w.titles.tmdb_id, w.titles)
    const tvShows = [...tvMap.values()]

    // Watchlist movies that might still be unreleased (this year or undated).
    const thisYear = new Date().getFullYear()
    const movieList = wl.map((w) => w.titles).filter((t) => t?.media_type === 'movie' && (!t.year || t.year >= thisYear))
    const movieMap = new Map(movieList.map((t) => [t.tmdb_id, t]))

    const [tvStatuses, movieRels] = await Promise.all([
      pool(tvShows, (t) => getTvStatus(t.tmdb_id).then((st) => ({ t, st }))),
      pool([...movieMap.values()], (t) => getMovieRelease(t.tmdb_id).then((r) => ({ t, r }))),
    ])

    const out = []
    for (const row of tvStatuses) {
      if (!row?.st?.next_episode?.air_date) continue
      const n = row.st.next_episode
      out.push({
        key: `tv-${row.t.tmdb_id}`, media: 'tv', tmdb_id: row.t.tmdb_id,
        title: row.t.title, poster_path: row.t.poster_path,
        date: n.air_date, sub: `S${n.season}·E${n.episode}${n.name ? ` · ${n.name}` : ''}`,
      })
    }
    for (const row of movieRels) {
      const rd = row?.r?.release_date
      if (!rd || dayDiff(rd) < 0) continue
      out.push({
        key: `mv-${row.t.tmdb_id}`, media: 'movie', tmdb_id: row.t.tmdb_id,
        title: row.t.title, poster_path: row.t.poster_path,
        date: rd, sub: 'Movie release',
      })
    }
    out.sort((a, b) => a.date.localeCompare(b.date))
    return out
  }

  async function load(force) {
    try {
      if (!force) {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
        if (cached && Date.now() - cached.at < TTL) {
          // Drop anything that has since aired.
          setItems(cached.items.filter((i) => dayDiff(i.date) >= 0)); setLoading(false); return
        }
      }
      const out = await build()
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items: out }))
      setItems(out)
    } catch { setItems([]) } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load(false) }, [])

  if (loading) return <div className="page"><Spinner label="Checking what's coming up…" /></div>

  const view = (items || []).filter((i) => filter === 'all' || i.media === filter)
  const grouped = BUCKETS.map((b) => ({ b, list: view.filter((i) => bucketOf(dayDiff(i.date)) === b) })).filter((g) => g.list.length)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Coming Soon</h1>
        <button className="btn sm" disabled={refreshing} onClick={() => { setRefreshing(true); load(true) }}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="sub">Upcoming episodes for shows you follow, plus releases for movies on your watchlist.</p>

      <div className="seg" style={{ marginBottom: 16 }}>
        {[['all', 'All'], ['tv', 'Episodes'], ['movie', 'Movies']].map(([v, l]) => (
          <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <Empty icon="📅">Nothing on the horizon. Track some shows or add upcoming movies to your watchlist, and they'll appear here.</Empty>
      ) : (
        grouped.map((g) => (
          <div key={g.b} style={{ marginBottom: 22 }}>
            <div className="section-head"><h2>{g.b}</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.list.map((i) => {
                const diff = dayDiff(i.date)
                return (
                  <TitleLink key={i.key} className="card row" tmdbId={i.tmdb_id} media={i.media} style={{ gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 46, flexShrink: 0 }}>
                      <Poster title={i.title} mediaType={i.media} posterPath={i.poster_path} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{i.title}</strong>
                      <div className="faint" style={{ marginTop: 3 }}>{i.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: diff <= 1 ? 'var(--accent)' : 'var(--text)' }}>{relative(diff)}</div>
                      <div className="faint">{fmtDate(i.date)}</div>
                    </div>
                  </TitleLink>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
