import { useEffect, useRef, useState } from 'react'
import { searchMulti, getTrending, getPopular, getTopRated, IMG } from '../lib/tmdb'
import { listInProgressShows } from '../lib/db'
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
      getTrending(), getPopular('movie'), getPopular('tv'), getTopRated('movie'),
    ]).then(([tr, pm, ptv, trm]) => {
      setRails({
        trending: val(tr), popMovies: val(pm), popTv: val(ptv), topMovies: val(trm),
      })
    })
    listInProgressShows().then(setContinueShows).catch(() => {})
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
      <h1>Discover</h1>
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
                <div className="tile-sub">{r.year || '—'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
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
          <Rail title="Top rated movies" items={rails.topMovies} />
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
            <div className="tile-sub">{r.year || '—'}</div>
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
          return (
            <TitleLink className="rail-item tile" key={title.id} tmdbId={title.tmdb_id} media={title.media_type}>
              <Poster title={title.title} mediaType="tv" posterPath={title.poster_path} />
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
