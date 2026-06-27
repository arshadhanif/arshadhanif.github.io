import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPerson, IMG } from '../lib/tmdb'
import { getLoggedTmdbIds } from '../lib/db'
import { Spinner, Empty, Poster, TitleLink } from '../components/ui'
import { fmtDate } from '../lib/dates'

export default function Person() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [logged, setLogged] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [role, setRole] = useState(null)        // 'Acting' | department
  const [media, setMedia] = useState('all')      // all | movie | tv
  const [sort, setSort] = useState('newest')     // newest | oldest | rating | popular
  const [bioOpen, setBioOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(false)
    getPerson(id).then((p) => { if (alive) { setPerson(p); setRole(p.cast.length ? 'Acting' : null) } })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    getLoggedTmdbIds().then((s) => alive && setLogged(s)).catch(() => {})
    return () => { alive = false }
  }, [id])

  // Tabs: Acting (cast) + each crew department present, by credit count.
  const roles = useMemo(() => {
    if (!person) return []
    const out = []
    if (person.cast.length) out.push({ key: 'Acting', count: person.cast.length })
    const byDept = {}
    for (const c of person.crew) byDept[c.department] = (byDept[c.department] || 0) + 1
    Object.entries(byDept).sort((a, b) => b[1] - a[1]).forEach(([d, n]) => out.push({ key: d, count: n }))
    return out
  }, [person])

  const items = useMemo(() => {
    if (!person || !role) return []
    const src = role === 'Acting' ? person.cast : person.crew.filter((c) => c.department === role)
    // Dedupe by title, merging the roles/jobs for that title.
    const byId = new Map()
    for (const c of src) {
      const k = `${c.media_type}-${c.tmdb_id}`
      if (!byId.has(k)) byId.set(k, { ...c, labels: new Set() })
      const e = byId.get(k)
      if (c.character) e.labels.add(c.character)
      if (c.job) e.labels.add(c.job)
      if (c.episode_count && c.episode_count > (e.episode_count || 0)) e.episode_count = c.episode_count
    }
    let arr = [...byId.values()].map((e) => ({ ...e, label: [...e.labels].slice(0, 2).join(', ') }))
    if (media !== 'all') arr = arr.filter((e) => e.media_type === media)
    arr.sort((a, b) => {
      if (sort === 'rating') return b.vote_average - a.vote_average
      if (sort === 'popular') return b.popularity - a.popularity
      const da = a.date || '', db = b.date || ''
      return sort === 'oldest' ? da.localeCompare(db) : db.localeCompare(da)
    })
    return arr
  }, [person, role, media, sort])

  if (loading) return <div className="page"><Spinner label="Loading filmography…" /></div>
  if (error || !person) return <div className="page"><Empty icon="🎭">Couldn’t load this person.</Empty></div>

  const age = lifeLine(person)
  const bio = person.biography
  const bioShort = bio.length > 360 && !bioOpen ? bio.slice(0, 360).trimEnd() + '…' : bio

  return (
    <div className="page">
      <div className="person-head">
        <div className="person-photo">
          {IMG.profile(person.profile_path, 'h632')
            ? <img src={IMG.profile(person.profile_path, 'h632')} alt={person.name} />
            : <div className="cast-ph" style={{ fontSize: 40 }}>{person.name?.[0]}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: '0 0 4px' }}>{person.name}</h1>
          <div className="muted">{person.known_for_department}{age ? ` · ${age}` : ''}</div>
          {person.place && <div className="faint" style={{ marginTop: 2 }}>{person.place}</div>}
          {person.imdb_id && (
            <a className="ep2-link imdb" style={{ display: 'inline-block', marginTop: 10 }}
              href={`https://www.imdb.com/name/${person.imdb_id}/`} target="_blank" rel="noreferrer">IMDb ↗</a>
          )}
          {bio && (
            <p className="muted" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
              {bioShort}{' '}
              {bio.length > 360 && <button className="linklike" onClick={() => setBioOpen((o) => !o)}>{bioOpen ? 'less' : 'more'}</button>}
            </p>
          )}
        </div>
      </div>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', margin: '22px 0 16px' }}>
        {roles.length > 1 && (
          <select value={role || ''} onChange={(e) => setRole(e.target.value)} style={{ width: 'auto' }}>
            {roles.map((r) => <option key={r.key} value={r.key}>{r.key === 'Acting' ? 'Acting' : r.key} ({r.count})</option>)}
          </select>
        )}
        <div className="seg">
          {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={media === v ? 'on' : ''} onClick={() => setMedia(v)}>{l}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="rating">Highest rated</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      {items.length === 0 ? (
        <Empty icon="🎬">Nothing to show in this view.</Empty>
      ) : (
        <div className="grid">
          {items.map((c) => (
            <TitleLink className="tile" key={`${c.media_type}-${c.tmdb_id}`} tmdbId={c.tmdb_id} media={c.media_type}>
              <div style={{ position: 'relative' }}>
                <Poster title={c.title} mediaType={c.media_type} posterPath={c.poster_path} />
                {logged.has(c.tmdb_id) && <span className="ep-badge" title="In your library">✓</span>}
              </div>
              <div className="tile-title">{c.title}</div>
              <div className="tile-sub">
                {c.year || 'TBA'}{c.label ? ` · ${c.label}` : ''}{c.episode_count ? ` · ${c.episode_count} eps` : ''}
              </div>
            </TitleLink>
          ))}
        </div>
      )}
    </div>
  )
}

function lifeLine(p) {
  if (!p.birthday) return null
  const born = new Date(p.birthday + 'T00:00:00')
  const end = p.deathday ? new Date(p.deathday + 'T00:00:00') : new Date()
  let age = end.getFullYear() - born.getFullYear()
  if (end.getMonth() < born.getMonth() || (end.getMonth() === born.getMonth() && end.getDate() < born.getDate())) age--
  if (p.deathday) return `${fmtDate(p.birthday)} – ${fmtDate(p.deathday)} (aged ${age})`
  return `Born ${fmtDate(p.birthday)} (age ${age})`
}
