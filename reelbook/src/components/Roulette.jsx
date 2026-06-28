import { useEffect, useRef, useState } from 'react'
import { Modal, Poster, TitleLink } from './ui'

// Spin through a pool of watchlist items and land on a random one.
export default function Roulette({ pool, onClose, onWatched }) {
  const [type, setType] = useState('all')
  const [i, setI] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState(null)
  const timer = useRef()

  const items = pool.filter((it) => type === 'all' || it.titles?.media_type === type)

  useEffect(() => () => clearInterval(timer.current), [])

  function spin() {
    if (items.length === 0) return
    setLanded(null); setSpinning(true)
    let ticks = 0
    const total = 16 + Math.floor(Math.random() * 10)
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setI((n) => (n + 1) % items.length)
      ticks++
      // ease out: slow down near the end
      if (ticks >= total) {
        clearInterval(timer.current)
        const finalIdx = Math.floor(Math.random() * items.length)
        setI(finalIdx); setLanded(items[finalIdx]); setSpinning(false)
      }
    }, 80 + Math.floor(ticks / 4) * 14)
  }

  const shown = items[i]
  const t = (landed || shown)?.titles

  return (
    <Modal title="🎲 Surprise me" onClose={onClose}>
      <p className="faint" style={{ marginTop: 0 }}>Can’t decide? Let ReelBook pick from your watchlist.</p>
      <div className="seg" style={{ marginBottom: 16 }}>
        {[['all', 'Anything'], ['movie', 'Movie'], ['tv', 'TV']].map(([v, l]) => (
          <button key={v} className={type === v ? 'on' : ''} disabled={spinning} onClick={() => { setType(v); setLanded(null) }}>{l}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="faint" style={{ textAlign: 'center', padding: 20 }}>Nothing on your watchlist for this filter.</div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className={`roulette-poster ${spinning ? 'spinning' : ''} ${landed ? 'landed' : ''}`} style={{ width: 160, margin: '0 auto' }}>
            <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>{t?.title}</div>
          <div className="faint">{t?.year || ''}{t?.media_type ? ` · ${t.media_type === 'tv' ? 'TV' : 'Movie'}` : ''}</div>

          <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={spinning} onClick={spin}>{landed ? '🎲 Spin again' : spinning ? 'Spinning…' : '🎲 Spin'}</button>
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
