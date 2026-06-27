import { useEffect, useState } from 'react'
import { listFavorites, addFavorite, removeFavorite, reorderFavorites } from '../lib/db'
import { searchMulti } from '../lib/tmdb'
import { Poster, TitleLink, Modal } from './ui'
import { useToast } from '../context/Toast'

const MAX = 4

// Read-only display of a profile's favourites.
export function FavoritesStrip({ favorites }) {
  if (!favorites?.length) return <div className="faint">No favourites picked yet.</div>
  return (
    <div className="fav-strip">
      {favorites.map((f) => (
        <TitleLink key={f.id} className="fav-item" tmdbId={f.titles?.tmdb_id} media={f.titles?.media_type}>
          <Poster title={f.titles?.title} mediaType={f.titles?.media_type} posterPath={f.titles?.poster_path} />
        </TitleLink>
      ))}
    </div>
  )
}

// Editable Top-4 for the current user.
export function FavoritesEditor({ profileId }) {
  const toast = useToast()
  const [favs, setFavs] = useState([])
  const [picking, setPicking] = useState(false)

  async function load() { setFavs(await listFavorites(profileId).catch(() => [])) }
  useEffect(() => { load() }, [profileId])

  async function remove(id) { setFavs((a) => a.filter((f) => f.id !== id)); await removeFavorite(id).catch(load) }
  async function move(i, dir) {
    const j = i + dir; if (j < 0 || j >= favs.length) return
    const next = [...favs]; [next[i], next[j]] = [next[j], next[i]]
    setFavs(next); await reorderFavorites(next.map((f) => f.id)).catch(load)
  }

  return (
    <div>
      <div className="fav-strip">
        {favs.map((f, i) => (
          <div key={f.id} className="fav-edit">
            <Poster title={f.titles?.title} mediaType={f.titles?.media_type} posterPath={f.titles?.poster_path} />
            <div className="fav-ctrls">
              <button disabled={i === 0} onClick={() => move(i, -1)} title="Move left">←</button>
              <button onClick={() => remove(f.id)} title="Remove">✕</button>
              <button disabled={i === favs.length - 1} onClick={() => move(i, 1)} title="Move right">→</button>
            </div>
          </div>
        ))}
        {favs.length < MAX && (
          <button className="fav-add" onClick={() => setPicking(true)}>+<span>Add</span></button>
        )}
      </div>
      {picking && (
        <PickFavorite
          onClose={() => setPicking(false)}
          onPick={async (seed) => {
            try { await addFavorite({ profileId, seed }); await load() } catch (e) { toast(e.message || 'Could not add', 'err') }
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

function PickFavorite({ onClose, onPick }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)

  async function run(e) {
    e?.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    try { setResults((await searchMulti(q)).slice(0, 12)) } finally { setBusy(false) }
  }

  return (
    <Modal title="Add a favourite" onClose={onClose}>
      <form className="row" style={{ gap: 8, marginBottom: 12 }} onSubmit={run}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a movie or show…" autoFocus />
        <button className="btn primary" disabled={busy}>Search</button>
      </form>
      {results.length > 0 && (
        <div className="grid">
          {results.map((r) => (
            <button key={`${r.media_type}-${r.tmdb_id}`} className="tile" onClick={() => onPick(r)} style={{ textAlign: 'left' }}>
              <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
              <div className="tile-title">{r.title}</div>
              <div className="tile-sub">{r.year || ''} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
