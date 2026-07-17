import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchMulti, getTrending, getPopular, getTopRated, getTvStatus, getAnime, listWatchProviders, discoverByProviders, IMG } from '../lib/tmdb'
import { listInProgressShows, setTitleTotalEpisodes, listSubscriptions } from '../lib/db'
import { regionFromSubs, matchProviderIds } from '../lib/providers'
import { Poster, Empty, SkeletonGrid, TitleLink, ScrollRow } from '../components/ui'

export default function Discover() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('all') // all | movie | tv
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [rails, setRails] = useState({})
  const [continueShows, setContinueShows] = useState([])
  const [onServices, setOnServices] = useState(null) // { items, services } | null
  const debounce = useRef()

  useEffect(() => {
    Promise.allSettled([
      getTrending(), getPopular('movie'), getPopular('tv'), getTopRated('movie'), getAnime('tv'), getAnime('movie'),
    ]).then(([tr, pm, ptv, trm, an, anm]) => {
      setRails({
        trending: val(tr), popMovies: val(pm), popTv: val(ptv), topMovies: val(trm), anime: val(an), animeMovies: val(anm),
      })
    })
    listInProgressShows().then(async (shows) => {
      setContinueShows(shows)
      // Refresh AIRED episode counts (TMDB's total counts unaired episodes) so
      // shows you're caught up on drop off. Gated to once every 6h. Only the most
      // recent shows are checked (the rail is a scroller, and hitting TMDB for
      // every tracked show at once gets rate-limited). Crucially, a failed check
      // KEEPS the show as-is instead of dropping it from the rail.
      const KEY = 'reelbook.epRefresh'
      if (Date.now() - Number(localStorage.getItem(KEY) || 0) < 6 * 3600 * 1000) return
      // Prioritise shows with an UNKNOWN total: without it they can never be
      // marked caught up and cling to the rail forever. Then the most-recent
      // shows (to catch newly-aired episodes). Dedupe by tmdb id, cap the work,
      // and run in small batches so TMDB doesn't rate-limit. A failed check
      // keeps the show as-is rather than dropping it.
      const totals = {}
      const seenTmdb = new Set()
      const work = []
      for (const s of [...shows.filter((s) => !s.total), ...shows.filter((s) => s.total)]) {
        if (!seenTmdb.has(s.title.tmdb_id)) { seenTmdb.add(s.title.tmdb_id); work.push(s) }
      }
      const capped = work.slice(0, 120)
      for (let i = 0; i < capped.length; i += 8) {
        await Promise.all(capped.slice(i, i + 8).map(async (s) => {
          try {
            const st = await getTvStatus(s.title.tmdb_id)
            const aired = st.aired_episodes ?? st.number_of_episodes
            if (aired) { totals[s.title.tmdb_id] = aired; if (aired !== s.total) await setTitleTotalEpisodes(s.title.id, aired).catch(() => {}) }
          } catch { /* keep the show as-is on failure */ }
        }))
      }
      try { localStorage.setItem(KEY, String(Date.now())) } catch {}
      const merged = shows.map((s) => (totals[s.title.tmdb_id] ? { ...s, total: totals[s.title.tmdb_id] } : s))
      setContinueShows(merged.filter((s) => !s.total || s.watched < s.total))
    }).catch(() => {})

    // "On your services": what's popular on the streaming services you pay for.
    listSubscriptions().then(async (subs) => {
      const names = subs.filter((s) => s.active).map((s) => s.name).filter(Boolean)
      if (!names.length) return
      const region = regionFromSubs(subs)
      const [provMovie, provTv] = await Promise.all([
        listWatchProviders('movie', region).catch(() => []),
        listWatchProviders('tv', region).catch(() => []),
      ])
      const movieIds = matchProviderIds(names, provMovie)
      const tvIds = matchProviderIds(names, provTv)
      if (!movieIds.length && !tvIds.length) return
      const [m, t] = await Promise.all([
        discoverByProviders('movie', movieIds, region).catch(() => []),
        discoverByProviders('tv', tvIds, region).catch(() => []),
      ])
      const items = interleave(m, t).slice(0, 20)
      if (items.length) setOnServices({ items })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setErr(null); setLoading(false); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      setErr(null)
      try { setResults(await searchMulti(q)) }
      catch (e) { setErr(e.message) }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [q])

  const searching = !!q.trim()
  const filtered = type === 'all' ? results : results.filter((r) => r.media_type === type)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Discover</h1>
        <Link className="btn sm" to="/browse">🧭 Advanced filters</Link>
      </div>
      <input
        placeholder="Search movies & TV…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {searching && (
        <div className="seg" style={{ marginBottom: 16 }}>
          {['all', 'movie', 'tv'].map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
            </button>
          ))}
        </div>
      )}

      {err && <div className="banner error">{err}</div>}

      {searching ? (
        loading ? <SkeletonGrid count={12} /> : filtered.length === 0 && !err ? (
          <Empty icon="🔍">No {type !== 'all' ? (type === 'tv' ? 'TV' : 'movie') + ' ' : ''}results for “{q}”.</Empty>
        ) : (
          <div className="grid">
            {filtered.map((r) => (
              <TitleLink className="tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
                <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
                <div className="tile-title">{r.title}</div>
                <div className="tile-sub">{r.year || 'N/A'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
              </TitleLink>
            ))}
          </div>
        )
      ) : (
        <>
          {continueShows.length > 0 && (
            <ContinueRail shows={continueShows} />
          )}
          {onServices && <Rail title="📺 On your services" items={onServices.items} />}
          <Rail title="🔥 Trending this week" items={rails.trending} />
          <Rail title="Popular movies" items={rails.popMovies} />
          <Rail title="Popular TV" items={rails.popTv} />
          <Rail title="🍙 Popular anime" items={rails.anime} />
          <Rail title="Top rated movies" items={rails.topMovies} />
          <Rail title="🎴 Anime movies" items={rails.animeMovies} />
          {!rails.trending && <SkeletonGrid count={6} />}
        </>
      )}
    </div>
  )
}

function val(settled) { return settled.status === 'fulfilled' ? settled.value : [] }

// Alternate two lists (movies/TV) and drop duplicates.
function interleave(a, b) {
  const out = [], seen = new Set()
  const push = (r) => { const k = `${r.media_type}-${r.tmdb_id}`; if (!seen.has(k)) { seen.add(k); out.push(r) } }
  for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) push(a[i]); if (b[i]) push(b[i]) }
  return out
}

function Rail({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-head"><h2>{title}</h2></div>
      <ScrollRow className="rail">
        {items.map((r) => (
          <TitleLink className="rail-item tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
            <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
            <div className="tile-title">{r.title}</div>
            <div className="tile-sub">{r.year || 'N/A'}</div>
          </TitleLink>
        ))}
      </ScrollRow>
    </div>
  )
}

function ContinueRail({ shows }) {
  const [gid, setGid] = useState(null)
  // Distinct groups present, so we only show the filter when it's useful.
  const groupsPresent = []
  const seen = new Set()
  for (const s of shows) if (s.group && !seen.has(s.group.id)) { seen.add(s.group.id); groupsPresent.push(s.group) }
  const view = gid ? shows.filter((s) => s.groupId === gid) : shows
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-head"><h2>▶ Continue watching</h2></div>
      {groupsPresent.length > 1 && (
        <div className="scroll-x" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className={`chip ${!gid ? 'active' : ''}`}
            style={!gid ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#0b0d12' } : undefined}
            onClick={() => setGid(null)}>All</button>
          {groupsPresent.map((g) => (
            <button key={g.id} className={`chip ${gid === g.id ? 'active' : ''}`}
              style={gid === g.id ? { background: g.color, borderColor: g.color, color: '#0b0d12' } : undefined}
              onClick={() => setGid(g.id)}>{g.name}</button>
          ))}
        </div>
      )}
      <ScrollRow className="rail">
        {view.map((s) => {
          const { title, watched, total, group, groupId } = s
          const pct = total ? Math.round((watched / total) * 100) : 0
          const toGo = total ? total - watched : 0
          return (
            <TitleLink className="rail-item tile" key={`${title.id}-${groupId}`} tmdbId={title.tmdb_id} media={title.media_type}>
              <div style={{ position: 'relative' }}>
                <Poster title={title.title} mediaType="tv" posterPath={title.poster_path} />
                {toGo > 0 && <span className="ep-badge">{toGo} to go</span>}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div className="tile-title">{title.title}</div>
              <div className="tile-sub">
                {watched}{total ? `/${total}` : ''} eps
                {group && <> · <span style={{ color: group.color }}>{group.name}</span></>}
              </div>
            </TitleLink>
          )
        })}
      </ScrollRow>
    </div>
  )
}
