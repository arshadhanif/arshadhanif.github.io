import { useState } from 'react'
import { Modal, StarRating } from './ui'
import { markWatched } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { getPref } from '../lib/prefs'

// item: { seed?, titleId?, title, media_type, total_episodes? }
export default function MarkWatchedModal({ item, groups, profiles, onClose, onSaved }) {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  const prefGroup = getPref('defaultGroupId', '')
  const initialGroup = (prefGroup && groups.some((g) => g.id === prefGroup)) ? prefGroup : (groups[0]?.id || null)
  const [groupId, setGroupId] = useState(initialGroup)
  const [watchedOn, setWatchedOn] = useState(today)
  const [note, setNote] = useState('')
  const [episodes, setEpisodes] = useState(0)
  const [ratings, setRatings] = useState({}) // {profileId: score}
  const [visibility, setVisibility] = useState('private')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const isTv = item.media_type === 'tv'

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await markWatched({
        seed: item.seed,
        titleId: item.titleId,
        groupId,
        watchedOn,
        note,
        episodesWatched: isTv ? Number(episodes) || 0 : 0,
        createdBy: user.id,
        ratings,
        visibility,
      })
      onSaved?.()
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
          {groups.length === 0 && <option value="">— create a group first —</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Date watched</label>
        <input type="date" value={watchedOn} max={today} onChange={(e) => setWatchedOn(e.target.value)} />
      </div>

      {isTv && (
        <div className="field">
          <label>Episodes watched{item.total_episodes ? ` (of ${item.total_episodes})` : ''}</label>
          <input
            type="number" min="0" value={episodes}
            onChange={(e) => setEpisodes(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label>Ratings (out of 10)</label>
        {profiles.map((p) => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <div className="faint" style={{ marginBottom: 2, color: p.color, fontWeight: 700 }}>
              {p.name}
            </div>
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
        <label>Note (optional)</label>
        <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you think?" />
      </div>

      <div className="field">
        <label>Visibility</label>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="private">Private — just your household</option>
          <option value="friends">Friends — visible to your friends</option>
          <option value="public">Public — any ReelBook user</option>
        </select>
      </div>

      <button className="btn primary block" disabled={saving || !groupId} onClick={save}>
        {saving ? 'Saving…' : 'Save to diary'}
      </button>
    </Modal>
  )
}
