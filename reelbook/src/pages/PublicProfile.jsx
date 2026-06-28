import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProfile } from '../lib/db'
import { Poster, Spinner, Empty, initials } from '../components/ui'

export default function PublicProfile() {
  const { token } = useParams()
  const [p, setP] = useState(undefined)   // undefined=loading, null=not found

  useEffect(() => {
    getPublicProfile(token).then(setP).catch(() => setP(null))
  }, [token])

  if (p === undefined) return <div className="page"><Spinner label="Loading profile…" /></div>

  if (!p) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <Empty icon="🔗">This profile isn’t shared, or the link has been turned off.</Empty>
        <Link className="btn primary" to="/welcome">About ReelBook</Link>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="person-head" style={{ alignItems: 'center' }}>
        <div className="avatar" style={{ background: p.color || 'var(--accent-2)', width: 64, height: 64, fontSize: 24 }}>{initials(p.name || '?')}</div>
        <div>
          <h1 style={{ margin: 0 }}>{p.name}</h1>
          <div className="faint" style={{ marginTop: 4 }}>on ReelBook</div>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 360, margin: '20px 0' }}>
        <div className="stat"><div className="v">{p.ratings_count || 0}</div><div className="l">Titles rated</div></div>
        <div className="stat"><div className="v">{p.avg_score ?? '—'}</div><div className="l">Average score</div></div>
      </div>

      {p.favorites?.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <div className="section-head"><h2>Favourites</h2></div>
          <div className="grid">
            {p.favorites.map((t) => <PubTile key={`f-${t.media_type}-${t.tmdb_id}`} t={t} />)}
          </div>
        </section>
      )}

      {p.top_rated?.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <div className="section-head"><h2>Highest rated</h2></div>
          <div className="grid">
            {p.top_rated.map((t) => <PubTile key={`r-${t.media_type}-${t.tmdb_id}`} t={t} sub={`★ ${t.score}`} />)}
          </div>
        </section>
      )}

      <div className="card" style={{ textAlign: 'center', marginTop: 30 }}>
        <strong>Track what you watch with ReelBook</strong>
        <div className="faint" style={{ margin: '6px 0 12px' }}>A private movie & TV diary with groups, dual ratings and stats.</div>
        <Link className="btn primary" to="/welcome">Learn more</Link>
      </div>

      <p className="faint" style={{ textAlign: 'center', marginTop: 20 }}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  )
}

function PubTile({ t, sub }) {
  return (
    <div className="tile" style={{ cursor: 'default' }}>
      <Poster title={t.title} mediaType={t.media_type} posterPath={t.poster_path} />
      <div className="tile-title">{t.title}</div>
      <div className="tile-sub">{sub || (t.year || '')}{!sub && t.media_type === 'tv' ? ' · TV' : ''}</div>
    </div>
  )
}
