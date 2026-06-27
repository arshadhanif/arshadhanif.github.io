import { useEffect, useMemo, useState } from 'react'
import { listDiary, listWatchlist } from '../lib/db'
import { recommendFromHistory, keyOf } from '../lib/recommend'
import { IMG } from '../lib/tmdb'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, TitleLink } from '../components/ui'

export default function ForYou() {
  const { groups } = useAppData()
  const [entries, setEntries] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [recs, setRecs] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [type, setType] = useState('all')
  const [spin, setSpin] = useState(0)

  useEffect(() => {
    Promise.all([listDiary({ limit: 2000 }), listWatchlist()])
      .then(([d, w]) => { setEntries(d); setWatchlist(w) })
      .finally(() => setLoadingData(false))
  }, [])

  // titles to exclude from recs (already watched or already on a watchlist)
  const exclude = useMemo(() => {
    const s = new Set()
    entries.forEach((e) => e.titles && s.add(keyOf(e.titles.media_type, e.titles.tmdb_id)))
    watchlist.forEach((w) => w.titles && s.add(keyOf(w.titles.media_type, w.titles.tmdb_id)))
    return s
  }, [entries, watchlist])

  const seedEntries = useMemo(
    () => (groupId ? entries.filter((e) => e.group_id === groupId) : entries),
    [entries, groupId]
  )

  useEffect(() => {
    if (loadingData) return
    let alive = true
    setLoadingRecs(true)
    recommendFromHistory({ entries: seedEntries, exclude, type })
      .then((r) => alive && setRecs(r))
      .catch(() => alive && setRecs([]))
      .finally(() => alive && setLoadingRecs(false))
    return () => { alive = false }
  }, [seedEntries, exclude, type, loadingData])

  // "Tonight's pick" — favour the watchlist (things you mean to watch), else a top rec.
  const wlPool = useMemo(() => {
    let pool = watchlist
    if (groupId) pool = pool.filter((w) => w.group_id === groupId)
    if (type !== 'all') pool = pool.filter((w) => w.titles?.media_type === type)
    return pool
  }, [watchlist, groupId, type])

  const pick = useMemo(() => {
    if (wlPool.length) {
      const w = wlPool[spin % wlPool.length]
      return { t: w.titles, source: 'watchlist', group: w.groups }
    }
    if (recs.length) return { t: recs[spin % recs.length], source: 'recommended' }
    return null
  }, [wlPool, recs, spin])

  if (loadingData) return <div className="page"><Spinner label="Thinking of what you'd love…" /></div>

  const hasHistory = entries.length > 0

  return (
    <div className="page">
      <h1>For You</h1>
      <p className="sub">Picks based on what you’ve rated highly — and your watchlist for tonight.</p>

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="seg">
          {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>
          ))}
        </div>
      </div>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {/* Tonight's pick */}
      {pick?.t && (
        <div className="tonight">
          {IMG.backdrop(pick.t.backdrop_path) && (
            <div className="tonight-bg" style={{ backgroundImage: `url(${IMG.backdrop(pick.t.backdrop_path)})` }} />
          )}
          <div className="tonight-grad" />
          <div className="tonight-inner">
            <div style={{ width: 92, flexShrink: 0 }}>
              <Poster title={pick.t.title} mediaType={pick.t.media_type} posterPath={pick.t.poster_path} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ep-tag" style={{ color: 'var(--accent)' }}>
                {pick.source === 'watchlist' ? '🍿 TONIGHT, FROM YOUR WATCHLIST' : '✨ TONIGHT’S PICK'}
              </div>
              <h2 style={{ margin: '4px 0 6px', fontSize: 22 }}>{pick.t.title}</h2>
              <div className="faint">{pick.t.year || ''}{pick.t.genre ? ` · ${pick.t.genre.split(',')[0]}` : ''}</div>
              <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <TitleLink className="btn primary" tmdbId={pick.t.tmdb_id} media={pick.t.media_type}>Open</TitleLink>
                <button className="btn" onClick={() => setSpin((s) => s + 1)}>🎲 Spin again</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations grid */}
      <div className="section-head" style={{ marginTop: 24 }}><h2>Recommended for you</h2></div>
      {!hasHistory ? (
        <Empty icon="✨">Rate a few things you’ve watched and I’ll start recommending titles you’ll love.</Empty>
      ) : loadingRecs ? (
        <Spinner label="Finding picks…" />
      ) : recs.length === 0 ? (
        <Empty icon="🍿">No fresh recommendations for this filter yet — try a different group or type, or rate more titles.</Empty>
      ) : (
        <div className="grid">
          {recs.map((r) => (
            <TitleLink className="tile" key={keyOf(r.media_type, r.tmdb_id)} tmdbId={r.tmdb_id} media={r.media_type}>
              <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
              <div className="tile-title">{r.title}</div>
              <div className="tile-sub">{r.year || '—'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
            </TitleLink>
          ))}
        </div>
      )}
    </div>
  )
}
