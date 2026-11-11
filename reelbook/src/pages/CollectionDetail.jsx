import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCollection, updateCollection, deleteCollection, removeFromCollection, reorderCollection, getLibraryTmdbIds, getLibraryGroupMap } from '../lib/db'
import { useToast } from '../context/Toast'
import { useAppData } from '../context/AppData'
import { Spinner, Empty, Poster, TitleLink, Modal } from '../components/ui'
import { IMG } from '../lib/tmdb'

// A franchise list repeats the same words on every title ("Pirates of the
// Caribbean: ..."), which fills both lines of every label and makes the whole
// shelf read the same. Strip a prefix the entire list shares, but only at a
// colon or dash and only when it is long enough to be worth losing.
function sharedPrefix(names) {
  if (names.length < 3) return ''
  let p = names[0] || ''
  for (const n of names.slice(1)) {
    let i = 0
    while (i < p.length && i < n.length && p[i] === n[i]) i++
    p = p.slice(0, i)
    if (!p) return ''
  }
  const cut = Math.max(p.lastIndexOf(': '), p.lastIndexOf(' - '))
  if (cut < 0) return ''
  const pre = p.slice(0, cut + 2)
  if (pre.length < 12) return ''
  // Never leave a title stub too short to recognise.
  if (names.some((n) => n.slice(pre.length).trim().length < 3)) return ''
  return pre
}

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
  // Grid is the nice view; reorder needs rows with arrows, which do not
  // belong on a poster shelf and do not work by hover on a phone.
  const [reorderMode, setReorderMode] = useState(false)
  useEffect(() => {
    // Logged rather than swallowed: a silent failure here renders every list
    // as 0 watched, which looks like real data and hides the fault.
    getLibraryTmdbIds().then(setLib).catch((e) => console.error('library ids', e))
    getLibraryGroupMap().then(setByGroup).catch((e) => console.error('library groups', e))
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
  // The first item with artwork gives the page its backdrop.
  const heroArt = inType.find((it) => it.titles?.backdrop_path)?.titles?.backdrop_path
  const prefix = sharedPrefix(inType.map((it) => it.titles?.title || '').filter(Boolean))
  const shortName = (n) => (prefix && n?.startsWith(prefix) ? n.slice(prefix.length) : n)

  if (loading) return <div className="page"><Spinner /></div>
  if (!col) return <div className="page"><Empty icon="📚">List not found.</Empty></div>

  return (
    <div className="page">
      <button className="btn sm ghost" onClick={() => navigate('/lists')} style={{ marginBottom: 12 }}>← All lists</button>

      <div className={`list-hero ${heroArt ? '' : 'plain'}`}>
        {heroArt && <div className="list-hero-bg" style={{ backgroundImage: `url(${IMG.backdrop(heroArt, 'w1280')})` }} />}
        <div className="list-hero-in">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h1><span className="em">{col.emoji || '📚'}</span>{col.name}</h1>
            <div className="row" style={{ gap: 8, flexShrink: 0 }}>
              <button className="btn sm" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn sm danger" onClick={onDeleteList}>Delete</button>
            </div>
          </div>
          {col.description && <p className="sub">{col.description}</p>}
          <div className="hero-count">
            {inType.length} title{inType.length === 1 ? '' : 's'}
            {col.ranked ? ' · ranked' : ''}{reordering ? ' · saving order…' : ''}
          </div>
        </div>
      </div>

      {inType.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="lp-head">
            <span className="lp-big">{seen} of {inType.length} watched</span>
            {complete
              ? <span className="lp-badge">✓ Completed</span>
              : <span className="faint">{left} to go</span>}
            <span className="lp-pct">{pct}%</span>
          </div>
          <div className="lp-track">
            <div className={`lp-fill ${complete ? 'done' : ''}`} style={{ width: `${pct}%` }} />
          </div>

          {/* One chip per group, so "did I finish it alone" and "did we finish
              it together" are both answered without switching anything. */}
          <div className="scroll-x" style={{ marginTop: 14 }}>
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
            <label className="row" style={{ gap: 8, cursor: 'pointer', marginTop: 14 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} checked={onlyLeft} onChange={(e) => setOnlyLeft(e.target.checked)} />
              <span>Show only what's left ({left})</span>
            </label>
          )}
        </div>
      )}

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {counts.movie > 0 && counts.tv > 0 && (
          <div className="seg">
            {[['all', `All (${counts.all})`], ['movie', `Movies (${counts.movie})`], ['tv', `TV (${counts.tv})`]].map(([v, l]) => (
              <button key={v} className={typeF === v ? 'on' : ''} onClick={() => setTypeF(v)}>{l}</button>
            ))}
          </div>
        )}
        {items.length > 1 && (
          <button className={`btn sm ${reorderMode ? 'primary' : 'ghost'}`} style={{ marginLeft: 'auto' }}
            onClick={() => setReorderMode((v) => !v)}
            title={canReorder ? 'Reorder or remove titles' : 'Clear the filters to reorder'}>
            {reorderMode ? 'Done' : '☰ Edit order'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <Empty icon="➕">This list is empty. Open any movie or show and choose “Add to list”.</Empty>
      ) : view.length === 0 ? (
        <Empty icon="🎉">Nothing left here. That's the whole list watched.</Empty>
      ) : reorderMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.map((it, i) => {
            const t = it.titles
            return (
              <div className="card row" key={it.id} style={{ gap: 12, alignItems: 'center' }}>
                {col.ranked && <div className="rank-num">{i + 1}</div>}
                <div style={{ width: 40, flexShrink: 0 }}>
                  <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{t?.title}</strong>{' '}
                  <span className="faint">{t?.year || ''} · {t?.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                </div>
                <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                  <button className="btn sm ghost" disabled={!canReorder || i === 0} onClick={() => move(i, -1)}
                    title={canReorder ? 'Move up' : 'Clear the filters to reorder'}>↑</button>
                  <button className="btn sm ghost" disabled={!canReorder || i === items.length - 1} onClick={() => move(i, 1)}
                    title={canReorder ? 'Move down' : 'Clear the filters to reorder'}>↓</button>
                  <button className="btn sm ghost" onClick={() => remove(it.id)} title="Remove">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="lg-grid">
          {view.map((it, i) => {
            const t = it.titles
            const watched = seenBy(t, who)
            return (
              <TitleLink className={`lg-item tile ${watched ? 'seen' : ''}`} key={it.id}
                tmdbId={t?.tmdb_id} media={t?.media_type}>
                {col.ranked && <span className="lg-rank">{i + 1}</span>}
                {watched && <span className="lg-tick" title="Watched">✓</span>}
                <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                <div className="lg-name" title={t?.title}>{shortName(t?.title)}</div>
                <div className="lg-sub">{t?.year || ''}{t?.media_type === 'tv' ? ' · TV' : ''}</div>
                {it.note && <div className="lg-note">{it.note}</div>}
              </TitleLink>
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
