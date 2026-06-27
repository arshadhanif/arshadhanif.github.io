import { useCallback, useEffect, useState } from 'react'
import { listDiary, deleteWatch, setRating, updateWatch } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, DualScore, Modal, StarRating, TitleLink } from '../components/ui'

export default function Diary() {
  const { groups, profiles } = useAppData()
  const [groupId, setGroupId] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setEntries(await listDiary({ groupId })) }
    finally { setLoading(false) }
  }, [groupId])

  useEffect(() => { load() }, [load])

  return (
    <div className="page">
      <h1>Diary</h1>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {loading ? <Spinner /> : entries.length === 0 ? (
        <Empty>No watches logged yet. Mark something watched from <strong>Discover</strong> or your <strong>Watchlist</strong>.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((e) => {
            const t = e.titles
            return (
              <div key={e.id} className="card row" style={{ alignItems: 'flex-start', gap: 14 }}>
                <TitleLink className="tile" tmdbId={t?.tmdb_id} media={t?.media_type} style={{ width: 64, flexShrink: 0 }}>
                  <div style={{ width: 64 }}>
                    <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                  </div>
                </TitleLink>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="spread">
                    <strong style={{ fontSize: 16 }}>{t?.title} <span className="faint">{t?.year || ''}</span></strong>
                    <button className="btn sm" onClick={() => setEditing(e)}>Edit</button>
                  </div>
                  <div className="faint" style={{ margin: '4px 0 8px' }}>
                    {fmtDate(e.watched_on)}
                    {e.groups && <> · <span style={{ color: e.groups.color }}>{e.groups.name}</span></>}
                    {t?.media_type === 'tv' && e.episodes_watched > 0 && (
                      <> · {e.episodes_watched}{t.total_episodes ? `/${t.total_episodes}` : ''} eps</>
                    )}
                  </div>
                  <DualScore profiles={profiles} ratings={e.ratings} />
                  {e.note && <p className="muted" style={{ margin: '8px 0 0', fontSize: 14 }}>“{e.note}”</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EditWatch
          entry={editing}
          profiles={profiles}
          onClose={() => setEditing(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}

function EditWatch({ entry, profiles, onClose, onChanged }) {
  const t = entry.titles
  const initial = Object.fromEntries((entry.ratings || []).map((r) => [r.profile_id, r.score]))
  const [ratings, setRatings] = useState(initial)
  const [episodes, setEpisodes] = useState(entry.episodes_watched || 0)
  const [note, setNote] = useState(entry.note || '')
  const [busy, setBusy] = useState(false)
  const isTv = t?.media_type === 'tv'

  async function save() {
    setBusy(true)
    try {
      await updateWatch(entry.id, {
        note: note || null,
        episodes_watched: isTv ? Number(episodes) || 0 : 0,
      })
      for (const p of profiles) {
        const score = ratings[p.id]
        if (score != null && score !== '' && score !== initial[p.id]) {
          await setRating(entry.id, p.id, Number(score))
        }
      }
      onChanged()
      onClose()
    } finally { setBusy(false) }
  }

  async function remove() {
    if (!confirm('Delete this diary entry?')) return
    await deleteWatch(entry.id)
    onChanged()
    onClose()
  }

  return (
    <Modal title={`Edit · ${t?.title}`} onClose={onClose}>
      {isTv && (
        <div className="field">
          <label>Episodes watched{t.total_episodes ? ` (of ${t.total_episodes})` : ''}</label>
          <input type="number" min="0" value={episodes} onChange={(e) => setEpisodes(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label>Ratings (out of 10)</label>
        {profiles.map((p) => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <div className="faint" style={{ color: p.color, fontWeight: 700 }}>{p.name}</div>
            <StarRating value={ratings[p.id] || 0} color={p.color}
              onChange={(s) => setRatings((r) => ({ ...r, [p.id]: s }))} />
          </div>
        ))}
      </div>
      <div className="field">
        <label>Note</label>
        <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn primary" style={{ flex: 1 }} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="btn danger" onClick={remove}>Delete</button>
      </div>
    </Modal>
  )
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
