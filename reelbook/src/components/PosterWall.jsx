import { useEffect, useState } from 'react'
import { getTrending, IMG } from '../lib/tmdb'

// A cinematic, dimmed collage of this week's trending posters — used as a
// backdrop on the landing and login screens. Purely decorative.
export default function PosterWall({ veil = 'hero' }) {
  const [posters, setPosters] = useState([])
  useEffect(() => {
    let alive = true
    getTrending()
      .then((list) => {
        const ps = (list || []).map((r) => IMG.poster(r.poster_path, 'w342')).filter(Boolean)
        if (alive) setPosters(ps.slice(0, 20))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  if (!posters.length) return null
  // duplicate so the rotated/scaled grid always fills the frame
  const cells = posters.concat(posters).slice(0, 32)
  return (
    <div className="poster-wall" aria-hidden="true">
      <div className="poster-wall-grid">
        {cells.map((src, i) => (
          <div className="pw-cell" key={i}><img src={src} loading="lazy" alt="" /></div>
        ))}
      </div>
      <div className={`poster-wall-veil ${veil}`} />
    </div>
  )
}
