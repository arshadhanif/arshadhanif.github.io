import { useState } from 'react'
import { findByImdbId, findByTitle } from '../lib/tmdb'
import { ensureTitle, markWatched, addToWatchlist } from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { Empty } from '../components/ui'

const MODES = {
  imdb_ratings: {
    label: 'IMDb ratings', icon: '⭐', target: 'diary', needsPerson: true,
    help: 'IMDb → Your Ratings → ⋯ → Export. Each rated title becomes a diary watch with the chosen person’s score and the date you rated it.',
  },
  imdb_watchlist: {
    label: 'IMDb watchlist', icon: '🔖', target: 'watchlist', needsPerson: false,
    help: 'IMDb → Watchlist → ⋯ → Export. Titles are added to your “want to watch” list for the chosen group (no rating, not logged as watched).',
  },
  tvtime: {
    label: 'TV Time', icon: '📺', target: 'diary', needsPerson: true,
    help: 'TV Time export (CSV or JSON). Shows & movies are matched to TMDB and added as watches for the chosen group.',
  },
}

// Minimal CSV parser that handles quoted fields and commas inside quotes.
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = '' }
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

function rowsToObjects(rows) {
  if (!rows.length) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const o = {}
    headers.forEach((h, i) => { o[h] = (r[i] ?? '').trim() })
    return o
  })
}

const pick = (obj, names) => {
  for (const n of names) {
    const key = Object.keys(obj).find((k) => k.toLowerCase() === n.toLowerCase())
    if (key && obj[key]) return obj[key]
  }
  return ''
}

// Normalize an uploaded file into a list of {imdbId?, title, year?, mediaHint?, score?, date?}
function extractItems(filename, text) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.json')) {
    let json
    try { json = JSON.parse(text) } catch { return [] }
    // TV Time / generic JSON: accept an array, or an object with an array inside.
    const arr = Array.isArray(json) ? json
      : json.episodes || json.shows || json.movies || json.tracking || []
    return (Array.isArray(arr) ? arr : []).map((it) => ({
      title: it.show_name || it.series_name || it.title || it.name || '',
      year: it.year || it.release_year || null,
      mediaHint: (it.type || it.media_type || (it.show_name || it.series_name ? 'tv' : '')) || null,
      date: it.watched_at || it.last_watched_at || it.created_at || it.date || null,
      score: it.rating || null,
    })).filter((x) => x.title)
  }
  // CSV (IMDb export or TV Time CSV)
  const objs = rowsToObjects(parseCSV(text))
  return objs.map((o) => {
    const imdbId = pick(o, ['Const', 'imdb_id', 'imdb'])
    const typeRaw = pick(o, ['Title Type', 'type', 'media_type']).toLowerCase()
    const mediaHint = typeRaw.includes('tv') || typeRaw.includes('series') || typeRaw.includes('show')
      ? 'tv' : typeRaw.includes('movie') ? 'movie' : null
    return {
      imdbId: imdbId.startsWith('tt') ? imdbId : null,
      title: pick(o, ['Title', 'show_name', 'series_name', 'name', 'Original Title']),
      year: pick(o, ['Year', 'year', 'release_year']) || null,
      mediaHint,
      score: pick(o, ['Your Rating', 'rating', 'your_rating']) || null,
      date: pick(o, ['Date Rated', 'watched_at', 'last_watched', 'date', 'created_at']) || null,
    }
  }).filter((x) => x.imdbId || x.title)
}

function normDate(d) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt)) return null
  return dt.toISOString().slice(0, 10)
}

export default function Import() {
  const { groups, profiles } = useAppData()
  const { user } = useAuth()
  const [mode, setMode] = useState('imdb_ratings')
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [profileId, setProfileId] = useState(profiles[0]?.id || '')
  const [items, setItems] = useState([])
  const [filename, setFilename] = useState('')
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0, ok: 0, skipped: 0 })
  const [running, setRunning] = useState(false)

  const cfg = MODES[mode]

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    setStatus(null)
    setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = extractItems(file.name, reader.result)
      setItems(parsed)
      setStatus(parsed.length ? null : { type: 'error', text: 'Could not find any titles in that file.' })
    }
    reader.readAsText(file)
  }

  function pickMode(m) {
    setMode(m); setItems([]); setFilename(''); setStatus(null)
    setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
  }

  async function runImport() {
    if (!groupId) { setStatus({ type: 'error', text: 'Pick a group first.' }); return }
    setRunning(true)
    setProgress({ done: 0, total: items.length, ok: 0, skipped: 0 })
    let ok = 0, skipped = 0
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      try {
        let seed = null
        if (it.imdbId) seed = await findByImdbId(it.imdbId)
        if (!seed) seed = await findByTitle(it.title, it.year, it.mediaHint)
        if (!seed) { skipped++; setProgress((p) => ({ ...p, done: i + 1, skipped })); continue }

        const titleId = await ensureTitle(seed)
        if (cfg.target === 'watchlist') {
          await addToWatchlist({ titleId, groupId, addedBy: user.id })
        } else {
          const score = it.score ? Math.max(1, Math.min(10, Math.round(Number(it.score)))) : null
          const wd = normDate(it.date)
          await markWatched({
            titleId,
            groupId,
            watchedOn: wd || undefined,
            noDate: !wd,
            datePrecision: 'day',
            createdBy: user.id,
            ratings: score && profileId ? { [profileId]: score } : {},
          })
        }
        ok++
      } catch (e) {
        console.warn('import row failed', it, e)
        skipped++
      }
      setProgress((p) => ({ ...p, done: i + 1, ok, skipped }))
    }
    setRunning(false)
    const dest = cfg.target === 'watchlist' ? 'added to watchlist' : 'logged'
    setStatus({ type: 'ok', text: `Done — ${ok} ${dest}, ${skipped} skipped.` })
  }

  return (
    <div className="page">
      <h1>Import</h1>
      <p className="sub">Bring your history in from IMDb and TV Time. Pick what you’re importing:</p>

      <div className="scroll-x" style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap' }}>
        {Object.entries(MODES).map(([k, m]) => (
          <button key={k} className={`chip ${mode === k ? 'active' : ''}`}
            style={mode === k ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#0b0d12' } : undefined}
            onClick={() => pickMode(k)}>{m.icon} {m.label}</button>
        ))}
      </div>

      <div className="banner">{cfg.help}</div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>{cfg.target === 'watchlist' ? 'Add to watchlist for group' : 'Log into group'}</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.length === 0 && <option value="">— create a group first —</option>}
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {cfg.needsPerson && (
          <div className="field">
            <label>Ratings belong to</label>
            <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>File (.csv or .json)</label>
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} />
        </div>
      </div>

      {status && <div className={`banner ${status.type === 'error' ? 'error' : ''}`}>{status.text}</div>}

      {items.length > 0 && (
        <>
          <div className="spread" style={{ marginBottom: 12 }}>
            <strong>{filename}</strong>
            <span className="faint">{items.length} titles found</span>
          </div>

          {running || progress.done > 0 ? (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="spread">
                <span>{running ? 'Importing…' : 'Finished'}</span>
                <span className="faint">{progress.done}/{progress.total}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-elev-2)', borderRadius: 999, overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
              <span className="faint">✓ {progress.ok} imported · ⤫ {progress.skipped} skipped</span>
            </div>
          ) : null}

          <button className="btn primary block" disabled={running || !groupId} onClick={runImport}>
            {running ? 'Importing…' : cfg.target === 'watchlist'
              ? `Add ${items.length} to watchlist`
              : `Import ${items.length} as watched`}
          </button>

          <div style={{ marginTop: 16 }}>
            <div className="faint" style={{ marginBottom: 6 }}>Preview (first 15):</div>
            {items.slice(0, 15).map((it, i) => (
              <div key={i} className="spread" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{it.title || it.imdbId}</span>
                <span className="faint">
                  {it.year || ''} {it.mediaHint ? `· ${it.mediaHint}` : ''} {it.score ? `· ★${it.score}` : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {items.length === 0 && !status && (
        <Empty>Choose a file above to preview and import your history.</Empty>
      )}
    </div>
  )
}
