import { useEffect, useState } from 'react'
import { Modal } from './ui'
import { listCollections, createCollection, addToCollection } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'

// item: { seed?, titleId?, title }
export default function AddToCollectionModal({ item, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const [lists, setLists] = useState(null)
  const [added, setAdded] = useState({})       // collectionId -> true
  const [busy, setBusy] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => { listCollections().then(setLists).catch(() => setLists([])) }, [])

  async function add(collectionId) {
    setBusy(collectionId)
    try {
      await addToCollection({ collectionId, seed: item.seed, titleId: item.titleId })
      setAdded((a) => ({ ...a, [collectionId]: true }))
    } catch (e) { toast(e.message || 'Could not add', 'err') } finally { setBusy('') }
  }

  async function createAndAdd() {
    if (!newName.trim()) return
    setBusy('new')
    try {
      const id = await createCollection({ name: newName.trim(), ownerId: user.id })
      await addToCollection({ collectionId: id, seed: item.seed, titleId: item.titleId })
      setLists((l) => [{ id, name: newName.trim(), emoji: '📚', item_count: 1 }, ...(l || [])])
      setAdded((a) => ({ ...a, [id]: true }))
      setNewName('')
      toast('List created & added')
    } catch (e) { toast(e.message || 'Could not create', 'err') } finally { setBusy('') }
  }

  return (
    <Modal title={`Add “${item.title}” to a list`} onClose={onClose}>
      <div className="field">
        <label>New list</label>
        <div className="row" style={{ gap: 8 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Best heist movies"
            onKeyDown={(e) => e.key === 'Enter' && createAndAdd()} />
          <button className="btn primary" disabled={!newName.trim() || busy === 'new'} onClick={createAndAdd}>Create</button>
        </div>
      </div>

      <div className="field">
        <label>Your lists</label>
        {lists == null ? (
          <div className="faint">Loading…</div>
        ) : lists.length === 0 ? (
          <div className="faint">No lists yet — create one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lists.map((c) => (
              <div className="card row" key={c.id} style={{ gap: 10, alignItems: 'center', padding: 12 }}>
                <span style={{ fontSize: 20 }}>{c.emoji || '📚'}</span>
                <strong style={{ flex: 1, minWidth: 0 }}>{c.name}</strong>
                {added[c.id] ? (
                  <span className="badge-done" style={{ margin: 0 }}>✓ Added</span>
                ) : (
                  <button className="btn sm" disabled={busy === c.id} onClick={() => add(c.id)}>{busy === c.id ? '…' : 'Add'}</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn block" onClick={onClose}>Done</button>
    </Modal>
  )
}
