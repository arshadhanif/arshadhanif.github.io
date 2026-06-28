import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateProfile } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppData'
import { useToast } from '../context/Toast'
import { getPref, setPref, REGIONS, regionName, DEFAULT_REGION } from '../lib/prefs'
import { isPushSupported, getPushState, enablePush, disablePush, sendTestPush } from '../lib/push'
import { downloadJsonBackup, downloadDiaryCsv, downloadEpisodesCsv } from '../lib/backup'
import { listFavorites, getMyShare, setShareEnabled } from '../lib/db'
import { FavoritesEditor, FavoritesStrip } from '../components/Favorites'
import { initials } from '../components/ui'

const COLORS = ['#5b9aff', '#ff6b9d', '#e8a838', '#4ecb71', '#b46bff', '#ff8c42', '#42d4d4']

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { groups, profiles, reload } = useAppData()
  const toast = useToast()
  const others = (profiles || []).filter((p) => p.id !== user?.id)
  const [othersFavs, setOthersFavs] = useState({})
  useEffect(() => {
    others.forEach((p) => { if (!(p.id in othersFavs)) listFavorites(p.id).then((f) => setOthersFavs((m) => ({ ...m, [p.id]: f }))).catch(() => {}) })
  }, [profiles])

  const [name, setName] = useState(profile?.name || '')
  const [color, setColor] = useState(profile?.color || COLORS[0])
  const [savingP, setSavingP] = useState(false)
  const [region, setRegion] = useState(getPref('region', DEFAULT_REGION))
  const [defaultGroup, setDefaultGroup] = useState(getPref('defaultGroupId', '') || '')
  const [push, setPush] = useState('off')   // unsupported | denied | on | off
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => { getPushState().then(setPush).catch(() => {}) }, [])

  async function togglePush() {
    setPushBusy(true)
    try {
      if (push === 'on') { await disablePush(); setPush('off'); toast('Push notifications turned off') }
      else { const st = await enablePush(); setPush(st); toast('Push notifications on. Try “Send a test”') }
    } catch (e) { toast(e.message || 'Could not change push setting', 'err') }
    finally { setPushBusy(false) }
  }
  async function testPush() {
    setPushBusy(true)
    try {
      const r = await sendTestPush()
      toast(r?.sent ? 'Test sent. Check your notifications' : 'No devices registered yet', r?.sent ? 'ok' : 'err')
    } catch (e) { toast(e.message || 'Could not send test', 'err') }
    finally { setPushBusy(false) }
  }

  const [share, setShare] = useState(null)   // { token, enabled } | null
  const [shareBusy, setShareBusy] = useState(false)
  useEffect(() => { if (user) getMyShare(user.id).then(setShare).catch(() => {}) }, [user])
  const shareUrl = share?.token ? `${location.origin}/p/${share.token}` : ''

  async function toggleShare() {
    setShareBusy(true)
    try {
      const token = share?.token || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : String(Math.random()).slice(2, 18))
      const enabled = !share?.enabled
      await setShareEnabled({ profileId: user.id, enabled, token })
      setShare({ token, enabled })
      toast(enabled ? 'Public profile is on' : 'Public profile turned off')
    } catch (e) { toast(e.message || 'Could not update', 'err') } finally { setShareBusy(false) }
  }
  async function copyShare() {
    try { await navigator.clipboard.writeText(shareUrl); toast('Link copied') } catch { toast('Could not copy', 'err') }
  }

  const [exporting, setExporting] = useState('')
  async function runExport(kind, fn) {
    setExporting(kind)
    try {
      const n = await fn()
      const count = n && typeof n === 'object' ? Object.values(n).reduce((a, b) => a + b, 0) : n
      toast(`Downloaded ${count} records`)
    } catch (e) { toast(e.message || 'Export failed', 'err') }
    finally { setExporting('') }
  }

  async function saveProfile() {
    setSavingP(true)
    try {
      await updateProfile(user.id, { name: name.trim() || 'Me', color })
      await refreshProfile(); reload()
      toast('Profile saved')
    } catch (e) { toast(e.message || 'Could not save', 'err') }
    finally { setSavingP(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 620 }}>
      <h1>Settings</h1>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="avatar" style={{ background: color, width: 46, height: 46, fontSize: 17 }}>{initials(name || '?')}</div>
          <strong>Your profile</strong>
        </div>
        <div className="field">
          <label>Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Your colour (used on ratings)</label>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text)' : '3px solid transparent' }} />
            ))}
          </div>
        </div>
        <button className="btn primary" disabled={savingP} onClick={saveProfile}>{savingP ? 'Saving…' : 'Save profile'}</button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Your favourites</strong>
        <p className="faint" style={{ margin: '8px 0 14px' }}>Pick up to four all-time favourites to show on your profile.</p>
        <FavoritesEditor profileId={user.id} />
        {others.map((p) => (othersFavs[p.id]?.length > 0 && (
          <div key={p.id} style={{ marginTop: 16 }}>
            <div className="faint" style={{ marginBottom: 8, color: p.color, fontWeight: 700 }}>{p.name}’s favourites</div>
            <FavoritesStrip favorites={othersFavs[p.id]} />
          </div>
        )))}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Public profile</strong>
        <p className="faint" style={{ margin: '8px 0 14px' }}>
          Share a read-only page with your favourites, top-rated titles and rating stats.
          Anyone with the link can view it; no private notes, diary or friends are shown.
        </p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={`btn ${share?.enabled ? '' : 'primary'}`} disabled={shareBusy} onClick={toggleShare}>
            {share?.enabled ? 'Turn off sharing' : '🔗 Create share link'}
          </button>
          {share?.enabled && <a className="btn" href={shareUrl} target="_blank" rel="noreferrer">Preview</a>}
        </div>
        {share?.enabled && (
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{ flex: 1 }} />
            <button className="btn" onClick={copyShare}>Copy</button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Preferences</strong>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Default “Where to watch” region</label>
          <select value={region} onChange={(e) => { setRegion(e.target.value); setPref('region', e.target.value); toast('Region updated') }}>
            {REGIONS.map((r) => <option key={r} value={r}>{regionName(r)}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Default group when logging a watch</label>
          <select value={defaultGroup} onChange={(e) => { setDefaultGroup(e.target.value); setPref('defaultGroupId', e.target.value); toast('Default group set') }}>
            <option value="">None (pick each time)</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Push notifications</strong>
        <p className="faint" style={{ margin: '8px 0 14px' }}>
          Get a notification on this device when a new episode airs for a show you’re tracking, even
          when ReelBook is closed. Read-state stays in sync across your devices.
        </p>
        {push === 'unsupported' ? (
          <div className="muted">This browser doesn’t support push notifications. On iPhone, add ReelBook to your Home Screen first.</div>
        ) : push === 'denied' ? (
          <div className="muted">Notifications are blocked in your browser settings. Re-enable them for this site, then reload.</div>
        ) : (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className={`btn ${push === 'on' ? '' : 'primary'}`} disabled={pushBusy} onClick={togglePush}>
              {push === 'on' ? '🔕 Turn off on this device' : '🔔 Turn on for this device'}
            </button>
            {push === 'on' && <button className="btn" disabled={pushBusy} onClick={testPush}>Send a test</button>}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Your data</strong>
        <p className="faint" style={{ margin: '8px 0 14px' }}>
          Download a copy of everything you’ve logged. The JSON file is a complete backup;
          the CSV files open in any spreadsheet.
        </p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={!!exporting} onClick={() => runExport('json', downloadJsonBackup)}>
            {exporting === 'json' ? 'Preparing…' : '⬇️ Full backup (JSON)'}
          </button>
          <button className="btn" disabled={!!exporting} onClick={() => runExport('diary', downloadDiaryCsv)}>
            {exporting === 'diary' ? 'Preparing…' : 'Diary (CSV)'}
          </button>
          <button className="btn" disabled={!!exporting} onClick={() => runExport('eps', downloadEpisodesCsv)}>
            {exporting === 'eps' ? 'Preparing…' : 'Episodes (CSV)'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <strong>Account</strong>
        <div className="muted" style={{ margin: '10px 0' }}>{user?.email}</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn" to="/groups">👥 Groups</Link>
          <Link className="btn" to="/import">⬆️ Import history</Link>
          <Link className="btn" to="/about">ℹ️ About</Link>
          <button className="btn danger" onClick={signOut}>⏻ Sign out</button>
        </div>
      </div>

      <p className="faint" style={{ textAlign: 'center' }}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  )
}
