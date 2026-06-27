import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCollection, updateCollection, deleteCollection, removeFromCollection, reorderCollection } from '../lib/db'
import { useToast } from '../context/Toast'
import { Spinner, Empty, Poster, TitleLink, Modal } from '../components/ui'

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [col, setCol] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [reordering, setReordering] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const c = await getCollection(id)
      setCol(c); setItems(c?.items || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  async function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    setReordering(true)
    try { await reorderCollection(next.map((it) => it.id)) } finally { setReordering(false) }
  }
  async function remove(itemId) {
    setItems((arr) => arr.filter((it) => it.id !== itemId))
    await removeFromCollection(itemId).catch(load)
  }
  async function onDeleteList() {
    if (!confirm('Delete this whole list? (Your watches and ratings are not affected.)')) return
    await deleteCollection(id)
    toast('List deleted')
    navigate('/lists')
  }

  if (loading) return <div className="page"><Spinner /></div>
  if (!col) return <div className="page"><Empty icon="📚">List not found.</Empty></div>

  return (
    <div className="page">
      <button className="btn sm ghost" onClick={() => navigate('/lists')} style={{ marginBottom: 12 }}>← All lists</button>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>{col.emoji || '📚'} {col.name}</h1>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn sm danger" onClick={onDeleteList}>Delete</button>
        </div>
      </div>
      {col.description && <p className="sub">{col.description}</p>}
      <div className="faint" style={{ marginBottom: 16 }}>
        {items.length} title{items.length === 1 ? '' : 's'}{col.ranked ? ' · ranked' : ''}{reordering ? ' · saving order…' : ''}
      </div>

      {items.length === 0 ? (
        <Empty icon="➕">This list is empty. Open any movie or show and choose “Add to list”.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((it, i) => {
            const t = it.titles
            return (
              <div className="card row" key={it.id} style={{ gap: 12, alignItems: 'center' }}>
                {col.ranked && <div className="rank-num">{i + 1}</div>}
                <TitleLink className="tile" tmdbId={t?.tmdb_id} media={t?.media_type} style={{ width: 46, flexShrink: 0 }}>
                  <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                </TitleLink>
                <TitleLink className="" tmdbId={t?.tmdb_id} media={t?.media_type} style={{ flex: 1, minWidth: 0 }}>
                  <strong>{t?.title}</strong> <span className="faint">{t?.year || ''}</span>
                  {it.note && <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{it.note}</div>}
                </TitleLink>
                <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                  <button className="btn sm ghost" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">↑</button>
                  <button className="btn sm ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Move down">↓</button>
                  <button className="btn sm ghost" onClick={() => remove(it.id)} title="Remove">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && <EditList col={col} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load() }} toast={toast} />}
    </div>
  )
}

function EditList({ col, onClose, onSaved, toast }) {
  const [name, setName] = useState(col.name)
  const [description, setDescription] = useState(col.description || '')
  const [ranked, setRanked] = useState(!!col.ranked)
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try { await updateCollection(col.id, { name: name.trim() || col.name, description: description || null, ranked }); toast('List updated'); onSaved() }
    catch (e) { toast(e.message || 'Could not save', 'err'); setBusy(false) }
  }
  return (
    <Modal title="Edit list" onClose={onClose}>
      <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>Description</label><textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="field">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 18, height: 18 }} checked={ranked} onChange={(e) => setRanked(e.target.checked)} />
          <span>Ranked list (numbered)</span>
        </label>
      </div>
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}
