import { useEffect, useRef, useState } from 'react'
import { searchMulti } from '../lib/tmdb'
import { addToWatchlist } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppData'
import { useToast } from '../context/Toast'
import { getPref } from '../lib/prefs'
import { Modal, Poster } from './ui'
import MarkWatchedModal from './MarkWatchedModal'
import { Plus, Bookmark } from 'lucide-react'

export default function QuickAdd() {
  const { user } = useAuth()
  const { groups, profiles } = useAppData()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [logItem, setLogItem] = useState(null)
  const [busy, setBusy] = useState('')
  const deb = useRef()

  useEffect(() => {
    clearTimeout(deb.current)
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    deb.current = setTimeout(async () => {
      try { setResults((await searchMulti(q)).slice(0, 12)) } catch { setResults([]) } finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(deb.current)
  }, [q])

  function close() { setOpen(false); setQ(''); setResults([]) }

  const defaultGroup = () => {
    const pref = getPref('defaultGroupId', '')
    return (pref && groups.some((g) => g.id === pref)) ? pref : (groups[0]?.id || null)
  }
  async function watchlist(r) {
    const gid = defaultGroup()
    if (!gid) { toast('Create a group first', 'err'); return }
    setBusy(`${r.media_type}-${r.tmdb_id}`)
    try { await addToWatchlist({ seed: r, groupId: gid, addedBy: user.id }); toast(`Added “${r.title}” to watchlist`) }
    catch (e) { toast(e.message || 'Could not add', 'err') } finally { setBusy('') }
  }

  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-label="Quick add" title="Log or add a title"><Plus size={26} /></button>

      {open && (
        <Modal title="Quick add" onClose={close}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a movie or show…" style={{ marginBottom: 12 }} />
          {loading && <div className="faint">Searching…</div>}
          {!loading && q.trim() && results.length === 0 && <div className="faint">No results.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '52vh', overflowY: 'auto' }}>
            {results.map((r) => (
              <div className="card row" key={`${r.media_type}-${r.tmdb_id}`} style={{ gap: 10, alignItems: 'center', padding: 10 }}>
                <div style={{ width: 38, flexShrink: 0 }}>
                  <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{r.title}</strong>
                  <div className="faint">{r.year || ''} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
                </div>
                <button className="btn sm primary" onClick={() => setLogItem({ seed: r, title: r.title, media_type: r.media_type })}>Log</button>
                <button className="btn sm" disabled={busy === `${r.media_type}-${r.tmdb_id}`} onClick={() => watchlist(r)} title="Add to watchlist"><Bookmark size={16} /></button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {logItem && (
        <MarkWatchedModal
          item={logItem}
          groups={groups}
          profiles={profiles}
          onClose={() => setLogItem(null)}
          onSaved={() => { setLogItem(null); close(); toast('Saved to your diary') }}
        />
      )}
    </>
  )
}
