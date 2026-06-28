import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Poster, TitleLink } from './ui'
import { Shuffle } from 'lucide-react'

const RUNTIMES = [[0, 'Any length'], [45, '≤ 45 min'], [70, '≤ 70 min'], [100, '≤ 100 min'], [140, '≤ 140 min']]

// Spin through a filtered pool of watchlist items and land on a random one.
export default function Roulette({ pool, onClose, onWatched }) {
  const [type, setType] = useState('all')
  const [genre, setGenre] = useState('all')
  const [maxRt, setMaxRt] = useState(0)
  const [i, setI] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState(null)
  const timer = useRef()

  // Distinct genres present in the pool (titles.genre is a comma list).
  const genres = useMemo(() => {
    const set = new Set()
    for (const it of pool) for (const g of String(it.titles?.genre || '').split(',')) { const v = g.trim(); if (v) set.add(v) }
    return [...set].sort()
  }, [pool])

  const items = pool.filter((it) => {
    const t = it.titles
    if (type !== 'all' && t?.media_type !== type) return false
    if (genre !== 'all' && !String(t?.genre || '').toLowerCase().includes(genre.toLowerCase())) return false
    if (maxRt && t?.runtime && t.runtime > maxRt) return false   // unknown runtimes pass through
    return true
  })

  useEffect(() => () => clearInterval(timer.current), [])
  // Reset the landed pick when filters change so it can't show a now-filtered title.
  useEffect(() => { setLanded(null); setI(0) }, [type, genre, maxRt])

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
        // avoid landing on the currently-shown one when there's a choice
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
      <p className="faint" style={{ marginTop: 0 }}>Can’t decide? Set the mood and let ReelBook pick from your watchlist.</p>

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
        <select value={maxRt} disabled={spinning} onChange={(e) => setMaxRt(Number(e.target.value))} style={{ width: 'auto' }}>
          {RUNTIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="faint" style={{ textAlign: 'center', padding: 20 }}>Nothing on your watchlist matches these filters.</div>
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
                {onWatched && <button className="btn" onClick={() => onWatched(landed)}>✓ Watched</button>}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
