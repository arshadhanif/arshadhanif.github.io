import { useState } from 'react'
import { findByImdbId, findByTitle, findByTvdbId } from '../lib/tmdb'
import { ensureTitle, markWatched, addToWatchlist, markEpisodesBulk } from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { Empty } from '../components/ui'

// Identify which TV Time export file this is, from its header row.
function detectTvType(headers) {
  const h = headers.map((x) => x.toLowerCase())
  if (h.includes('season') && h.includes('episode') && h.includes('series_tvdb_id')) return 'episodes'
  if (h.includes('is_watched') && h.includes('year') && !h.includes('season')) return 'movies'
  if (h.includes('status') && h.includes('tvdb_id') && h.includes('title')) return 'series'
  if (h.includes('list_name') && h.includes('item_type')) return 'lists'
  return 'unknown'
}

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
    label: 'TV Time', icon: '📺', target: 'diary', needsPerson: false, multi: true,
    help: 'Upload your TV Time CSV export files together (movies, series-episodes, series). Watched movies & shows go to the diary, your per-episode history powers episode tracking, and not-started shows go to your watchlist — all for the chosen group.',
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
  const [tvFiles, setTvFiles] = useState([])

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
    setMode(m); setItems([]); setFilename(''); setStatus(null); setTvFiles([])
    setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
  }

  function onTvFiles(e) {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    setStatus(null); setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
    Promise.all(files.map((f) => new Promise((res) => {
      const r = new FileReader()
      r.onload = () => {
        const rows = parseCSV(r.result)
        res({ name: f.name, type: detectTvType(rows[0] || []), objs: rowsToObjects(rows) })
      }
      r.readAsText(f)
    }))).then(setTvFiles)
  }

  async function runTvTime() {
    if (!groupId) { setStatus({ type: 'error', text: 'Pick a group first.' }); return }
    const truthy = (v) => String(v).toLowerCase() === 'true'
    const ep = tvFiles.find((f) => f.type === 'episodes')
    const seriesRows = (tvFiles.find((f) => f.type === 'series')?.objs) || []
    const movieRows = (tvFiles.find((f) => f.type === 'movies')?.objs) || []

    const epBySeries = {}
    for (const r of (ep?.objs || [])) { (epBySeries[r.series_tvdb_id] ||= []).push(r) }
    const epIds = Object.keys(epBySeries)
    const total = epIds.length + seriesRows.length + movieRows.length
    if (!total) { setStatus({ type: 'error', text: 'No recognised TV Time files.' }); return }

    setRunning(true)
    setProgress({ done: 0, total, ok: 0, skipped: 0 })
    let done = 0, ok = 0, skipped = 0
    const bump = (good) => { done++; good ? ok++ : skipped++; setProgress({ done, total, ok, skipped }) }
    const handled = new Set()

    // 1) per-episode history → episode tracking + a diary entry per show
    for (const tvdbId of epIds) {
      const rows = epBySeries[tvdbId]
      try {
        const watched = rows.filter((r) => truthy(r.is_watched) && !truthy(r.special))
          .map((r) => ({ season: Number(r.season), episode: Number(r.episode), watchedOn: normDate(r.watched_at) }))
          .filter((e) => Number.isFinite(e.season) && Number.isFinite(e.episode))
        // No watched episodes here — leave it for the series pass (watchlist / following).
        if (!watched.length) { bump(true); continue }
        let seed = await findByTvdbId(tvdbId)
        if (!seed) seed = await findByTitle(rows[0]?.title, null, 'tv')
        if (!seed) { bump(false); continue }
        const titleId = await ensureTitle(seed)
        await markEpisodesBulk({ titleId, groupId, episodes: watched, createdBy: user.id })
        const dates = watched.map((e) => e.watchedOn).filter(Boolean).sort()
        const last = dates[dates.length - 1]
        await markWatched({ titleId, groupId, watchedOn: last || undefined, noDate: !last, datePrecision: 'day', episodesWatched: watched.length, createdBy: user.id, visibility: 'private' })
        handled.add(String(tvdbId))
        bump(true)
      } catch (e) { console.warn('tvtime episodes', tvdbId, e); bump(false) }
    }

    // 2) followed series: not-started → watchlist (skip ones already handled by episodes)
    for (const r of seriesRows) {
      try {
        if (handled.has(String(r.tvdb_id))) { bump(true); continue }
        let seed = await findByTvdbId(r.tvdb_id)
        if (!seed && r.imdb_id) seed = await findByImdbId(r.imdb_id)
        if (!seed) seed = await findByTitle(r.title, null, 'tv')
        if (!seed) { bump(false); continue }
        const titleId = await ensureTitle(seed)
        if ((r.status || '').toLowerCase() === 'not_started_yet') await addToWatchlist({ titleId, groupId, addedBy: user.id })
        else await markWatched({ titleId, groupId, noDate: true, createdBy: user.id, visibility: 'private' })
        bump(true)
      } catch (e) { console.warn('tvtime series', r, e); bump(false) }
    }

    // 3) movies: watched → diary; not watched → watchlist
    for (const r of movieRows) {
      try {
        let seed = r.imdb_id ? await findByImdbId(r.imdb_id) : null
        if (!seed) seed = await findByTitle(r.title, r.year, 'movie')
        if (!seed) { bump(false); continue }
        const titleId = await ensureTitle(seed)
        if (truthy(r.is_watched)) {
          const wd = normDate(r.watched_at) || normDate(r.created_at)
          await markWatched({ titleId, groupId, watchedOn: wd || undefined, noDate: !wd, datePrecision: 'day', createdBy: user.id, visibility: 'private' })
        } else {
          await addToWatchlist({ titleId, groupId, addedBy: user.id })
        }
        bump(true)
      } catch (e) { console.warn('tvtime movie', r, e); bump(false) }
    }

    setRunning(false)
    setStatus({ type: 'ok', text: `Done — ${ok} processed, ${skipped} skipped.` })
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
          <label>{cfg.multi ? 'TV Time CSV files (pick all of them at once)' : 'File (.csv or .json)'}</label>
          {cfg.multi
            ? <input type="file" accept=".csv" multiple onChange={onTvFiles} />
            : <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} />}
        </div>
      </div>

      {status && <div className={`banner ${status.type === 'error' ? 'error' : ''}`}>{status.text}</div>}

      {cfg.multi && (
        <>
          {tvFiles.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <strong>Detected files</strong>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tvFiles.map((f, i) => (
                  <div key={i} className="spread">
                    <span>{f.name}</span>
                    <span className="faint">{f.type === 'unknown' ? '⚠ unrecognised' : `${f.type} · ${f.objs.length}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(running || progress.done > 0) && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="spread"><span>{running ? 'Importing…' : 'Finished'}</span><span className="faint">{progress.done}/{progress.total}</span></div>
              <div style={{ height: 8, background: 'var(--bg-elev-2)', borderRadius: 999, overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
              <span className="faint">✓ {progress.ok} done · ⤫ {progress.skipped} skipped</span>
            </div>
          )}
          {tvFiles.some((f) => f.type !== 'unknown') ? (
            <button className="btn primary block" disabled={running || !groupId} onClick={runTvTime}>
              {running ? 'Importing…' : 'Import TV Time export'}
            </button>
          ) : tvFiles.length === 0 && !status ? (
            <Empty icon="📺">Select your TV Time CSV files above — you can choose several at once (movies, series-episodes, series).</Empty>
          ) : null}
        </>
      )}

      {!cfg.multi && items.length > 0 && (
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

      {!cfg.multi && items.length === 0 && !status && (
        <Empty>Choose a file above to preview and import your history.</Empty>
      )}
    </div>
  )
}
