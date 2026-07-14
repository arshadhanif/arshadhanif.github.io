import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listWatchlist, removeFromWatchlist, copyWatchlistToGroup, mergeWatchlists,
} from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Poster, Spinner, Empty, GroupChips, TitleLink, Modal } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'
import Roulette from '../components/Roulette'

export default function Watchlist() {
  const { groups, profiles } = useAppData()
  const { user } = useAuth()
  const toast = useToast()
  const [groupId, setGroupId] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchItem, setWatchItem] = useState(null)
  const [typeF, setTypeF] = useState('all')
  const [sort, setSort] = useState('recent')
  const [q, setQ] = useState('')
  const [overlapOnly, setOverlapOnly] = useState(false)
  const [roulette, setRoulette] = useState(false)
  const [merge, setMerge] = useState(false)
  const [busy, setBusy] = useState(false)

  // Always load every group's watchlist so we can show cross-list overlap and
  // transfer between lists; the group chips just filter the deduped view.
  const load = useCallback(async () => {
    setLoading(true)
    try { setRows(await listWatchlist(null)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Dedupe by title: one card per show, carrying every list it sits on.
  const byTitle = useMemo(() => {
    const m = new Map()
    for (const it of rows) {
      const t = it.titles
      if (!t?.id) continue
      if (!m.has(t.id)) m.set(t.id, { title: t, entries: [] })
      m.get(t.id).entries.push({ id: it.id, group: it.groups, groupId: it.group_id, created_at: it.created_at })
    }
    return m
  }, [rows])

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...byTitle.values()]
      .filter((x) => typeF === 'all' || x.title.media_type === typeF)
      .filter((x) => !needle || (x.title.title || '').toLowerCase().includes(needle))
      .filter((x) => !groupId || x.entries.some((e) => e.groupId === groupId))
      .filter((x) => !overlapOnly || x.entries.length > 1)
      .sort((a, b) => {
        if (sort === 'title') return (a.title.title || '').localeCompare(b.title.title || '')
        if (sort === 'year') return (b.title.year || 0) - (a.title.year || 0)
        const la = a.entries.reduce((mx, e) => e.created_at > mx ? e.created_at : mx, '')
        const lb = b.entries.reduce((mx, e) => e.created_at > mx ? e.created_at : mx, '')
        return lb.localeCompare(la)
      })
  }, [byTitle, typeF, q, groupId, overlapOnly, sort])

  const overlapCount = useMemo(
    () => [...byTitle.values()].filter((x) => x.entries.length > 1).length,
    [byTitle],
  )

  async function removeEntry(entryId) {
    setRows((xs) => xs.filter((x) => x.id !== entryId))
    try { await removeFromWatchlist(entryId) } catch { load() }
  }

  async function copyTo(titleId, targetGroupId) {
    setBusy(true)
    try {
      const { created } = await copyWatchlistToGroup(titleId, targetGroupId, user.id)
      const g = groups.find((x) => x.id === targetGroupId)
      toast(created ? `Added to ${g?.name}` : `Already on ${g?.name}`)
      if (created) await load()
    } catch (e) { toast(e.message || 'Could not copy') }
    finally { setBusy(false) }
  }

  const roulettePool = view.map((x) => ({ id: x.entries[0].id, titles: x.title }))

  return (
    <div className="page">
      <div className="page-head">
        <h1>Watchlist</h1>
        <div className="row" style={{ gap: 8 }}>
          {groups.length > 1 && (
            <button className="btn sm" onClick={() => setMerge(true)}>⇄ Merge lists</button>
          )}
          <button className="btn sm primary" onClick={() => setRoulette(true)}>🎲 Surprise me</button>
        </div>
      </div>

      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 160px' }} />
        <div className="seg">
          {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={typeF === v ? 'on' : ''} onClick={() => setTypeF(v)}>{l}</button>
          ))}
        </div>
        <button
          className={`btn sm ${overlapOnly ? 'primary' : ''}`}
          onClick={() => setOverlapOnly((v) => !v)}
          title="Show only titles that sit on more than one list"
        >
          ⧉ On 2+ lists{overlapCount ? ` (${overlapCount})` : ''}
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="recent">Recently added</option>
          <option value="title">Title A-Z</option>
          <option value="year">Year (newest)</option>
        </select>
      </div>

      {loading ? <Spinner /> : byTitle.size === 0 ? (
        <Empty>Nothing here yet. Add titles from <strong>Discover</strong>.</Empty>
      ) : view.length === 0 ? (
        <Empty icon="🔎">No items match these filters.</Empty>
      ) : (
        <div className="grid">
          {view.map((x) => {
            const t = x.title
            const onIds = new Set(x.entries.map((e) => e.groupId))
            const canAdd = groups.filter((g) => !onIds.has(g.id))
            return (
              <div key={t.id}>
                <TitleLink className="tile" tmdbId={t.tmdb_id} media={t.media_type}>
                  <Poster title={t.title} mediaType={t.media_type} posterPath={t.poster_path} />
                  <div className="tile-title">{t.title}</div>
                  <div className="tile-sub">{t.year || 'N/A'}</div>
                </TitleLink>

                <div className="wl-badges">
                  {x.entries.map((e) => (
                    <span key={e.id} className="wl-badge" style={{ background: e.group?.color || 'var(--chip)' }}>
                      {e.group?.name || 'List'}
                      <button title={`Remove from ${e.group?.name || 'list'}`} onClick={() => removeEntry(e.id)}>✕</button>
                    </span>
                  ))}
                </div>

                <div className="row" style={{ marginTop: 6, gap: 6 }}>
                  <button className="btn sm primary" style={{ flex: 1 }}
                    onClick={() => setWatchItem({
                      titleId: t.id, title: t.title, media_type: t.media_type,
                      total_episodes: t.total_episodes, _entries: x.entries,
                    })}>
                    ✓ Watched
                  </button>
                  {canAdd.length > 0 && (
                    <select
                      className="wl-copy" value="" disabled={busy}
                      onChange={(e) => { if (e.target.value) copyTo(t.id, e.target.value) }}
                      title="Copy to another list"
                    >
                      <option value="">Copy to…</option>
                      {canAdd.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {roulette && (
        <Roulette
          pool={roulettePool}
          onClose={() => setRoulette(false)}
          onWatched={(it) => { setRoulette(false); setWatchItem({ titleId: it.titles.id, title: it.titles.title, media_type: it.titles.media_type, total_episodes: it.titles.total_episodes, _entries: byTitle.get(it.titles.id)?.entries || [] }) }}
        />
      )}

      {merge && (
        <MergeModal
          groups={groups}
          busy={busy}
          onClose={() => setMerge(false)}
          onRun={async (sourceId, targetId, move) => {
            setBusy(true)
            try {
              const r = await mergeWatchlists(sourceId, targetId, user.id, { move })
              const tName = groups.find((g) => g.id === targetId)?.name
              toast(`${move ? 'Moved' : 'Copied'} ${r.copied} to ${tName}` + (r.skipped ? `, ${r.skipped} already there` : ''))
              setMerge(false)
              await load()
            } catch (e) { toast(e.message || 'Merge failed') }
            finally { setBusy(false) }
          }}
        />
      )}

      {watchItem && (
        <MarkWatchedModal
          item={watchItem}
          groups={groups}
          profiles={profiles}
          onClose={() => setWatchItem(null)}
          onSaved={async (chosenGroupId) => {
            // Drop the just-watched show from the list it was marked against.
            const entry = (watchItem._entries || []).find((e) => e.groupId === chosenGroupId)
            if (entry) await removeFromWatchlist(entry.id)
            load()
          }}
        />
      )}
    </div>
  )
}

// Bulk copy or move one list into another.
function MergeModal({ groups, busy, onClose, onRun }) {
  const [sourceId, setSourceId] = useState(groups[0]?.id || '')
  const [targetId, setTargetId] = useState(groups[1]?.id || groups[0]?.id || '')
  const [move, setMove] = useState(false)
  const same = sourceId === targetId
  return (
    <Modal title="Merge / transfer lists" onClose={onClose}>
      <p className="muted" style={{ marginTop: 0 }}>
        Copy every title from one list into another. Duplicates are skipped, so it is safe to run.
      </p>
      <div className="field">
        <label>From</label>
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Into</label>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <label className="row" style={{ gap: 8, marginTop: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={move} onChange={(e) => setMove(e.target.checked)} style={{ width: 'auto' }} />
        <span>Move instead of copy (also clears the source list)</span>
      </label>
      {same && <p className="muted" style={{ marginTop: 10 }}>Pick two different lists.</p>}
      <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={same || busy} onClick={() => onRun(sourceId, targetId, move)}>
          {busy ? 'Working…' : move ? 'Move list' : 'Copy list'}
        </button>
      </div>
    </Modal>
  )
}
