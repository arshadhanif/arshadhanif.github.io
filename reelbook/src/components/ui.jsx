import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IMG } from '../lib/tmdb'

const TAG_SUGGESTIONS = ['comfort watch', 'date night', 'with friends', 'masterpiece', 'made me cry', 'background', 'rewatch material', 'guilty pleasure', 'so bad it’s good']

// Chip-style tag editor. value: string[], onChange: (string[]) => void
export function TagInput({ value = [], onChange, suggestions = TAG_SUGGESTIONS }) {
  const [text, setText] = useState('')
  const add = (raw) => {
    const t = raw.trim().toLowerCase()
    if (t && !value.includes(t)) onChange([...value, t])
    setText('')
  }
  const remove = (t) => onChange(value.filter((x) => x !== t))
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text) }
    else if (e.key === 'Backspace' && !text && value.length) remove(value[value.length - 1])
  }
  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 6)
  return (
    <div>
      <div className="tag-input">
        {value.map((t) => (
          <span className="tag-chip" key={t}>{t}<button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`}>×</button></span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={() => add(text)}
          placeholder={value.length ? 'Add another…' : 'Add a tag…'} />
      </div>
      {unused.length > 0 && (
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {unused.map((s) => <button type="button" key={s} className="chip" onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}
    </div>
  )
}

// Wraps content in a link to the title detail page (/title/:media/:tmdbId).
export function TitleLink({ tmdbId, media, className, style, children }) {
  if (!tmdbId || !media) return <div className={className} style={style}>{children}</div>
  return <Link to={`/title/${media}/${tmdbId}`} className={className} style={style}>{children}</Link>
}

// ---------- Modal ----------
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>{title}</h2>
          <button className="btn sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- Poster ----------
export function Poster({ title, mediaType, posterPath }) {
  const url = IMG.poster(posterPath)
  return (
    <div className="poster">
      {url ? (
        <img src={url} alt={title} loading="lazy" />
      ) : (
        <div className="ph">{title}</div>
      )}
      {mediaType === 'tv' && <span className="badge">TV</span>}
    </div>
  )
}

// ---------- Star rating (1-10) ----------
export function StarRating({ value, onChange, color }) {
  const v = value || 0
  return (
    <div className="stars">
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1
        return (
          <button
            key={n}
            type="button"
            className={n <= v ? 'on' : ''}
            style={n <= v && color ? { color } : undefined}
            onClick={() => onChange(n === v ? null : n)}
            aria-label={`${n} out of 10`}
          >
            {n <= v ? '★' : '☆'}
          </button>
        )
      })}
      <span className="faint" style={{ marginLeft: 8, alignSelf: 'center' }}>
        {v ? `${v}/10` : 'not rated'}
      </span>
    </div>
  )
}

// ---------- Dual score pill (Arshad / Muneeza) ----------
export function DualScore({ profiles, ratings }) {
  // ratings: array of {profile_id, score}
  const byId = Object.fromEntries((ratings || []).map((r) => [r.profile_id, r.score]))
  const shown = (profiles || []).filter((p) => byId[p.id] != null)
  if (!shown.length) return <span className="faint">no ratings</span>
  return (
    <span className="dual">
      {shown.map((p) => (
        <span
          key={p.id}
          className="score"
          style={{ borderColor: p.color, color: p.color }}
          title={p.name}
        >
          {initials(p.name)} {byId[p.id]}
        </span>
      ))}
    </span>
  )
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------- Group filter chips ----------
export function GroupChips({ groups, value, onChange, includeAll = true }) {
  return (
    <div className="scroll-x" style={{ marginBottom: 16 }}>
      {includeAll && (
        <button
          className={`chip ${!value ? 'active' : ''}`}
          style={!value ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--on-accent)' } : undefined}
          onClick={() => onChange(null)}
        >
          All
        </button>
      )}
      {groups.map((g) => {
        const active = value === g.id
        return (
          <button
            key={g.id}
            className={`chip ${active ? 'active' : ''}`}
            style={active ? { background: g.color, borderColor: g.color } : undefined}
            onClick={() => onChange(g.id)}
          >
            <span className="dot" style={{ background: active ? '#0d0f14' : g.color }} />
            {g.name}
          </button>
        )
      })}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner">{label}</div>
}

// Shimmering placeholder blocks shown while data loads.
export function GridSkeleton({ count = 12 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 12, width: '80%', margin: '8px 0 0', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 10, width: '50%', margin: '6px 0 0', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

export function RowsSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card row" style={{ gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 46, aspectRatio: '2/3', borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 10, width: '30%', marginTop: 8, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Empty({ icon = '🎬', children }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div>{children}</div>
    </div>
  )
}

// Shimmer placeholder grid while posters load.
export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skel" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-sm)' }} />
          <div className="skel skel-line" style={{ width: '80%' }} />
          <div className="skel skel-line" style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  )
}
