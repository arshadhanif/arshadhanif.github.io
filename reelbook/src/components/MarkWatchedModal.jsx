import { useState } from 'react'
import { Modal, StarRating, TagInput, Combobox } from './ui'
import { markWatched, markNextEpisodes } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { getPref } from '../lib/prefs'
import { todayLocal } from '../lib/dates'

import { WHERE_OPTIONS, SERVICE_OPTIONS, lastWatchContext, rememberWatchContext } from '../lib/watchContext'

// item: { seed?, titleId?, title, media_type, total_episodes? }
export default function MarkWatchedModal({ item, groups, profiles, onClose, onSaved }) {
  const { user } = useAuth()
  const today = todayLocal()
  const prefGroup = getPref('defaultGroupId', '')
  const initialGroup = (prefGroup && groups.some((g) => g.id === prefGroup)) ? prefGroup : (groups[0]?.id || null)
  const [groupId, setGroupId] = useState(initialGroup)
  const [dateMode, setDateMode] = useState('today') // today | pick | unknown
  const [precision, setPrecision] = useState('day') // day | month | year
  const [watchedOn, setWatchedOn] = useState(today)
  const [monthVal, setMonthVal] = useState(today.slice(0, 7))
  const [yearVal, setYearVal] = useState(today.slice(0, 4))
  const [note, setNote] = useState('')
  const [tags, setTags] = useState([])
  const [isRewatch, setIsRewatch] = useState(!!item.rewatchSuggested)
  const [episodes, setEpisodes] = useState(0)
  const [ratings, setRatings] = useState({}) // {profileId: score}
  const [visibility, setVisibility] = useState('private')
  // Default to whatever you picked last, rather than making you re-pick it on
  // every single log.
  const lastCtx = lastWatchContext()
  const [whereWatched, setWhereWatched] = useState(lastCtx.whereWatched)
  const [service, setService] = useState(lastCtx.service)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const isTv = item.media_type === 'tv'

  function resolveDate() {
    if (dateMode === 'today') return { watchedOn: today, datePrecision: 'day' }
    if (dateMode === 'unknown') return { noDate: true }
    if (precision === 'year') return { watchedOn: `${yearVal}-01-01`, datePrecision: 'year' }
    if (precision === 'month') return { watchedOn: `${monthVal}-01`, datePrecision: 'month' }
    return { watchedOn, datePrecision: 'day' }
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const d = resolveDate()
      // A show can't have more episodes watched than it has aired, so clamp:
      // the "(of N)" label is a limit, not a hint.
      const cap = Number(item.total_episodes) || 0
      let epCount = isTv ? Math.max(0, Math.floor(Number(episodes) || 0)) : 0
      if (cap > 0) epCount = Math.min(epCount, cap)
      const where = whereWatched || null
      const svc = service.trim() || null
      rememberWatchContext({ whereWatched: where, service: svc })
      await markWatched({
        seed: item.seed,
        titleId: item.titleId,
        groupId,
        ...d,
        note,
        episodesWatched: epCount,
        createdBy: user.id,
        ratings,
        visibility,
        whereWatched: where,
        service: svc,
        tags,
        isRewatch,
      })
      // Logging N episodes must actually mark them, otherwise progress,
      // Continue watching and the Completed state never move. Needs a resolved
      // titleId: markWatched returns the WATCH id, not the title id.
      if (isTv && epCount > 0 && item.titleId) {
        await markNextEpisodes({
          titleId: item.titleId,
          tmdbId: item.tmdb_id || item.seed?.tmdb_id || null,
          groupId,
          count: epCount,
          watchedOn: d.noDate ? null : d.watchedOn,
          createdBy: user.id,
          // The episodes carry the same where/service as the diary row, so a
          // TV log is counted on the right platform episode by episode.
          whereWatched: where,
          service: svc,
        }).catch(() => {})
      }
      onSaved?.(groupId)
      onClose()
    } catch (e) {
      setErr(e.message || 'Could not save')
      setSaving(false)
    }
  }

  return (
    <Modal title={`Mark watched · ${item.title}`} onClose={onClose}>
      {err && <div className="banner error">{err}</div>}

      <div className="field">
        <label>Who watched it? (group)</label>
        <select value={groupId || ''} onChange={(e) => setGroupId(e.target.value || null)}>
          {groups.length === 0 && <option value="">Create a group first</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>When?</label>
        <div className="seg" style={{ marginBottom: 10 }}>
          {[['today', 'Today'], ['pick', 'Pick a date'], ['unknown', "Don't remember"]].map(([v, l]) => (
            <button key={v} type="button" className={dateMode === v ? 'on' : ''} onClick={() => setDateMode(v)}>{l}</button>
          ))}
        </div>
        {dateMode === 'pick' && (
          <>
            <div className="seg" style={{ marginBottom: 10 }}>
              {[['day', 'Exact day'], ['month', 'Month only'], ['year', 'Year only']].map(([v, l]) => (
                <button key={v} type="button" className={precision === v ? 'on' : ''} onClick={() => setPrecision(v)}>{l}</button>
              ))}
            </div>
            {precision === 'day' && (
              <input type="date" value={watchedOn} max={today} onChange={(e) => setWatchedOn(e.target.value)} />
            )}
            {precision === 'month' && (
              <input type="month" value={monthVal} max={today.slice(0, 7)} onChange={(e) => setMonthVal(e.target.value)} />
            )}
            {precision === 'year' && (
              <input type="number" min="1900" max={today.slice(0, 4)} value={yearVal} onChange={(e) => setYearVal(e.target.value)} placeholder="e.g. 2019" />
            )}
          </>
        )}
      </div>

      {isTv && (
        <div className="field">
          <label>Episodes watched{item.total_episodes ? ` (of ${item.total_episodes})` : ''}</label>
          <input type="number" min="0" max={item.total_episodes || undefined} value={episodes}
            onChange={(e) => setEpisodes(e.target.value)} />
        </div>
      )}

      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Where?</label>
          <select value={whereWatched} onChange={(e) => setWhereWatched(e.target.value)}>
            <option value="">None</option>
            {WHERE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Streaming service</label>
          <Combobox value={service} onChange={setService} options={SERVICE_OPTIONS} placeholder="e.g. Netflix" />
        </div>
      </div>

      <div className="field">
        <label>Ratings (out of 10)</label>
        {profiles.map((p) => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <div className="faint" style={{ marginBottom: 2, color: p.color, fontWeight: 700 }}>{p.name}</div>
            <StarRating
              value={ratings[p.id] || 0}
              color={p.color}
              onChange={(score) => setRatings((r) => ({ ...r, [p.id]: score }))}
            />
          </div>
        ))}
        {profiles.length === 0 && <div className="faint">No profiles yet.</div>}
      </div>

      <div className="field">
        <label>Review / notes (optional)</label>
        <textarea rows="4" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you think?" />
      </div>

      <div className="field">
        <label>Tags (optional)</label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div className="field">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 18, height: 18 }} checked={isRewatch} onChange={(e) => setIsRewatch(e.target.checked)} />
          <span>This is a rewatch</span>
        </label>
      </div>

      <div className="field">
        <label>Visibility</label>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="private">Private (just your household)</option>
          <option value="friends">Friends (visible to your friends)</option>
          <option value="public">Public (any ReelBook user)</option>
        </select>
      </div>

      <button className="btn primary block" disabled={saving || !groupId} onClick={save}>
        {saving ? 'Saving…' : 'Save to diary'}
      </button>
    </Modal>
  )
}
