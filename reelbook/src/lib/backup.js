// Build downloadable exports of the user's data (JSON + CSV), with options for
// what to include. JSON is normalized (one shared titles list, rows reference
// it) so files stay small even with tens of thousands of episode rows.
import { listDiary, listEpisodeDiary, listWatchlist, listAllSeasonRatings, listProfiles, listGroups } from './db'
import { exportAllData } from './db'
import { fmtDate } from './dates'

function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function download(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvRows = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n')

const compactTitle = (t) => t ? { tmdb_id: t.tmdb_id, media_type: t.media_type, title: t.title, year: t.year ?? null, poster_path: t.poster_path ?? null } : null
const ratingsFor = (rows) => (rows || []).filter((r) => r.score != null)

// ---------- Full, re-importable backup (normalized, schema 4) ----------

export async function downloadJsonBackup() {
  const raw = await exportAllData()
  const data = normalizeBackup(raw)
  download(`reelbook-backup-${todayStamp()}.json`, JSON.stringify(data), 'application/json')
  return raw.counts
}

// Turn the rich gather (embedded titles(*) with overview/backdrop on every row)
// into a compact shape: one deduped titles list + rows that reference it by
// tmdb id. This is what shrinks the file dramatically.
function normalizeBackup(raw) {
  const titles = new Map()
  const addT = (t) => { if (t?.tmdb_id) { const k = `${t.media_type}-${t.tmdb_id}`; if (!titles.has(k)) titles.set(k, compactTitle(t)) } }
  const ref = (t) => t ? { tmdb_id: t.tmdb_id, media_type: t.media_type } : {}
  const profName = new Map((raw.profiles || []).map((p) => [p.id, p.name]))
  ;(raw.diary || []).forEach((d) => addT(d.titles))
  ;(raw.episodes || []).forEach((e) => addT(e.titles))
  ;(raw.watchlist || []).forEach((w) => addT(w.titles))
  return {
    app: 'ReelBook', schema: 4, exported_at: raw.exported_at || new Date().toISOString(), counts: raw.counts,
    titles: [...titles.values()],
    profiles: raw.profiles, groups: (raw.groups || []).map((g) => ({ id: g.id, name: g.name, color: g.color })),
    diary: (raw.diary || []).map((d) => ({
      ...ref(d.titles), watched_on: d.watched_on, date_precision: d.date_precision,
      note: d.note || null, service: d.service || null, where_watched: d.where_watched || null,
      episodes_watched: d.episodes_watched || 0, tags: d.tags || [],
      is_rewatch: !!d.is_rewatch, rewatch_count: d.rewatch_count || 0, visibility: d.visibility || null,
      group: d.groups?.name || null,
      ratings: ratingsFor(d.ratings).map((r) => ({ profile: profName.get(r.profile_id) || null, profile_id: r.profile_id, score: r.score })),
    })),
    episodes: (raw.episodes || []).map((e) => ({
      ...ref(e.titles), season: e.season_number, episode: e.episode_number,
      watched_on: e.watched_on || null, rating: e.rating ?? null, rewatch_count: e.rewatch_count || 0, group: e.groups?.name || null,
    })),
    watchlist: (raw.watchlist || []).map((w) => ({ ...ref(w.titles), group: w.groups?.name || null, added: w.created_at })),
    season_ratings: raw.season_ratings, collections: raw.collections, favourites: raw.favourites, subscriptions: raw.subscriptions,
  }
}

// Human-readable diary spreadsheet (used by Settings).
export async function downloadDiaryCsv() {
  const data = await exportAllData()
  const head = ['Title', 'Year', 'Type', 'Watched', 'Group', 'Ratings', 'Episodes', 'Service', 'Where', 'Rewatch', 'Tags', 'Review']
  const rows = data.diary.map((e) => [
    e.titles?.title, e.titles?.year, e.titles?.media_type, e.watched_on ? fmtDate(e.watched_on) : '', e.groups?.name,
    ratingsFor(e.ratings).map((r) => r.score).join(' / '),
    e.episodes_watched || '', e.service, e.where_watched, e.is_rewatch ? 'yes' : '', (e.tags || []).join('; '), e.note,
  ])
  download(`reelbook-diary-${todayStamp()}.csv`, csvRows([head, ...rows]), 'text/csv')
  return rows.length
}

// Human-readable episode-watch spreadsheet (used by Settings).
export async function downloadEpisodesCsv() {
  const data = await exportAllData()
  const head = ['Show', 'Season', 'Episode', 'Watched', 'Group', 'Rating']
  const rows = data.episodes.map((e) => [
    e.titles?.title, e.season_number, e.episode_number, e.watched_on ? fmtDate(e.watched_on) : '', e.groups?.name, e.rating ?? '',
  ])
  download(`reelbook-episodes-${todayStamp()}.csv`, csvRows([head, ...rows]), 'text/csv')
  return rows.length
}

// ---------- Custom, filtered export ----------
// opts: {
//   formats: { json, csv },
//   include: { diary, episodes, watchlist, seasonRatings },
//   media: 'all' | 'movie' | 'tv',      // for diary
//   groupId: null | id,
//   mineOnly: bool, myProfileId,
//   withRatings: bool,
// }
export async function runCustomExport(opts) {
  const [profiles, groups] = await Promise.all([listProfiles(), listGroups()])
  const want = opts.include || {}
  const inGroup = (gid) => !opts.groupId || gid === opts.groupId
  const mine = (createdBy) => !opts.mineOnly || createdBy === opts.myProfileId

  const diary = want.diary ? (await listDiary({ limit: 100000 }))
    .filter((d) => inGroup(d.group_id) && mine(d.created_by))
    .filter((d) => opts.media === 'all' || d.titles?.media_type === opts.media) : []
  const episodes = want.episodes ? (await listEpisodeDiary({ limit: 200000 }))
    .filter((e) => inGroup(e.group_id) && mine(e.created_by)) : []
  const watchlist = want.watchlist ? (await listWatchlist(null))
    .filter((w) => inGroup(w.group_id))
    .filter((w) => opts.media === 'all' || w.titles?.media_type === opts.media) : []
  const seasonRatings = want.seasonRatings ? (await listAllSeasonRatings())
    .filter((r) => opts.withRatings) : []

  const counts = { diary: diary.length, episodes: episodes.length, watchlist: watchlist.length, season_ratings: seasonRatings.length }
  const stamp = todayStamp()

  if (opts.formats?.json) {
    const titles = new Map()
    const addT = (t) => { if (t?.tmdb_id) { const k = `${t.media_type}-${t.tmdb_id}`; if (!titles.has(k)) titles.set(k, compactTitle(t)) } }
    const ref = (t) => t ? { tmdb_id: t.tmdb_id, media_type: t.media_type } : {}
    const profName = new Map(profiles.map((p) => [p.id, p.name]))
    diary.forEach((d) => addT(d.titles)); episodes.forEach((e) => addT(e.titles)); watchlist.forEach((w) => addT(w.titles))
    const json = {
      app: 'ReelBook', schema: 4, exported_at: new Date().toISOString(),
      export_options: { media: opts.media, groupId: opts.groupId || null, mineOnly: !!opts.mineOnly, withRatings: !!opts.withRatings },
      counts, titles: [...titles.values()],
      diary: diary.map((d) => ({
        ...ref(d.titles), watched_on: d.watched_on, date_precision: d.date_precision, note: d.note || null,
        service: d.service || null, where_watched: d.where_watched || null, episodes_watched: d.episodes_watched || 0,
        tags: d.tags || [], is_rewatch: !!d.is_rewatch, rewatch_count: d.rewatch_count || 0, group: d.groups?.name || null,
        ratings: opts.withRatings ? ratingsFor(d.ratings).map((r) => ({ profile: profName.get(r.profile_id) || null, profile_id: r.profile_id, score: r.score })) : undefined,
      })),
      episodes: episodes.map((e) => ({
        ...ref(e.titles), season: e.season_number, episode: e.episode_number, watched_on: e.watched_on || null,
        rating: opts.withRatings ? (e.rating ?? null) : undefined, rewatch_count: e.rewatch_count || 0, group: e.groups?.name || null,
      })),
      watchlist: watchlist.map((w) => ({ ...ref(w.titles), group: w.groups?.name || null, added: w.created_at })),
      season_ratings: seasonRatings.map((r) => ({ tmdb_id: r.titles?.tmdb_id, media_type: r.titles?.media_type, title: r.titles?.title, season: r.season_number, score: r.score, profile: r.profiles?.name })),
    }
    download(`reelbook-export-${stamp}.json`, JSON.stringify(json), 'application/json')
  }

  if (opts.formats?.csv) {
    if (want.diary && diary.length) {
      const head = ['Title', 'Year', 'Type', 'Watched', 'Group', ...(opts.withRatings ? ['Ratings'] : []), 'Episodes', 'Service', 'Where', 'Rewatch', 'Tags', 'Review']
      const rows = diary.map((d) => [
        d.titles?.title, d.titles?.year, d.titles?.media_type, d.watched_on ? fmtDate(d.watched_on) : '', d.groups?.name,
        ...(opts.withRatings ? [ratingsFor(d.ratings).map((r) => r.score).join(' / ')] : []),
        d.episodes_watched || '', d.service, d.where_watched, d.is_rewatch ? 'yes' : '', (d.tags || []).join('; '), d.note,
      ])
      download(`reelbook-diary-${stamp}.csv`, csvRows([head, ...rows]), 'text/csv')
    }
    if (want.episodes && episodes.length) {
      const head = ['Show', 'Season', 'Episode', 'Watched', 'Group', ...(opts.withRatings ? ['Rating'] : [])]
      const rows = episodes.map((e) => [
        e.titles?.title, e.season_number, e.episode_number, e.watched_on ? fmtDate(e.watched_on) : '', e.groups?.name,
        ...(opts.withRatings ? [e.rating ?? ''] : []),
      ])
      download(`reelbook-episodes-${stamp}.csv`, csvRows([head, ...rows]), 'text/csv')
    }
    if (want.watchlist && watchlist.length) {
      const head = ['Title', 'Year', 'Type', 'Group', 'Added']
      const rows = watchlist.map((w) => [w.titles?.title, w.titles?.year, w.titles?.media_type, w.groups?.name, w.created_at ? fmtDate(w.created_at) : ''])
      download(`reelbook-watchlist-${stamp}.csv`, csvRows([head, ...rows]), 'text/csv')
    }
    if (want.seasonRatings && seasonRatings.length) {
      const head = ['Show', 'Season', 'Rater', 'Score']
      const rows = seasonRatings.map((r) => [r.titles?.title, r.season_number, r.profiles?.name, r.score])
      download(`reelbook-season-ratings-${stamp}.csv`, csvRows([head, ...rows]), 'text/csv')
    }
  }

  return counts
}
