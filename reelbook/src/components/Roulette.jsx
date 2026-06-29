import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Poster, TitleLink } from './ui'
import { Shuffle } from 'lucide-react'
import { getTrending, getPopular, getTopRated, discoverTitles } from '../lib/tmdb'

const RUNTIMES = [[0, 'Any length'], [45, '<= 45 min'], [70, '<= 70 min'], [100, '<= 100 min'], [140, '<= 140 min']]

const SOURCES = [
  ['watchlist', '🔖 Watchlist'],
  ['trending', '🔥 Trending'],
  ['popular', '⭐ Popular'],
  ['top', '🏆 Top rated'],
]

// genre name -> [movie id, tv id] (null where TMDB has no direct equivalent)
const GENRES = [
  ['Action', 28, 10759], ['Adventure', 12, 10759], ['Animation', 16, 16],
  ['Comedy', 35, 35], ['Crime', 80, 80], ['Documentary', 99, 99],
  ['Drama', 18, 18], ['Family', 10751, 10751], ['Fantasy', 14, 10765],
  ['Horror', 27, null], ['Mystery', 9648, 9648], ['Romance', 10749, null],
  ['Sci-Fi', 878, 10765], ['Thriller', 53, null], ['War', 10752, 10768],
]

const shuffle = (arr) => {
  const a = [...arr]
  for (let j = a.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1));[a[j], a[k]] = [a[k], a[j]] }
  return a
}

// Spin through a pool (your watchlist, or a fresh TMDB feed) and land on a random pick.
export default function Roulette({ pool, onClose, onWatched }) {
  const [source, setSource] = useState('watchlist')
  const [type, setType] = useState('all')
  const [genre, setGenre] = useState('all')
  const [maxRt, setMaxRt] = useState(0)
  const [i, setI] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState(null)
  const [fetched, setFetched] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef()

  const isWatchlist = source === 'watchlist'

  // Genre choices: from the watchlist pool, or the standard TMDB list for feeds.
  const genres = useMemo(() => {
    if (!isWatchlist) return GENRES.map((g) => g[0])
    const set = new Set()
    for (const it of pool) for (const g of String(it.titles?.genre || '').split(',')) { const v = g.trim(); if (v) set.add(v) }
    return [...set].sort()
  }, [pool, isWatchlist])

  // Fetch a fresh TMDB pool whenever the source/type/genre changes (random page = variety).
  async function fetchPool() {
    setLoading(true); setLanded(null)
    try {
      const types = type === 'all' ? ['movie', 'tv'] : [type]
      const page = 1 + Math.floor(Math.random() * 5)
      let results = []
      const g = GENRES.find((x) => x[0] === genre)
      if (g) {
        for (const mt of types) {
          const gid = mt === 'movie' ? g[1] : g[2]
          const opts = { page, sortBy: source === 'top' ? 'vote_average.desc' : 'popularity.desc' }
          if (source === 'top') opts.ratingMin = 7
          if (gid) opts.genres = [gid]
          const r = await discoverTitles(mt, opts)
          results.push(...r.results)
        }
      } else if (source === 'trending') {
        results = await getTrending()
        if (type !== 'all') results = results.filter((r) => r.media_type === type)
      } else if (source === 'popular') {
        for (const mt of types) results.push(...await getPopular(mt))
      } else {
        for (const mt of types) results.push(...await getTopRated(mt))
      }
      const seen = new Set(); const out = []
      for (const r of results) { const k = `${r.media_type}-${r.tmdb_id}`; if (seen.has(k)) continue; seen.add(k); out.push({ titles: r }) }
      setFetched(shuffle(out))
    } catch { setFetched([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (isWatchlist) return
    fetchPool()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, type, genre])

  const items = useMemo(() => {
    if (!isWatchlist) return fetched.filter((it) => type === 'all' || it.titles?.media_type === type)
    return pool.filter((it) => {
      const t = it.titles
      if (type !== 'all' && t?.media_type !== type) return false
      if (genre !== 'all' && !String(t?.genre || '').toLowerCase().includes(genre.toLowerCase())) return false
      if (maxRt && t?.runtime && t.runtime > maxRt) return false
      return true
    })
  }, [isWatchlist, fetched, pool, type, genre, maxRt])

  useEffect(() => () => clearInterval(timer.current), [])
  useEffect(() => { setLanded(null); setI(0) }, [source, type, genre, maxRt])

  function spin() {
    if (items.length === 0) return
    setLanded(null); setSpinning(true)
    let ticks = 0
    const total = 16 + Math.floor(Math.random() * 10)
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setI((n) => (n + 1) % items.length)
      ticks++
      if (ticks >= total) {
        clearInterval(timer.current)
        let finalIdx = Math.floor(Math.random() * items.length)
        if (items.length > 1 && finalIdx === i) finalIdx = (finalIdx + 1) % items.length
        setI(finalIdx); setLanded(items[finalIdx]); setSpinning(false)
      }
    }, 80 + Math.floor(ticks / 4) * 14)
  }

  const shown = items[i]
  const t = (landed || shown)?.titles

  return (
    <Modal title="Surprise me" onClose={onClose}>
      <p className="faint" style={{ marginTop: 0 }}>Set the mood and let ReelBook pick. Spin from your watchlist or discover something new.</p>

      <div className="seg" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        {SOURCES.map(([v, l]) => (
          <button key={v} className={source === v ? 'on' : ''} disabled={spinning} onClick={() => setSource(v)}>{l}</button>
        ))}
      </div>

      <div className="seg" style={{ marginBottom: 10 }}>
        {[['all', 'Anything'], ['movie', 'Movie'], ['tv', 'TV']].map(([v, l]) => (
          <button key={v} className={type === v ? 'on' : ''} disabled={spinning} onClick={() => setType(v)}>{l}</button>
        ))}
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {genres.length > 0 && (
          <select value={genre} disabled={spinning} onChange={(e) => setGenre(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">Any genre</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        {isWatchlist && (
          <select value={maxRt} disabled={spinning} onChange={(e) => setMaxRt(Number(e.target.value))} style={{ width: 'auto' }}>
            {RUNTIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
        {!isWatchlist && (
          <button className="btn sm" disabled={spinning || loading} onClick={fetchPool} title="Pull a fresh set of titles"><Shuffle size={14} /> New picks</button>
        )}
      </div>

      {loading ? (
        <div className="faint" style={{ textAlign: 'center', padding: 20 }}>Finding titles…</div>
      ) : items.length === 0 ? (
        <div className="faint" style={{ textAlign: 'center', padding: 20 }}>
          {isWatchlist ? 'Nothing on your watchlist matches these filters.' : 'No titles found, try different filters or New picks.'}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className={`roulette-poster ${spinning ? 'spinning' : ''} ${landed ? 'landed' : ''}`} style={{ width: 160, margin: '0 auto' }}>
            <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>{t?.title}</div>
          <div className="faint">
            {t?.year || ''}{t?.media_type ? ` · ${t.media_type === 'tv' ? 'TV' : 'Movie'}` : ''}{t?.runtime ? ` · ${t.runtime}m` : ''}
          </div>
          <div className="faint" style={{ marginTop: 2 }}>{items.length} option{items.length === 1 ? '' : 's'} in the pool</div>

          <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={spinning} onClick={spin}><Shuffle size={16} /> {landed ? 'Spin again' : spinning ? 'Spinning…' : 'Spin'}</button>
            {landed && (
              <>
                <TitleLink className="btn" tmdbId={t?.tmdb_id} media={t?.media_type} onClick={onClose}>Open</TitleLink>
                {isWatchlist && onWatched && <button className="btn" onClick={() => onWatched(landed)}>✓ Watched</button>}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
