import { useEffect, useRef, useState } from 'react'
import { searchMulti, getTrending } from '../lib/tmdb'
import { Poster, Empty, SkeletonGrid, TitleLink } from '../components/ui'

export default function Discover() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const debounce = useRef()

  useEffect(() => {
    getTrending().then(setTrending).catch(() => {})
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
  const shown = searching ? results : trending

  return (
    <div className="page">
      <h1>Discover</h1>
      <input
        autoFocus
        placeholder="Search movies & TV…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 18 }}
      />

      {err && <div className="banner error">{err}</div>}

      {!searching && trending.length > 0 && (
        <div className="section-head"><h2>🔥 Trending this week</h2></div>
      )}

      {loading && <SkeletonGrid count={12} />}

      {!loading && searching && results.length === 0 && !err && (
        <Empty icon="🔍">No results for “{q}”.</Empty>
      )}
      {!loading && !searching && trending.length === 0 && (
        <Empty icon="🍿">Search for a movie or show to open its page, add it, or log a watch.</Empty>
      )}

      {!loading && (
        <div className="grid">
          {shown.map((r) => (
            <TitleLink className="tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
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
