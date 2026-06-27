import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchMulti, getTrending, getPopular, getTopRated, getTvStatus, getAnime, IMG } from '../lib/tmdb'
import { listInProgressShows, setTitleTotalEpisodes } from '../lib/db'
import { Poster, Empty, SkeletonGrid, TitleLink } from '../components/ui'

export default function Discover() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('all') // all | movie | tv
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [rails, setRails] = useState({})
  const [continueShows, setContinueShows] = useState([])
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
      // Refresh AIRED episode counts (TMDB's total counts unaired episodes),
      // so shows you're fully caught up on drop off. Gated to once every 6h.
      const KEY = 'reelbook.epRefresh'
      if (Date.now() - Number(localStorage.getItem(KEY) || 0) < 6 * 3600 * 1000) return
      const out = await Promise.allSettled(shows.map(async (s) => {
        const st = await getTvStatus(s.title.tmdb_id)
        const aired = st.aired_episodes ?? st.number_of_episodes
        if (aired && aired !== s.total) await setTitleTotalEpisodes(s.title.id, aired).catch(() => {})
        return { ...s, total: aired ?? s.total }
      }))
      try { localStorage.setItem(KEY, String(Date.now())) } catch {}
      const refreshed = out.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        .filter((s) => !s.total || s.watched < s.total)
      setContinueShows(refreshed)
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

function Rail({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-head"><h2>{title}</h2></div>
      <div className="scroll-x rail">
        {items.map((r) => (
          <TitleLink className="rail-item tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
            <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
            <div className="tile-title">{r.title}</div>
            <div className="tile-sub">{r.year || 'N/A'}</div>
          </TitleLink>
        ))}
      </div>
    </div>
  )
}

function ContinueRail({ shows }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-head"><h2>▶ Continue watching</h2></div>
      <div className="scroll-x rail">
        {shows.map(({ title, watched, total }) => {
          const pct = total ? Math.round((watched / total) * 100) : 0
          const toGo = total ? total - watched : 0
          return (
            <TitleLink className="rail-item tile" key={title.id} tmdbId={title.tmdb_id} media={title.media_type}>
              <div style={{ position: 'relative' }}>
                <Poster title={title.title} mediaType="tv" posterPath={title.poster_path} />
                {toGo > 0 && <span className="ep-badge">{toGo} to go</span>}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div className="tile-title">{title.title}</div>
              <div className="tile-sub">{watched}{total ? `/${total}` : ''} eps</div>
            </TitleLink>
          )
        })}
      </div>
    </div>
  )
}
