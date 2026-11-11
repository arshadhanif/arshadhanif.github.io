import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCollection, updateCollection, deleteCollection, removeFromCollection, reorderCollection, getLibraryTmdbIds, getLibraryGroupMap } from '../lib/db'
import { useToast } from '../context/Toast'
import { useAppData } from '../context/AppData'
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
  const [typeF, setTypeF] = useState('all')   // all | movie | tv
  const { groups } = useAppData()
  // Which of these you've already seen, so a franchise list doubles as a
  // progress check rather than just a pile of posters.
  const [lib, setLib] = useState({ watched: new Set(), watchlist: new Set() })
  // ...and who saw them, so "have I finished this on my own" and "have we
  // finished it together" are different questions with different answers.
  const [byGroup, setByGroup] = useState(new Map())
  const [who, setWho] = useState('any')       // 'any' | group id
  const [onlyLeft, setOnlyLeft] = useState(false)
  useEffect(() => {
    getLibraryTmdbIds().then(setLib).catch(() => {})
    getLibraryGroupMap().then(setByGroup).catch(() => {})
  }, [])

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

  const counts = {
    all: items.length,
    movie: items.filter((it) => it.titles?.media_type === 'movie').length,
    tv: items.filter((it) => it.titles?.media_type === 'tv').length,
  }
  const inType = typeF === 'all' ? items : items.filter((it) => it.titles?.media_type === typeF)

  // "Watched" depends on who you are asking about: anyone in the household, or
  // one specific group. The type filter applies to both, so switching to Movies
  // asks "have we finished the films" rather than the whole franchise.
  const seenBy = (t, g) => {
    const id = t?.tmdb_id
    if (id == null) return false
    return g === 'any' ? lib.watched.has(id) : !!byGroup.get(id)?.has(g)
  }
  const tally = (g) => inType.filter((it) => seenBy(it.titles, g)).length
  const seen = tally(who)
  const left = inType.length - seen
  const pct = inType.length ? Math.round((seen / inType.length) * 100) : 0
  const complete = inType.length > 0 && left === 0
  const view = onlyLeft ? inType.filter((it) => !seenBy(it.titles, who)) : inType
  // Reordering writes positions by index, so it only makes sense on the full list.
  const canReorder = typeF === 'all' && !onlyLeft

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
      <div className="faint" style={{ marginBottom: 10 }}>
        {inType.length} title{inType.length === 1 ? '' : 's'}
        {col.ranked ? ' · ranked' : ''}{reordering ? ' · saving order…' : ''}
      </div>

      {inType.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 15 }}>
              {seen} of {inType.length} watched
            </strong>
            {complete
              ? <span className="watched-chip" style={{ background: 'var(--green)', color: '#0b0d12', fontWeight: 800, fontSize: 12.5, padding: '2px 9px', borderRadius: 6 }}>✓ Completed</span>
              : <span className="faint">{left} to go</span>}
            <span className="faint" style={{ marginLeft: 'auto' }}>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: complete ? 'var(--green)' : 'var(--accent)' }} />
          </div>

          {/* One row per group, so "did I finish it alone" and "did we finish it
              together" are both answered without switching anything. */}
          <div className="scroll-x" style={{ marginTop: 12 }}>
            {[{ id: 'any', name: 'Anyone' }, ...groups].map((g) => {
              const n = tally(g.id)
              const full = inType.length > 0 && n === inType.length
              return (
                <button key={g.id} className={`chip ${who === g.id ? 'active' : ''}`}
                  style={who === g.id ? { background: 'var(--text)', borderColor: 'var(--text)', color: 'var(--bg)' } : undefined}
                  onClick={() => setWho(g.id)}>
                  {full ? '✓ ' : ''}{g.name} {n}/{inType.length}
                </button>
              )
            })}
          </div>

          {left > 0 && (
            <label className="row" style={{ gap: 8, cursor: 'pointer', marginTop: 12 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} checked={onlyLeft} onChange={(e) => setOnlyLeft(e.target.checked)} />
              <span>Show only what's left ({left})</span>
            </label>
          )}
        </div>
      )}

      {counts.movie > 0 && counts.tv > 0 && (
        <div className="seg" style={{ marginBottom: 16 }}>
          {[['all', `All (${counts.all})`], ['movie', `Movies (${counts.movie})`], ['tv', `TV (${counts.tv})`]].map(([v, l]) => (
            <button key={v} className={typeF === v ? 'on' : ''} onClick={() => setTypeF(v)}>{l}</button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon="➕">This list is empty. Open any movie or show and choose “Add to list”.</Empty>
      ) : view.length === 0 ? (
        <Empty icon="🎉">Nothing left here. That's the whole list watched.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.map((it, i) => {
            const t = it.titles
            const watched = seenBy(t, who)
            return (
              <div className="card row" key={it.id} style={{ gap: 12, alignItems: 'center' }}>
                {col.ranked && <div className="rank-num">{i + 1}</div>}
                <TitleLink className="tile" tmdbId={t?.tmdb_id} media={t?.media_type} style={{ width: 46, flexShrink: 0, position: 'relative' }}>
                  <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                  {watched && <span className="ep-badge" style={{ background: 'var(--green)', color: '#0b0d12', top: 3, right: 3, padding: '1px 5px' }} title="Watched">✓</span>}
                </TitleLink>
                <TitleLink className="" tmdbId={t?.tmdb_id} media={t?.media_type} style={{ flex: 1, minWidth: 0 }}>
                  <strong>{t?.title}</strong> <span className="faint">{t?.year || ''} · {t?.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                  {it.note && <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{it.note}</div>}
                </TitleLink>
                <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                  <button className="btn sm ghost" disabled={!canReorder || i === 0} onClick={() => move(i, -1)}
                    title={canReorder ? 'Move up' : 'Show the whole list to reorder'}>↑</button>
                  <button className="btn sm ghost" disabled={!canReorder || i === items.length - 1} onClick={() => move(i, 1)}
                    title={canReorder ? 'Move down' : 'Show the whole list to reorder'}>↓</button>
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
