import { useEffect, useState } from 'react'
import { findByImdbId, findByTitle, findByTvdbId } from '../lib/tmdb'
import {
  ensureTitlesBulk, insertWatchesBulk, insertRatingsBulk, insertWatchlistBulk, markEpisodesBulk,
  createImportBatch, listImportBatches, revertImportBatch, dismissImportBatch, getGroupImportSnapshot,
  updateEpisodeRewatches, setRating, getExistingWatchKeys, restoreSeasonRatingsBulk,
  restoreFavouritesBulk, restoreSubscriptions, restoreCollections,
} from '../lib/db'
import { downloadJsonBackup, runCustomExport } from '../lib/backup'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Empty } from '../components/ui'
import { fmtDate } from '../lib/dates'

const newId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

// Run async fn over items with bounded concurrency; calls onTick after each.
async function pool(items, fn, concurrency, onTick) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      try { results[i] = await fn(items[i], i) } catch { results[i] = null }
      onTick && onTick()
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}
const keyOf = (s) => `${s.media_type}-${s.tmdb_id}`
const NOGROUP = '(no group)'   // placeholder for backup rows with no group, so they can be mapped or skipped

// TV Time omits IMDb ids on series rows, and TMDB has no TheTVDB cross-reference
// for some regional titles, so both auto-match paths (tvdb id, then title search)
// miss them. Map those TheTVDB ids to a known IMDb id that TMDB *can* resolve, so
// the show comes in with real metadata instead of being dropped as unmatched.
const TVDB_IMDB_FIXUPS = {
  '340760': 'tt1889883', // Khuda Aur Mohabbat (Pakistani drama, 2011)
}

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
    help: 'Upload your TV Time CSV export files together (movies, series-episodes, series). Watched movies & shows go to the diary, your per-episode history powers episode tracking, and not-started shows go to your watchlist. All for the chosen group.',
  },
  reelbook: {
    label: 'ReelBook backup', icon: '🗂️', target: 'diary', needsPerson: false, reelbook: true,
    help: 'Restore a ReelBook export (.json). Everything is matched by TMDB id (no lookups needed) and each item keeps its original group and dates. Pick which categories to bring back; anything already present is skipped, so re-running is safe.',
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
  const [skippedTitles, setSkippedTitles] = useState([])
  const [showSkipped, setShowSkipped] = useState(false)
  const [batches, setBatches] = useState([])
  const [reverting, setReverting] = useState(null)
  const [plan, setPlan] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [cats, setCats] = useState({ episodes: true, watched: true, watchlist: true, seasonRatings: true, collections: true, favourites: true, subscriptions: true })
  const [backup, setBackup] = useState(null)      // parsed ReelBook export
  const [groupMap, setGroupMap] = useState({})    // backup group name -> target group id
  const [exporting, setExporting] = useState(false)
  const [view, setView] = useState('import')   // 'import' | 'export'
  const toast = useToast()

  const cfg = MODES[mode]

  const loadBatches = () => listImportBatches().then(setBatches).catch(() => {})
  useEffect(() => { loadBatches() }, [])

  async function revertBatch(b) {
    const n = b.watches_count + b.episodes_count + b.watchlist_count
    if (!confirm(`Undo this import? This removes the ~${n} items it added (and their ratings). This cannot be undone.`)) return
    setReverting(b.id)
    try { await revertImportBatch(b.id); toast('Import reverted'); await loadBatches() }
    catch (e) { toast(e.message || 'Could not revert', 'err') }
    finally { setReverting(null) }
  }

  async function dismissBatch(b) {
    if (!confirm('Remove this import from the history list? Your watches, episodes and ratings stay. Only the history entry is removed.')) return
    setReverting(b.id)
    try { await dismissImportBatch(b.id); toast('Removed from history'); await loadBatches() }
    catch (e) { toast(e.message || 'Could not remove', 'err') }
    finally { setReverting(null) }
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    setStatus(null); setPlan(null)
    setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
    const reader = new FileReader()
    reader.onload = () => {
      if (cfg.reelbook) { loadBackup(reader.result); return }
      const parsed = extractItems(file.name, reader.result)
      setItems(parsed)
      setStatus(parsed.length ? null : { type: 'error', text: 'Could not find any titles in that file.' })
    }
    reader.readAsText(file)
  }

  // Parse a ReelBook export and auto-map its groups onto existing ones by name.
  function loadBackup(text) {
    let json
    try { json = JSON.parse(text) } catch { setStatus({ type: 'error', text: 'That is not a valid JSON file.' }); return }
    if (json?.app !== 'ReelBook') { setStatus({ type: 'error', text: 'That does not look like a ReelBook backup.' }); return }
    setBackup(json)
    const names = new Set()
    const add = (n) => names.add(n || NOGROUP)   // rows with no group get a mappable placeholder
    for (const d of json.diary || []) add(d.groups?.name ?? d.group)
    for (const e of json.episodes || []) add(e.groups?.name ?? e.group)
    for (const w of json.watchlist || []) add(w.groups?.name ?? w.group)
    for (const r of json.season_ratings || []) add(r.group_name)
    const map = {}
    for (const n of names) {
      if (n === NOGROUP) { map[n] = ''; continue }   // must be consciously targeted
      const hit = groups.find((g) => g.name.toLowerCase() === n.toLowerCase())
      map[n] = hit ? hit.id : ''   // no name match -> Skip, never silently the first group
    }
    setGroupMap(map)
  }

  async function runBackupExport() {
    setExporting(true)
    try { const c = await downloadJsonBackup(); toast(`Exported ${c.diary} watches, ${c.episodes} episodes, ${c.watchlist} watchlist`) }
    catch (e) { toast(e.message || 'Export failed', 'err') }
    finally { setExporting(false) }
  }

  function pickMode(m) {
    setMode(m); setItems([]); setFilename(''); setStatus(null); setTvFiles([]); setSkippedTitles([]); setPlan(null)
    setBackup(null); setGroupMap({})
    setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
  }

  function onTvFiles(e) {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    setStatus(null); setPlan(null); setProgress({ done: 0, total: 0, ok: 0, skipped: 0 })
    Promise.all(files.map((f) => new Promise((res) => {
      const r = new FileReader()
      r.onload = () => {
        const rows = parseCSV(r.result)
        res({ name: f.name, type: detectTvType(rows[0] || []), objs: rowsToObjects(rows) })
      }
      r.readAsText(f)
    }))).then(setTvFiles)
  }

  // Analyze the TV Time files: match TMDB, then diff against what the group
  // already has, producing an incremental plan (only new rows) + a breakdown.
  async function analyzeTvTime() {
    if (!groupId) { setStatus({ type: 'error', text: 'Pick a group first.' }); return }
    const truthy = (v) => String(v).toLowerCase() === 'true'
    const ep = tvFiles.find((f) => f.type === 'episodes')
    const seriesRows = (tvFiles.find((f) => f.type === 'series')?.objs) || []
    const movieRows = (tvFiles.find((f) => f.type === 'movies')?.objs) || []

    const epBySeries = {}
    for (const r of (ep?.objs || [])) (epBySeries[r.series_tvdb_id] ||= []).push(r)
    const epSeries = Object.entries(epBySeries).map(([tvdb, rows]) => {
      const watched = rows.filter((r) => truthy(r.is_watched) && !truthy(r.special))
        .map((r) => ({ season: Number(r.season), episode: Number(r.episode), watchedOn: normDate(r.watched_at), rewatchCount: Number(r.rewatch_count) || 0 }))
        .filter((e) => Number.isFinite(e.season) && Number.isFinite(e.episode))
      return { tvdb, title: rows[0]?.title, watched }
    }).filter((s) => s.watched.length)
    const handled = new Set(epSeries.map((s) => String(s.tvdb)))
    const wlSeries = seriesRows.filter((r) => !handled.has(String(r.tvdb_id)))

    const total = epSeries.length + wlSeries.length + movieRows.length
    if (!total) { setStatus({ type: 'error', text: 'No recognised TV Time files.' }); return }

    setAnalyzing(true); setStatus(null)
    let done = 0
    setProgress({ done: 0, total, ok: 0, skipped: 0 })
    const tick = () => { done++; setProgress((p) => ({ ...p, done })) }
    try {
      const snap = await getGroupImportSnapshot(groupId)
      const epR = await pool(epSeries, async (s) => {
        const fix = TVDB_IMDB_FIXUPS[String(s.tvdb)]
        const seed = (await findByTvdbId(s.tvdb)) || (fix ? await findByImdbId(fix) : null) || (await findByTitle(s.title, null, 'tv'))
        return { s, seed }
      }, 12, tick)
      const wlR = await pool(wlSeries, async (r) => {
        const fix = TVDB_IMDB_FIXUPS[String(r.tvdb_id)]
        const seed = (await findByTvdbId(r.tvdb_id)) || (fix ? await findByImdbId(fix) : null) || (r.imdb_id ? await findByImdbId(r.imdb_id) : null) || (await findByTitle(r.title, null, 'tv'))
        return { r, seed }
      }, 12, tick)
      const mvR = await pool(movieRows, async (r) => {
        let seed = r.imdb_id ? await findByImdbId(r.imdb_id) : null
        if (!seed) seed = await findByTitle(r.title, r.year, 'movie')
        return { r, seed }
      }, 12, tick)

      const unmatchedTitles = [
        ...epR.filter((x) => !x.seed).map((x) => x.s.title),
        ...wlR.filter((x) => !x.seed).map((x) => x.r.title),
        ...mvR.filter((x) => !x.seed).map((x) => x.r.title),
      ].filter(Boolean)

      const map = await ensureTitlesBulk([...epR, ...wlR, ...mvR].map((x) => x.seed).filter(Boolean))

      const episodeRows = [], episodeUpdates = [], watchRows = [], watchlistRows = []
      let newEpisodes = 0, alreadyEpisodes = 0, rewatchEpisodes = 0, alreadyWatches = 0, alreadyWatchlist = 0
      const seenW = new Set(), seenWl = new Set()

      // Episodes (incremental): new ones to add, rewatch bumps to update, rest skipped
      for (const { s, seed } of epR) {
        const tid = seed && map.get(keyOf(seed)); if (!tid) continue
        const fresh = []
        for (const e of s.watched) {
          const k = `${tid}-${e.season}-${e.episode}`
          if (!snap.episodes.has(k)) { newEpisodes++; fresh.push(e) }
          else if (e.rewatchCount > (snap.episodes.get(k) || 0)) { rewatchEpisodes++; episodeUpdates.push({ titleId: tid, groupId, season: e.season, episode: e.episode, rewatchCount: e.rewatchCount }) }
          else alreadyEpisodes++
        }
        if (fresh.length) episodeRows.push({ titleId: tid, episodes: fresh })
        if (!snap.watches.has(tid) && !seenW.has(tid)) {
          seenW.add(tid)
          const dates = s.watched.map((e) => e.watchedOn).filter(Boolean).sort()
          const last = dates[dates.length - 1]
          watchRows.push({ title_id: tid, group_id: groupId, watched_on: last || null, date_precision: last ? 'day' : null, episodes_watched: s.watched.length, created_by: user.id, visibility: 'private', is_rewatch: false, rewatch_count: 0 })
        } else if (snap.watches.has(tid)) alreadyWatches++
      }
      // Movies
      for (const { r, seed } of mvR) {
        const tid = seed && map.get(keyOf(seed)); if (!tid) continue
        if (truthy(r.is_watched)) {
          if (snap.watches.has(tid) || seenW.has(tid)) { alreadyWatches++; continue }
          seenW.add(tid)
          const wd = normDate(r.watched_at) || normDate(r.created_at)
          const rc = Number(r.rewatch_count) || 0
          watchRows.push({ title_id: tid, group_id: groupId, watched_on: wd || null, date_precision: wd ? 'day' : null, created_by: user.id, visibility: 'private', rewatch_count: rc, is_rewatch: rc > 0 })
        } else {
          if (snap.watchlist.has(tid) || seenWl.has(tid)) { alreadyWatchlist++; continue }
          seenWl.add(tid); watchlistRows.push({ title_id: tid, group_id: groupId, added_by: user.id })
        }
      }
      // Other followed series (not_started → watchlist, else → watched)
      for (const { r, seed } of wlR) {
        const tid = seed && map.get(keyOf(seed)); if (!tid) continue
        if ((r.status || '').toLowerCase() === 'not_started_yet') {
          if (snap.watchlist.has(tid) || seenWl.has(tid)) { alreadyWatchlist++; continue }
          seenWl.add(tid); watchlistRows.push({ title_id: tid, group_id: groupId, added_by: user.id })
        } else {
          if (snap.watches.has(tid) || seenW.has(tid)) { alreadyWatches++; continue }
          seenW.add(tid); watchRows.push({ title_id: tid, group_id: groupId, watched_on: null, date_precision: null, created_by: user.id, visibility: 'private', is_rewatch: false, rewatch_count: 0 })
        }
      }

      setPlan({
        batchKind: 'TV Time', episodeRows, episodeUpdates, watchRows, watchlistRows,
        counts: { newWatches: watchRows.length, alreadyWatches, newEpisodes, alreadyEpisodes, rewatchEpisodes, newWatchlist: watchlistRows.length, alreadyWatchlist, unmatched: unmatchedTitles.length },
        unmatchedTitles,
      })
    } catch (e) {
      console.error('tvtime analyze', e)
      setStatus({ type: 'error', text: `Analyze error: ${e.message}` })
    } finally {
      setAnalyzing(false)
    }
  }

  async function analyzeImport() {
    if (!groupId) { setStatus({ type: 'error', text: 'Pick a group first.' }); return }
    setAnalyzing(true); setStatus(null)
    let done = 0
    setProgress({ done: 0, total: items.length, ok: 0, skipped: 0 })
    try {
      const snap = await getGroupImportSnapshot(groupId, cfg.needsPerson ? profileId : null)
      const resolved = await pool(items, async (it) => {
        let seed = it.imdbId ? await findByImdbId(it.imdbId) : null
        if (!seed) seed = await findByTitle(it.title, it.year, it.mediaHint)
        return seed ? { seed, it } : null
      }, 12, () => { done++; setProgress((p) => ({ ...p, done })) })

      const matched = resolved.filter(Boolean)
      const unmatchedTitles = items.filter((_, i) => !resolved[i]).map((it) => it.title || it.imdbId)
      const map = await ensureTitlesBulk(matched.map((m) => m.seed))
      const seen = new Set()

      if (cfg.target === 'watchlist') {
        const watchlistRows = []; let alreadyWatchlist = 0
        for (const m of matched) {
          const tid = map.get(keyOf(m.seed)); if (!tid || seen.has(tid)) continue; seen.add(tid)
          if (snap.watchlist.has(tid)) { alreadyWatchlist++; continue }
          watchlistRows.push({ title_id: tid, group_id: groupId, added_by: user.id })
        }
        setPlan({ batchKind: cfg.label, watchlistRows, counts: { newWatchlist: watchlistRows.length, alreadyWatchlist, unmatched: unmatchedTitles.length }, unmatchedTitles })
      } else {
        const watchRows = [], ratingUpdates = []; let alreadyWatches = 0
        for (const m of matched) {
          const tid = map.get(keyOf(m.seed)); if (!tid || seen.has(tid)) continue; seen.add(tid)
          const s = m.it.score ? Math.max(1, Math.min(10, Math.round(Number(m.it.score)))) : null
          if (snap.watches.has(tid)) {
            // already logged - but did the rating change?
            const prev = snap.ratings.get(tid)
            if (profileId && s != null && prev && prev.score !== s) ratingUpdates.push({ watchId: prev.watchId, score: s })
            else alreadyWatches++
            continue
          }
          const wd = normDate(m.it.date)
          watchRows.push({ title_id: tid, group_id: groupId, watched_on: wd || null, date_precision: wd ? 'day' : null, created_by: user.id, visibility: 'private', is_rewatch: false, rewatch_count: 0, _score: profileId ? s : null })
        }
        setPlan({ batchKind: cfg.label, watchRows, ratingUpdates, counts: { newWatches: watchRows.length, alreadyWatches, ratingChanged: ratingUpdates.length, unmatched: unmatchedTitles.length }, unmatchedTitles })
      }
    } catch (e) {
      console.error('analyze', e)
      setStatus({ type: 'error', text: `Analyze error: ${e.message}` })
    } finally {
      setAnalyzing(false)
    }
  }

  // Apply the computed plan: write only the new rows (honouring category
  // toggles), bump rewatch counts, update changed ratings, tag with a batch.
  async function applyPlan() {
    if (!plan || !groupId) return
    setRunning(true); setStatus(null)
    const batchId = newId()
    try {
      let watches = 0, episodes = 0, watchlist = 0, updated = 0
      if (cats.episodes) {
        for (const er of (plan.episodeRows || [])) {
          await markEpisodesBulk({ titleId: er.titleId, groupId, episodes: er.episodes, createdBy: user.id, importBatch: batchId })
          episodes += er.episodes.length
        }
        if (plan.episodeUpdates?.length) { await updateEpisodeRewatches(plan.episodeUpdates); updated += plan.episodeUpdates.length }
      }
      if (cats.watched && plan.watchRows?.length) {
        const rows = plan.watchRows.map(({ _score, ...rest }) => ({ ...rest, import_batch: batchId }))
        const ids = await insertWatchesBulk(rows)
        watches = ids.length
        const ratingRows = []
        ids.forEach((wid, i) => { const s = plan.watchRows[i]._score; if (wid && s) ratingRows.push({ watch_id: wid, profile_id: profileId, score: s }) })
        if (ratingRows.length) await insertRatingsBulk(ratingRows)
      }
      if (cats.watched && plan.ratingUpdates?.length) {
        for (const u of plan.ratingUpdates) { await setRating(u.watchId, profileId, u.score); updated++ }
      }
      if (cats.watchlist && plan.watchlistRows?.length) {
        await insertWatchlistBulk(plan.watchlistRows.map((r) => ({ ...r, import_batch: batchId })))
        watchlist = plan.watchlistRows.length
      }
      if (watches + episodes + watchlist > 0) {
        await createImportBatch({ id: batchId, ownerId: user.id, kind: plan.batchKind, groupId, profileId: cfg.needsPerson ? profileId : null, filename: cfg.multi ? tvFiles.map((f) => f.name).join(', ') : filename, watches, episodes, watchlist }).catch(() => {})
        loadBatches()
      }
      setStatus({ type: 'ok', text: `Imported ${watches} watched · ${episodes} episodes · ${watchlist} to watchlist${updated ? ` · ${updated} updated` : ''}.` })
      setPlan(null); setItems([]); setTvFiles([])
    } catch (e) {
      console.error('apply', e)
      setStatus({ type: 'error', text: `Import error: ${e.message}` })
    } finally {
      setRunning(false)
    }
  }

  // ---- Native ReelBook restore ----
  async function analyzeReelbook() {
    if (!backup) { setStatus({ type: 'error', text: 'Load a backup file first.' }); return }
    const targets = [...new Set(Object.values(groupMap).filter(Boolean))]
    if (!targets.length) { setStatus({ type: 'error', text: 'Map at least one group.' }); return }
    setAnalyzing(true); setStatus(null)
    try {
      // Resolve every referenced title once (matched by TMDB id, no lookups).
      // Works for both the normalized schema (top-level `titles` + row refs) and
      // the older embedded schema (titles(*) on every row).
      const seeds = [...(backup.titles || [])]
      for (const d of backup.diary || []) if (d.titles?.tmdb_id) seeds.push(d.titles)
      for (const e of backup.episodes || []) if (e.titles?.tmdb_id) seeds.push(e.titles)
      for (const w of backup.watchlist || []) if (w.titles?.tmdb_id) seeds.push(w.titles)
      for (const r of backup.season_ratings || []) if (r.tmdb_id) seeds.push({ tmdb_id: r.tmdb_id, media_type: r.media_type, title: r.title })
      for (const col of backup.collections || []) for (const it of col.items || []) if (it.tmdb_id) seeds.push({ tmdb_id: it.tmdb_id, media_type: it.media_type, title: it.title })
      for (const f of backup.favourites || []) if (f.tmdb_id) seeds.push({ tmdb_id: f.tmdb_id, media_type: f.media_type, title: f.title })
      const map = await ensureTitlesBulk(seeds)
      const titleKey = (row) => row.titles ? keyOf(row.titles) : (row.tmdb_id ? `${row.media_type}-${row.tmdb_id}` : null)
      const groupNameOf = (row) => row.groups?.name ?? row.group ?? null

      const snaps = {}, watchKeys = {}
      for (const gid of targets) { snaps[gid] = await getGroupImportSnapshot(gid); watchKeys[gid] = await getExistingWatchKeys(gid) }

      const watchRows = [], episodeMap = new Map(), watchlistRows = [], seasonRows = []
      let skipWatch = 0, skipEp = 0, skipWl = 0, skipSeason = 0
      const gidOf = (name) => groupMap[name || NOGROUP] || ''
      // Only restore ratings that belong to a profile that exists here, so a
      // stale/foreign profile id can't abort the whole batch on a FK violation.
      const validProfiles = new Set(profiles.map((p) => p.id))
      const seenWl = {}, seenSeason = new Set()   // per-target dedup so merging two groups doesn't double-count

      for (const d of backup.diary || []) {
        const tid = map.get(titleKey(d)); const gid = gidOf(groupNameOf(d))
        if (!tid || !gid) continue
        // Dedup only against what's already in the DB; do NOT collapse two
        // legitimate same-day watches from the backup into one.
        const k = `${tid}|${d.watched_on || ''}`
        if (watchKeys[gid].has(k)) { skipWatch++; continue }
        watchRows.push({
          title_id: tid, group_id: gid, watched_on: d.watched_on || null,
          date_precision: d.date_precision || (d.watched_on ? 'day' : null),
          note: d.note || null, service: d.service || null, where_watched: d.where_watched || null,
          episodes_watched: d.episodes_watched || 0,
          tags: d.tags || [], is_rewatch: !!d.is_rewatch, rewatch_count: d.rewatch_count || 0,
          visibility: d.visibility || 'private', created_by: user.id,
          _ratings: (d.ratings || []).filter((r) => r.score != null && validProfiles.has(r.profile_id)).map((r) => ({ profile_id: r.profile_id, score: r.score })),
        })
      }
      for (const e of backup.episodes || []) {
        const tid = map.get(titleKey(e)); const gid = gidOf(groupNameOf(e))
        if (!tid || !gid) continue
        const sn = e.season ?? e.season_number, en = e.episode ?? e.episode_number
        if (snaps[gid].episodes.has(`${tid}-${sn}-${en}`)) { skipEp++; continue }
        const mk = `${tid}|${gid}`
        if (!episodeMap.has(mk)) episodeMap.set(mk, { titleId: tid, groupId: gid, episodes: [], seen: new Set() })
        const grp = episodeMap.get(mk)
        const ek = `${sn}-${en}`
        if (grp.seen.has(ek)) continue   // two source groups merged into one target
        grp.seen.add(ek)
        grp.episodes.push({ season: sn, episode: en, watchedOn: e.watched_on || null, rewatchCount: e.rewatch_count || 0, rating: e.rating ?? null })
      }
      for (const w of backup.watchlist || []) {
        const tid = map.get(titleKey(w)); const gid = gidOf(groupNameOf(w))
        if (!tid || !gid) continue
        if (snaps[gid].watchlist.has(tid)) { skipWl++; continue }
        const key = `${gid}|${tid}`
        if (seenWl[key]) continue; seenWl[key] = true
        watchlistRows.push({ title_id: tid, group_id: gid, added_by: user.id })
      }
      for (const r of backup.season_ratings || []) {
        const tid = map.get(`${r.media_type}-${r.tmdb_id}`); const gid = gidOf(r.group_name)
        if (!tid || !gid || r.score == null || !r.profile_id || !validProfiles.has(r.profile_id)) { skipSeason++; continue }
        const sk = `${tid}|${gid}|${r.profile_id}|${r.season_number}`
        if (seenSeason.has(sk)) continue; seenSeason.add(sk)
        seasonRows.push({ title_id: tid, group_id: gid, profile_id: r.profile_id, season_number: r.season_number, score: r.score, created_by: user.id })
      }

      const episodeRows = [...episodeMap.values()]
      const newEpisodes = episodeRows.reduce((a, g) => a + g.episodes.length, 0)

      // Lists / favourites / subscriptions (title-matched by TMDB id where relevant).
      const collectionsPlan = (backup.collections || []).map((col) => ({
        name: col.name, description: col.description, emoji: col.emoji, ranked: col.ranked,
        items: (col.items || []).map((it) => ({ titleId: map.get(`${it.media_type}-${it.tmdb_id}`), note: it.note })).filter((x) => x.titleId),
      })).filter((c) => c.name)
      const favouritesPlan = (backup.favourites || []).map((f) => ({
        profileId: f.profile_id, titleId: map.get(`${f.media_type}-${f.tmdb_id}`), position: f.position,
      })).filter((f) => f.titleId && validProfiles.has(f.profileId))
      const subscriptionsPlan = backup.subscriptions || []

      setPlan({
        batchKind: 'ReelBook backup', reelbook: true, watchRows, episodeRows, watchlistRows, seasonRows,
        collectionsPlan, favouritesPlan, subscriptionsPlan,
        counts: {
          newWatches: watchRows.length, alreadyWatches: skipWatch,
          newEpisodes, alreadyEpisodes: skipEp,
          newWatchlist: watchlistRows.length, alreadyWatchlist: skipWl,
          newSeasonRatings: seasonRows.length,
          newCollections: collectionsPlan.length,
          newFavourites: favouritesPlan.length,
          newSubscriptions: subscriptionsPlan.length,
        },
      })
    } catch (e) {
      console.error('reelbook analyze', e)
      setStatus({ type: 'error', text: `Analyze error: ${e.message}` })
    } finally { setAnalyzing(false) }
  }

  async function applyReelbook() {
    if (!plan?.reelbook) return
    setRunning(true); setStatus(null)
    const batchId = newId()
    try {
      let watches = 0, episodes = 0, watchlist = 0, seasons = 0
      if (cats.watched && plan.watchRows.length) {
        const rows = plan.watchRows.map(({ _ratings, ...rest }) => ({ ...rest, import_batch: batchId }))
        const ids = await insertWatchesBulk(rows)
        watches = ids.length
        const ratingRows = []
        ids.forEach((wid, i) => { for (const rr of plan.watchRows[i]._ratings) if (wid && rr.score) ratingRows.push({ watch_id: wid, profile_id: rr.profile_id, score: rr.score }) })
        if (ratingRows.length) await insertRatingsBulk(ratingRows)
      }
      if (cats.episodes) {
        for (const g of plan.episodeRows) { await markEpisodesBulk({ titleId: g.titleId, groupId: g.groupId, episodes: g.episodes, createdBy: user.id, importBatch: batchId }); episodes += g.episodes.length }
      }
      if (cats.watchlist && plan.watchlistRows.length) {
        await insertWatchlistBulk(plan.watchlistRows.map((r) => ({ ...r, import_batch: batchId })))
        watchlist = plan.watchlistRows.length
      }
      if (cats.seasonRatings && plan.seasonRows.length) {
        await restoreSeasonRatingsBulk(plan.seasonRows); seasons = plan.seasonRows.length
      }
      let lists = 0, favourites = 0, subs = 0
      if (cats.collections && plan.collectionsPlan?.length) {
        const r = await restoreCollections(plan.collectionsPlan, user.id); lists = r.lists
      }
      if (cats.favourites && plan.favouritesPlan?.length) {
        favourites = await restoreFavouritesBulk(plan.favouritesPlan)
      }
      if (cats.subscriptions && plan.subscriptionsPlan?.length) {
        subs = await restoreSubscriptions(plan.subscriptionsPlan, user.id)
      }
      if (watches + episodes + watchlist > 0) {
        await createImportBatch({ id: batchId, ownerId: user.id, kind: 'ReelBook backup', groupId: Object.values(groupMap).find(Boolean), profileId: null, filename, watches, episodes, watchlist }).catch(() => {})
        loadBatches()
      }
      const extras = [seasons && `${seasons} season ratings`, lists && `${lists} lists`, favourites && `${favourites} favourites`, subs && `${subs} subscriptions`].filter(Boolean).join(' · ')
      setStatus({ type: 'ok', text: `Restored ${watches} watches · ${episodes} episodes · ${watchlist} watchlist${extras ? ` · ${extras}` : ''}.` })
      setPlan(null); setBackup(null); setGroupMap({}); setFilename('')
    } catch (e) {
      console.error('reelbook apply', e)
      setStatus({ type: 'error', text: `Restore error: ${e.message}` })
    } finally { setRunning(false) }
  }

  return (
    <div className="page">
      <h1>Import &amp; Export</h1>

      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={view === 'import' ? 'on' : ''} onClick={() => setView('import')}>⬆️ Import</button>
        <button className={view === 'export' ? 'on' : ''} onClick={() => setView('export')}>⬇️ Export</button>
      </div>

      {view === 'export' && (
        <ExportPanel groups={groups} myProfileId={user.id} onFullBackup={runBackupExport} exporting={exporting} />
      )}

      {view === 'import' && (<>
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
        {!cfg.reelbook && (
          <div className="field">
            <label>{cfg.target === 'watchlist' ? 'Add to watchlist for group' : 'Log into group'}</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.length === 0 && <option value="">Create a group first</option>}
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        {cfg.needsPerson && (
          <div className="field">
            <label>Ratings belong to</label>
            <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>{cfg.multi ? 'TV Time CSV files (pick all of them at once)' : cfg.reelbook ? 'ReelBook backup (.json)' : 'File (.csv or .json)'}</label>
          {cfg.multi
            ? <input type="file" accept=".csv" multiple onChange={onTvFiles} />
            : <input type="file" accept={cfg.reelbook ? '.json,application/json' : '.csv,.json,text/csv,application/json'} onChange={onFile} />}
        </div>
        {cfg.reelbook && backup && Object.keys(groupMap).length > 0 && (
          <div className="field">
            <label>Map each backup group onto one of yours</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.keys(groupMap).map((name) => (
                <div key={name} className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: '0 0 40%', minWidth: 0, fontWeight: 600 }}>{name}</span>
                  <span className="faint">→</span>
                  <select style={{ flex: 1 }} value={groupMap[name]} onChange={(e) => setGroupMap((m) => ({ ...m, [name]: e.target.value }))}>
                    <option value="">Skip this group</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {status && <div className={`banner ${status.type === 'error' ? 'error' : ''}`}>{status.text}</div>}

      {skippedTitles.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <button className="spread" style={{ width: '100%', background: 'none' }} onClick={() => setShowSkipped((s) => !s)}>
            <strong>{skippedTitles.length} skipped (not found on TMDB)</strong>
            <span className="faint">{showSkipped ? 'hide ▾' : 'show ▸'}</span>
          </button>
          {showSkipped && (
            <div className="faint" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
              {skippedTitles.map((t, i) => <div key={i}>• {t}</div>)}
            </div>
          )}
          <div className="faint" style={{ marginTop: 10 }}>
            These are usually stand-up specials, sports/wrestling events, “Video” releases or other items not in TMDB’s film/TV catalogue. You can add any of them manually from Discover if TMDB has them under a different name.
          </div>
        </div>
      )}

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
          {analyzing && <AnalyzeBar progress={progress} />}
          <PlanPreview plan={plan} cats={cats} setCats={setCats} isTv />
          {tvFiles.some((f) => f.type !== 'unknown') ? (
            plan ? (
              <div className="row" style={{ gap: 8 }}>
                <button className="btn primary" style={{ flex: 1 }} disabled={running || planActions(plan, cats) === 0} onClick={applyPlan}>
                  {running ? 'Importing…' : planActions(plan, cats) > 0 ? `Import ${planActions(plan, cats)} item${planActions(plan, cats) === 1 ? '' : 's'}` : 'Nothing to import'}
                </button>
                <button className="btn ghost" disabled={running} onClick={() => setPlan(null)}>Re-analyze</button>
              </div>
            ) : (
              <button className="btn primary block" disabled={analyzing || !groupId} onClick={analyzeTvTime}>
                {analyzing ? 'Analyzing…' : 'Analyze TV Time export'}
              </button>
            )
          ) : tvFiles.length === 0 && !status ? (
            <Empty icon="📺">Select your TV Time CSV files above. You can choose several at once (movies, series-episodes, series).</Empty>
          ) : null}
        </>
      )}

      {cfg.reelbook && (
        <>
          {backup && !plan && (
            <div className="card" style={{ marginBottom: 12 }}>
              <strong>Backup loaded</strong>
              <div className="faint" style={{ marginTop: 6 }}>
                {backup.exported_at ? `Exported ${fmtDate(backup.exported_at)} · ` : ''}
                {backup.counts?.diary || 0} watches · {backup.counts?.episodes || 0} episodes · {backup.counts?.watchlist || 0} watchlist · {backup.counts?.season_ratings || 0} season ratings
              </div>
            </div>
          )}
          {analyzing && <AnalyzeBar progress={progress} />}
          {plan?.reelbook && (
            <div className="card" style={{ marginBottom: 12 }}>
              <strong>Restore preview</strong>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CatToggle on={cats.watched} set={(v) => setCats((c) => ({ ...c, watched: v }))} label="Diary watches" n={plan.counts.newWatches} already={plan.counts.alreadyWatches} />
                <CatToggle on={cats.episodes} set={(v) => setCats((c) => ({ ...c, episodes: v }))} label="Episodes" n={plan.counts.newEpisodes} already={plan.counts.alreadyEpisodes} />
                <CatToggle on={cats.watchlist} set={(v) => setCats((c) => ({ ...c, watchlist: v }))} label="Watchlist" n={plan.counts.newWatchlist} already={plan.counts.alreadyWatchlist} />
                <CatToggle on={cats.seasonRatings} set={(v) => setCats((c) => ({ ...c, seasonRatings: v }))} label="Season ratings" n={plan.counts.newSeasonRatings} already={0} />
                <CatToggle on={cats.collections} set={(v) => setCats((c) => ({ ...c, collections: v }))} label="Lists" n={plan.counts.newCollections} already={0} />
                <CatToggle on={cats.favourites} set={(v) => setCats((c) => ({ ...c, favourites: v }))} label="Top-4 favourites" n={plan.counts.newFavourites} already={0} />
                <CatToggle on={cats.subscriptions} set={(v) => setCats((c) => ({ ...c, subscriptions: v }))} label="Subscriptions" n={plan.counts.newSubscriptions} already={0} />
              </div>
            </div>
          )}
          {backup ? (
            plan?.reelbook ? (
              <div className="row" style={{ gap: 8 }}>
                <button className="btn primary" style={{ flex: 1 }} disabled={running || reelbookActions(plan, cats) === 0} onClick={applyReelbook}>
                  {running ? 'Restoring…' : reelbookActions(plan, cats) > 0 ? `Restore ${reelbookActions(plan, cats)} items` : 'Nothing new to restore'}
                </button>
                <button className="btn ghost" disabled={running} onClick={() => setPlan(null)}>Re-analyze</button>
              </div>
            ) : (
              <button className="btn primary block" disabled={analyzing} onClick={analyzeReelbook}>
                {analyzing ? 'Analyzing…' : 'Analyze backup'}
              </button>
            )
          ) : !status ? (
            <Empty icon="🗂️">Choose a ReelBook backup .json file above to restore it.</Empty>
          ) : null}
        </>
      )}

      {!cfg.multi && !cfg.reelbook && items.length > 0 && (
        <>
          <div className="spread" style={{ marginBottom: 12 }}>
            <strong>{filename}</strong>
            <span className="faint">{items.length} titles found</span>
          </div>

          {analyzing && <AnalyzeBar progress={progress} />}
          <PlanPreview plan={plan} cats={cats} setCats={setCats} />

          {plan ? (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary" style={{ flex: 1 }} disabled={running || planActions(plan, cats) === 0} onClick={applyPlan}>
                {running ? 'Importing…' : planActions(plan, cats) > 0 ? `Import ${planActions(plan, cats)} item${planActions(plan, cats) === 1 ? '' : 's'}` : 'Nothing to import'}
              </button>
              <button className="btn ghost" disabled={running} onClick={() => setPlan(null)}>Re-analyze</button>
            </div>
          ) : (
            <button className="btn primary block" disabled={analyzing || !groupId} onClick={analyzeImport}>
              {analyzing ? 'Analyzing…' : 'Analyze import'}
            </button>
          )}

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

      {batches.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="section-head"><h2 style={{ fontSize: 18 }}>Import history</h2></div>
          <p className="faint" style={{ margin: '0 0 12px' }}>Each import is tracked here. “Undo” removes exactly what that import added, so you can fix an import into the wrong group or by mistake.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {batches.map((b) => {
              const parts = [
                b.watches_count ? `${b.watches_count} watched` : '',
                b.episodes_count ? `${b.episodes_count} episodes` : '',
                b.watchlist_count ? `${b.watchlist_count} watchlist` : '',
              ].filter(Boolean).join(' · ')
              return (
                <div className="card row" key={b.id} style={{ gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{b.kind}</strong>
                    {b.groups?.name && <span className="chip" style={{ marginLeft: 8 }}>{b.groups.name}</span>}
                    {b.profiles?.name && <span className="chip" style={{ marginLeft: 6 }}>{b.profiles.name}</span>}
                    <div className="faint" style={{ marginTop: 3 }}>{parts || 'nothing added'} · {fmtDate(b.created_at)}</div>
                  </div>
                  <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                    <button className="btn sm ghost" disabled={reverting === b.id} onClick={() => dismissBatch(b)} title="Remove from this list but keep all the data">
                      Clear
                    </button>
                    <button className="btn sm danger" disabled={reverting === b.id} onClick={() => revertBatch(b)} title="Delete everything this import added">
                      {reverting === b.id ? '…' : 'Undo'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}

const num = (n) => n || 0
function planActions(p, cats) {
  if (!p) return 0
  const c = p.counts; let t = 0
  if (!cats || cats.episodes) t += num(c.newEpisodes) + num(c.rewatchEpisodes)
  if (!cats || cats.watched) t += num(c.newWatches) + num(c.ratingChanged)
  if (!cats || cats.watchlist) t += num(c.newWatchlist)
  return t
}

function reelbookActions(p, cats) {
  if (!p) return 0
  const c = p.counts; let t = 0
  if (cats.watched) t += num(c.newWatches)
  if (cats.episodes) t += num(c.newEpisodes)
  if (cats.watchlist) t += num(c.newWatchlist)
  if (cats.seasonRatings) t += num(c.newSeasonRatings)
  if (cats.collections) t += num(c.newCollections)
  if (cats.favourites) t += num(c.newFavourites)
  if (cats.subscriptions) t += num(c.newSubscriptions)
  return t
}

function ExpCheck({ on, set, children }) {
  return (
    <label className="row" style={{ gap: 8, cursor: 'pointer', alignItems: 'center' }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 'auto' }} />
      <span>{children}</span>
    </label>
  )
}

function ExportPanel({ groups, myProfileId, onFullBackup, exporting }) {
  const toast = useToast()
  const [fmt, setFmt] = useState({ json: true, csv: false })
  const [inc, setInc] = useState({ diary: true, episodes: true, watchlist: false, seasonRatings: false })
  const [media, setMedia] = useState('all')
  const [groupId, setGroupId] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [withRatings, setWithRatings] = useState(true)
  const [busy, setBusy] = useState(false)

  const noFmt = !fmt.json && !fmt.csv
  const noInc = !inc.diary && !inc.episodes && !inc.watchlist && !inc.seasonRatings

  async function run() {
    if (noFmt || noInc) return
    setBusy(true)
    try {
      const c = await runCustomExport({ formats: fmt, include: inc, media, groupId: groupId || null, mineOnly, myProfileId, withRatings })
      toast(`Exported ${c.diary} watches · ${c.episodes} episodes · ${c.watchlist} watchlist`)
    } catch (e) { toast(e.message || 'Export failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="spread" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <strong>🗂️ Full backup</strong>
            <div className="faint" style={{ marginTop: 4 }}>Everything in one compact JSON, and the Import tab (ReelBook backup) restores all of it: diary, episodes, watchlist, season ratings, lists, favourites and subscriptions.</div>
          </div>
          <button className="btn primary" disabled={exporting} onClick={onFullBackup}>{exporting ? 'Preparing…' : 'Download full backup (.json)'}</button>
        </div>
      </div>

      <div className="card">
        <strong>⬇️ Custom export</strong>
        <div className="faint" style={{ margin: '4px 0 14px' }}>Choose exactly what to export, and in which format.</div>

        <div className="field">
          <label>Format</label>
          <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
            <ExpCheck on={fmt.json} set={(v) => setFmt((f) => ({ ...f, json: v }))}>JSON</ExpCheck>
            <ExpCheck on={fmt.csv} set={(v) => setFmt((f) => ({ ...f, csv: v }))}>CSV (a file per category)</ExpCheck>
          </div>
        </div>

        <div className="field">
          <label>Include</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ExpCheck on={inc.diary} set={(v) => setInc((s) => ({ ...s, diary: v }))}>Diary (watched movies &amp; shows)</ExpCheck>
            <ExpCheck on={inc.episodes} set={(v) => setInc((s) => ({ ...s, episodes: v }))}>Episode history</ExpCheck>
            <ExpCheck on={inc.watchlist} set={(v) => setInc((s) => ({ ...s, watchlist: v }))}>Watchlist</ExpCheck>
            <ExpCheck on={inc.seasonRatings} set={(v) => setInc((s) => ({ ...s, seasonRatings: v }))}>Season ratings</ExpCheck>
          </div>
        </div>

        <div className="field">
          <label>Type (applies to diary &amp; watchlist)</label>
          <div className="seg">
            {[['all', 'Movies & TV'], ['movie', 'Movies only'], ['tv', 'TV only']].map(([v, l]) => (
              <button key={v} type="button" className={media === v ? 'on' : ''} onClick={() => setMedia(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Group</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ExpCheck on={mineOnly} set={setMineOnly}>Only entries I logged</ExpCheck>
          <ExpCheck on={withRatings} set={setWithRatings}>Include ratings</ExpCheck>
        </div>

        <button className="btn primary block" disabled={busy || noFmt || noInc} onClick={run}>
          {busy ? 'Preparing…' : noFmt ? 'Pick a format' : noInc ? 'Pick what to export' : 'Export selection'}
        </button>
      </div>
    </>
  )
}

function CatToggle({ on, set, label, n, already }) {
  return (
    <label className="row" style={{ gap: 10, cursor: 'pointer', alignItems: 'center' }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 'auto' }} />
      <span style={{ fontWeight: 600, flex: 1 }}>{label}</span>
      <span style={{ color: n > 0 ? 'var(--green)' : 'var(--text-dim)' }}>{n > 0 ? `+${n} new` : 'none new'}</span>
      {already > 0 && <span className="faint">· {already} already there</span>}
    </label>
  )
}

function exportUnmatched(titles) {
  const blob = new Blob([(titles || []).join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'reelbook-unmatched.txt'; a.click()
  URL.revokeObjectURL(url)
}

function AnalyzeBar({ progress }) {
  const pct = progress.total ? (progress.done / progress.total) * 100 : 0
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="spread"><span>Analyzing…</span><span className="faint">{progress.done}/{progress.total}</span></div>
      <div style={{ height: 8, background: 'var(--bg-elev-2)', borderRadius: 999, overflow: 'hidden', margin: '8px 0 0' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
      </div>
    </div>
  )
}

// Incremental import breakdown + per-category toggles + unmatched export.
function PlanPreview({ plan, cats, setCats, isTv }) {
  const [showUnmatched, setShowUnmatched] = useState(false)
  if (!plan) return null
  const c = plan.counts
  const news = [
    c.newWatches ? `${c.newWatches} new ${isTv ? 'shows/movies' : 'titles'}` : '',
    c.newEpisodes ? `${c.newEpisodes} new episodes` : '',
    c.newWatchlist ? `${c.newWatchlist} new to watchlist` : '',
  ].filter(Boolean)
  const updates = [
    c.rewatchEpisodes ? `${c.rewatchEpisodes} episode rewatches` : '',
    c.ratingChanged ? `${c.ratingChanged} rating changes` : '',
  ].filter(Boolean)
  const already = [
    c.alreadyWatches ? `${c.alreadyWatches} watched` : '',
    c.alreadyEpisodes ? `${c.alreadyEpisodes} episodes` : '',
    c.alreadyWatchlist ? `${c.alreadyWatchlist} watchlist` : '',
  ].filter(Boolean)
  const Row = ({ color, label, value }) => (
    <div className="spread" style={{ padding: '6px 0' }}>
      <span className="row" style={{ gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 9, background: color }} />{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  )
  const Toggle = ({ k, label, n }) => (
    <label className="row" style={{ gap: 6, opacity: n ? 1 : 0.5 }}>
      <input type="checkbox" checked={cats[k]} disabled={!n} onChange={(e) => setCats((s) => ({ ...s, [k]: e.target.checked }))} />
      {label} <span className="faint">({n})</span>
    </label>
  )
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <strong>Import preview (incremental)</strong>
      <p className="faint" style={{ margin: '4px 0 8px' }}>Only new items are added; existing ones are skipped. Rewatches and changed ratings are updated in place.</p>
      <Row color="var(--green)" label="✨ New (will be added)" value={news.length ? news.join(' · ') : 'nothing new'} />
      {updates.length > 0 && (<><div style={{ borderTop: '1px solid var(--border)' }} /><Row color="var(--accent)" label="🔁 Updates" value={updates.join(' · ')} /></>)}
      <div style={{ borderTop: '1px solid var(--border)' }} />
      <Row color="var(--text-dim)" label="⏭️ Already logged (skipped)" value={already.length ? already.join(' · ') : 'none'} />
      {c.unmatched > 0 && (
        <>
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <div className="spread" style={{ padding: '6px 0' }}>
            <span className="row" style={{ gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 9, background: 'var(--pink)' }} />🔍 Couldn’t match on TMDB</span>
            <span className="row" style={{ gap: 10 }}>
              <button className="linklike" onClick={() => exportUnmatched(plan.unmatchedTitles)}>Export</button>
              <button className="linklike" onClick={() => setShowUnmatched((s) => !s)}><strong style={{ color: 'var(--pink)' }}>{c.unmatched}</strong> {showUnmatched ? '▲' : '▼'}</button>
            </span>
          </div>
          {showUnmatched && (
            <div className="faint" style={{ maxHeight: 160, overflow: 'auto', fontSize: 13 }}>
              {(plan.unmatchedTitles || []).map((t, i) => <div key={i}>• {t}</div>)}
            </div>
          )}
        </>
      )}
      {isTv && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 10 }}>
          <div className="faint" style={{ marginBottom: 6 }}>Include:</div>
          <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
            <Toggle k="episodes" label="Episodes" n={num(c.newEpisodes) + num(c.rewatchEpisodes)} />
            <Toggle k="watched" label="Watched shows/movies" n={num(c.newWatches)} />
            <Toggle k="watchlist" label="Watchlist" n={num(c.newWatchlist)} />
          </div>
        </div>
      )}
    </div>
  )
}
