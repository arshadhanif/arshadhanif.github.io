import { useCallback, useEffect, useState } from 'react'
import { listDiary, listEpisodeDiary, deleteWatch, setRating, updateWatch } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, Modal, TitleLink } from '../components/ui'
import { formatWatched, fmtDate } from '../lib/dates'

export default function Diary() {
  const { groups, profiles } = useAppData()
  const [groupId, setGroupId] = useState(null)
  const [entries, setEntries] = useState([])
  const [epEntries, setEpEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [sort, setSort] = useState('recent')   // recent | oldest | rating
  const [typeF, setTypeF] = useState('all')     // all | movie | tv | episodes
  const [q, setQ] = useState('')
  const [genreF, setGenreF] = useState('all')
  const tagF = 'all'


  const allGenres = [...new Set(entries.flatMap((e) => (e.titles?.genre || '').split(',').map((g) => g.trim()).filter(Boolean)))].sort()

  const avgOf = (e) => {
    const rs = (e.ratings || []).filter((r) => r.score != null)
    return rs.length ? rs.reduce((a, b) => a + b.score, 0) / rs.length : -1
  }
  const view = entries
    .filter((e) => typeF === 'all' || e.titles?.media_type === typeF)
    .filter((e) => !q.trim() || (e.titles?.title || '').toLowerCase().includes(q.trim().toLowerCase()))
    .filter((e) => genreF === 'all' || (e.titles?.genre || '').split(',').map((g) => g.trim()).includes(genreF))
    .filter((e) => tagF === 'all' || (e.tags || []).includes(tagF))
    .sort((a, b) => {
      if (sort === 'rating') return avgOf(b) - avgOf(a)
      if (sort === 'oldest') return (a.watched_on || '').localeCompare(b.watched_on || '')
      return (b.watched_on || '').localeCompare(a.watched_on || '')
    })

  // Episodes are only shown under the Episodes tab, but the page used to fetch
  // every one of them on every visit: 11k+ rows with their titles and groups
  // joined, paged 1000 at a time, before anything could render. That was the
  // whole reason this page crawled. Load the diary now, episodes on demand.
  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await listDiary({ groupId, limit: 10000 }))
    } finally { setLoading(false) }
  }, [groupId])

  const [epLoading, setEpLoading] = useState(false)
  const [epLoaded, setEpLoaded] = useState(false)
  useEffect(() => { setEpEntries([]); setEpLoaded(false) }, [groupId])
  useEffect(() => {
    if (typeF !== 'episodes' || epLoaded || epLoading) return
    let alive = true
    setEpLoading(true)
    listEpisodeDiary({ groupId, limit: 20000 })
      .then((e) => { if (alive) { setEpEntries(e); setEpLoaded(true) } })
      .catch(() => {})
      .finally(() => alive && setEpLoading(false))
    return () => { alive = false }
  }, [typeF, groupId, epLoaded, epLoading])

  // Rendering all 11k episode cards at once locks the page up even once the
  // data is in. Show a page at a time.
  const EP_PAGE = 200
  const [epShown, setEpShown] = useState(EP_PAGE)
  useEffect(() => { setEpShown(EP_PAGE) }, [q, sort, groupId])
  const epAll = epEntries
    .filter((e) => !q.trim() || (e.titles?.title || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => sort === 'oldest'
      ? (a.watched_on || '').localeCompare(b.watched_on || '')
      : (b.watched_on || '').localeCompare(a.watched_on || ''))
  const epView = epAll.slice(0, epShown)

  useEffect(() => { load() }, [load])

  return (
    <div className="page">
      <h1>Diary</h1>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {(entries.length > 0 || epEntries.length > 0) && (
        <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 150px' }} />
          <div className="seg">
            {[['recent', 'Newest'], ['oldest', 'Oldest'], ['rating', 'Top rated']].map(([v, l]) => (
              <button key={v} className={sort === v ? 'on' : ''} onClick={() => setSort(v)}>{l}</button>
            ))}
          </div>
          <div className="seg">
            {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV'], ['episodes', 'Episodes']].map(([v, l]) => (
              <button key={v} className={typeF === v ? 'on' : ''} onClick={() => setTypeF(v)}>{l}</button>
            ))}
          </div>
          {typeF !== 'episodes' && allGenres.length > 0 && (
            <select value={genreF} onChange={(e) => setGenreF(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All genres</option>
              {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
        </div>
      )}

      {loading ? <Spinner /> : typeF === 'episodes' ? (
        epLoading ? <Spinner label="Loading episode history…" /> :
        epView.length === 0 ? (
          <Empty icon="📺">No episodes ticked off yet. Open a show and mark episodes from its <strong>Episodes</strong> list.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {epView.map((e) => {
              const t = e.titles
              return (
                <div key={e.id} className="card row" style={{ alignItems: 'center', gap: 12 }}>
                  <TitleLink className="tile" tmdbId={t?.tmdb_id} media="tv" style={{ width: 46, flexShrink: 0 }}>
                    <Poster title={t?.title} mediaType="tv" posterPath={t?.poster_path} />
                  </TitleLink>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{t?.title} <span className="faint">S{e.season_number}·E{e.episode_number}</span>{e.rewatch_count > 0 && <span className="rewatch-badge" style={{ marginLeft: 6 }}>↻ ×{e.rewatch_count + 1}</span>}</strong>
                    <div className="faint" style={{ marginTop: 3 }}>
                      {e.watched_on ? fmtDate(e.watched_on) : 'Date not set'}
                      {e.groups && <> · <span style={{ color: e.groups.color }}>{e.groups.name}</span></>}
                    </div>
                  </div>
                  {e.rating != null && <span className="ep2-rt" style={{ flexShrink: 0 }}>★ {e.rating}</span>}
                </div>
              )
            })}
            {epAll.length > epView.length && (
              <button className="btn block" onClick={() => setEpShown((n) => n + EP_PAGE)}>
                Show more ({epView.length} of {epAll.length})
              </button>
            )}
          </div>
        )
      ) : entries.length === 0 ? (
        <Empty>No watches logged yet. Mark something watched from <strong>Discover</strong> or your <strong>Watchlist</strong>.</Empty>
      ) : view.length === 0 ? (
        <Empty icon="🔎">No {typeF === 'tv' ? 'TV shows' : 'movies'} in this view.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {view.map((e) => {
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
                    <strong style={{ fontSize: 16 }}>
                      {t?.title} <span className="faint">{t?.year || ''}</span>
                      {(e.is_rewatch || e.rewatch_count > 0) && <span className="rewatch-badge">↻ {e.rewatch_count > 0 ? `×${e.rewatch_count + 1}` : 'Rewatch'}</span>}
                    </strong>
                    <button className="btn sm" onClick={() => setEditing(e)}>Edit</button>
                  </div>
                  <div className="faint" style={{ margin: '4px 0 8px' }}>
                    {formatWatched(e.watched_on, e.date_precision)}
                    {e.groups && <> · <span style={{ color: e.groups.color }}>{e.groups.name}</span></>}
                    {t?.media_type === 'tv' && e.episodes_watched > 0 && (
                      <> · {e.episodes_watched}{t.total_episodes ? `/${t.total_episodes}` : ''} eps</>
                    )}
                    {e.service && <> · 📺 {e.service}</>}
                    {e.where_watched && <> · {e.where_watched}</>}
                  </div>
                  {e.note && <p className="muted" style={{ margin: '8px 0 0', fontSize: 14 }}>“{e.note}”</p>}
                  {(e.tags || []).length > 0 && (
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {/* Not clickable any more: tag filtering went with the tag editor. */}
                      {e.tags.map((tg) => (
                        <span key={tg} className="chip">#{tg}</span>
                      ))}
                    </div>
                  )}
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
  const [whereWatched, setWhereWatched] = useState(entry.where_watched || '')
  const [service, setService] = useState(entry.service || '')
  const [tags, setTags] = useState(entry.tags || [])
  const [isRewatch, setIsRewatch] = useState(!!entry.is_rewatch)
  const [busy, setBusy] = useState(false)
  const isTv = t?.media_type === 'tv'

  async function save() {
    setBusy(true)
    try {
      await updateWatch(entry.id, {
        note: note || null,
        episodes_watched: isTv ? Number(episodes) || 0 : 0,
        where_watched: whereWatched || null,
        service: service.trim() || null,
        tags,
        is_rewatch: isRewatch,
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
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Where?</label>
          <select value={whereWatched} onChange={(e) => setWhereWatched(e.target.value)}>
            <option value="">None</option>
            {['Cinema / Theatre', 'TV', 'Laptop', 'Computer', 'Mobile', 'Tablet', 'Projector', 'Other'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Service</label>
          <input list="service-list-edit" value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Netflix" />
          <datalist id="service-list-edit">
            {['Netflix', 'OSN', 'Prime Video', 'Disney+', 'Apple TV+', 'Shahid', 'StarzPlay', 'Max', 'Hulu', 'YouTube', 'Cinema', 'Other'].map((o) => <option key={o} value={o} />)}
          </datalist>
        </div>
      </div>
      {/* Notes and tags retired: see reelbook/ARCHIVED.md. Existing ones still
          show on the entry and are still saved back unchanged. */}
      <div className="field">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 18, height: 18 }} checked={isRewatch} onChange={(e) => setIsRewatch(e.target.checked)} />
          <span>This is a rewatch</span>
        </label>
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

