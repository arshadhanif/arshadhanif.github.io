import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCollections, createCollection } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Spinner, Empty, Modal } from '../components/ui'

const EMOJIS = ['🎬', '🍿', '👽', '😱', '😭', '❤️', '🔥', '🏆', '🎄', '🕵️', '🚀', '🎃', '👑', '🌍']

export default function Collections() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try { setLists(await listCollections()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="page">
      <div className="page-head">
        <h1>Lists</h1>
        <button className="btn sm primary" onClick={() => setCreating(true)}>+ New list</button>
      </div>
      <p className="sub">Curate your own collections, like “Best heist movies” or “Comfort rewatches”.</p>

      {loading ? <Spinner /> : lists.length === 0 ? (
        <Empty icon="📚">No lists yet. Create one, then add titles from any movie or show page.</Empty>
      ) : (
        <div className="grid-cards">
          {lists.map((c) => (
            <button key={c.id} className="card collection-card" onClick={() => navigate(`/lists/${c.id}`)}>
              <div className="collection-emoji">{c.emoji || '📚'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.name}</strong>
                <div className="faint" style={{ marginTop: 2 }}>
                  {c.item_count} title{c.item_count === 1 ? '' : 's'}{c.ranked ? ' · ranked' : ''}
                </div>
                {c.description && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.description}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateList user={user} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); navigate(`/lists/${id}`) }} toast={toast} />
      )}
    </div>
  )
}

function CreateList({ user, onClose, onCreated, toast }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎬')
  const [ranked, setRanked] = useState(false)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      const id = await createCollection({ name: name.trim(), description, emoji, ranked, ownerId: user.id })
      toast('List created')
      onCreated(id)
    } catch (e) { toast(e.message || 'Could not create list', 'err'); setBusy(false) }
  }

  return (
    <Modal title="New list" onClose={onClose}>
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Best heist movies" autoFocus />
      </div>
      <div className="field">
        <label>Description (optional)</label>
        <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Icon</label>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              style={{ fontSize: 22, padding: 4, borderRadius: 8, border: emoji === e ? '2px solid var(--accent)' : '2px solid transparent', background: emoji === e ? 'var(--accent-soft)' : 'var(--bg-elev-2)' }}>{e}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 18, height: 18 }} checked={ranked} onChange={(e) => setRanked(e.target.checked)} />
          <span>Ranked list (numbered 1, 2, 3…)</span>
        </label>
      </div>
      <button className="btn primary block" disabled={busy || !name.trim()} onClick={save}>{busy ? 'Creating…' : 'Create list'}</button>
    </Modal>
  )
}
