import { useEffect, useRef, useState } from 'react'
import { searchMulti } from '../lib/tmdb'
import { addToWatchlist } from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { Poster, Spinner, Empty, Modal } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'

export default function Discover() {
  const { groups, profiles } = useAppData()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [active, setActive] = useState(null)     // seed for the action sheet
  const [watchItem, setWatchItem] = useState(null) // seed for mark-watched
  const debounce = useRef()

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setErr(null); return }
    debounce.current = setTimeout(async () => {
      setLoading(true); setErr(null)
      try {
        setResults(await searchMulti(q))
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [q])

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
      {loading && <Spinner label="Searching TMDB…" />}

      {!loading && !q.trim() && (
        <Empty>Search for a movie or show to add it to a watchlist or your diary.</Empty>
      )}
      {!loading && q.trim() && results.length === 0 && !err && (
        <Empty>No results for “{q}”.</Empty>
      )}

      <div className="grid">
        {results.map((r) => (
          <div key={`${r.media_type}-${r.tmdb_id}`} role="button" onClick={() => setActive(r)}>
            <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
            <div className="tile-title">{r.title}</div>
            <div className="tile-sub">{r.year || '—'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
          </div>
        ))}
      </div>

      {active && (
        <Modal title={active.title} onClose={() => setActive(null)}>
          <div className="faint" style={{ marginBottom: 14 }}>
            {active.year || '—'} · {active.media_type === 'tv' ? 'TV series' : 'Movie'}
          </div>
          {active.overview && <p className="muted" style={{ marginTop: 0 }}>{active.overview}</p>}

          <AddToWatchlist seed={active} groups={groups} userId={user.id} onDone={() => setActive(null)} />

          <button
            className="btn primary block"
            style={{ marginTop: 10 }}
            onClick={() => { setWatchItem({ seed: active, title: active.title, media_type: active.media_type }); setActive(null) }}
          >
            ✓ Mark as watched
          </button>
        </Modal>
      )}

      {watchItem && (
        <MarkWatchedModal
          item={watchItem}
          groups={groups}
          profiles={profiles}
          onClose={() => setWatchItem(null)}
        />
      )}
    </div>
  )
}

function AddToWatchlist({ seed, groups, userId, onDone }) {
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState(null)

  async function add() {
    setBusy(true); setErr(null)
    try {
      await addToWatchlist({ seed, groupId, addedBy: userId })
      setDone(true)
      setTimeout(onDone, 700)
    } catch (e) {
      setErr(e.message); setBusy(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <label className="faint" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
        Add to watchlist for:
      </label>
      {err && <div className="banner error">{err}</div>}
      <div className="row">
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {groups.length === 0 && <option value="">— create a group first —</option>}
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="btn" disabled={busy || done || !groupId} onClick={add}>
          {done ? '✓ Added' : busy ? '…' : '🔖 Add'}
        </button>
      </div>
    </div>
  )
}
