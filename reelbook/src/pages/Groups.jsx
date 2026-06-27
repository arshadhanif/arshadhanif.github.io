import { useState } from 'react'
import { createGroup, deleteGroup, updateProfile } from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { Spinner, Empty, initials } from '../components/ui'

const COLORS = ['#5b9aff', '#ff6b9d', '#e0a23c', '#4ecb71', '#b46bff', '#ff8c42', '#42d4d4']

export default function Groups() {
  const { groups, profiles, loading, reload } = useAppData()
  const { user, profile, refreshProfile } = useAuth()

  return (
    <div className="page">
      <h1>Groups &amp; profile</h1>

      <ProfileEditor profile={profile} userId={user.id} onSaved={async () => { await refreshProfile(); reload() }} />

      <h2 style={{ fontSize: 18 }}>Your groups</h2>
      <p className="faint" style={{ marginTop: 0 }}>
        A group is <em>who watched</em>: e.g. “Arshad &amp; Muneeza”, “Just Arshad”, “Family”. Members can include
        people without a login (just a name).
      </p>

      {loading ? <Spinner /> : groups.length === 0 ? (
        <Empty>No groups yet. Create your first below.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {groups.map((g) => (
            <div key={g.id} className="card spread">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="dot" style={{ width: 12, height: 12, borderRadius: '50%', background: g.color }} />
                  <strong>{g.name}</strong>
                </div>
                <div className="faint" style={{ marginTop: 4 }}>
                  {memberLabel(g, profiles)}
                </div>
              </div>
              {g.owner_id === user.id && (
                <button className="btn sm danger" onClick={async () => {
                  if (confirm(`Delete group “${g.name}”? Its watches/watchlist will lose their group tag.`)) {
                    await deleteGroup(g.id); reload()
                  }
                }}>Delete</button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateGroup userId={user.id} onCreated={reload} />
    </div>
  )
}

function memberLabel(g, profiles) {
  const names = (g.group_members || []).map((m) => {
    if (m.member_name) return m.member_name
    const p = profiles.find((x) => x.id === m.profile_id)
    return p?.name || 'member'
  })
  return names.length ? names.join(', ') : 'No members listed'
}

function ProfileEditor({ profile, userId, onSaved }) {
  const [name, setName] = useState(profile?.name || '')
  const [color, setColor] = useState(profile?.color || COLORS[0])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setBusy(true); setSaved(false)
    try {
      await updateProfile(userId, { name: name.trim() || 'Me', color })
      setSaved(true); onSaved?.()
      setTimeout(() => setSaved(false), 1500)
    } finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        <div className="avatar" style={{ background: color, width: 44, height: 44, fontSize: 16 }}>
          {initials(name || '?')}
        </div>
        <strong>Your profile</strong>
      </div>
      <div className="field">
        <label>Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arshad" />
      </div>
      <div className="field">
        <label>Your colour (used on ratings)</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <button className="btn primary" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : saved ? '✓ Saved' : 'Save profile'}
      </button>
    </div>
  )
}

function CreateGroup({ userId, onCreated }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[2])
  const [members, setMembers] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function create() {
    if (!name.trim()) return
    setBusy(true); setErr(null)
    try {
      await createGroup({
        name: name.trim(), color, ownerId: userId,
        memberNames: members.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setName(''); setMembers('')
      onCreated()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <strong>Create a group</strong>
      {err && <div className="banner error" style={{ marginTop: 10 }}>{err}</div>}
      <div className="field" style={{ marginTop: 12 }}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arshad & Muneeza" />
      </div>
      <div className="field">
        <label>Colour</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="field">
        <label>Members without a login (comma-separated, optional)</label>
        <input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="e.g. Mum, Dad, College crew" />
      </div>
      <button className="btn primary" disabled={busy || !name.trim()} onClick={create}>
        {busy ? 'Creating…' : 'Create group'}
      </button>
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      {COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)}
          style={{
            width: 28, height: 28, borderRadius: '50%', background: c,
            border: value === c ? '3px solid var(--text)' : '3px solid transparent',
          }} aria-label={c} />
      ))}
    </div>
  )
}
