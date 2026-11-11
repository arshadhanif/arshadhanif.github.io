import { supabase } from './supabase'
import { getDetail, getTitleDetailLite, getAiredEpisodeList } from './tmdb'

// ---------- Profiles ----------

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, color, avatar_url')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, color, avatar_url')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(id, fields) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  if (error) throw error
}

// ---------- Titles (TMDB cache) ----------

// Make sure a TMDB title exists in our `titles` cache; returns the row id.
// `seed` is a normalized search result; we fetch full detail (genre, episodes)
// the first time we cache it.
export async function ensureTitle(seed) {
  const { tmdb_id, media_type } = seed
  const { data: existing, error: selErr } = await supabase
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdb_id)
    .eq('media_type', media_type)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing.id

  let row = seed
  try {
    row = await getDetail(tmdb_id, media_type)
  } catch (e) {
    // If detail fetch fails, fall back to the seed we already have.
    console.warn('TMDB detail fetch failed, caching basic info', e)
  }

  const { data: inserted, error: insErr } = await supabase
    .from('titles')
    .insert({
      tmdb_id: row.tmdb_id,
      media_type: row.media_type,
      title: row.title,
      year: row.year ?? null,
      poster_path: row.poster_path ?? null,
      overview: row.overview ?? null,
      genre: row.genre ?? null,
      total_episodes: row.total_episodes ?? null,
    })
    .select('id')
    .single()
  if (insErr) throw insErr
  return inserted.id
}

// Upsert a title from a full TMDB detail object, caching the extra fields.
// Returns the local title row id.
export async function ensureTitleFromFull(full) {
  const { tmdb_id, media_type } = full
  const fields = {
    tmdb_id, media_type,
    title: full.title,
    year: full.year ?? null,
    poster_path: full.poster_path ?? null,
    overview: full.overview ?? null,
    genre: full.genre ?? null,
    total_episodes: full.total_episodes ?? null,
    backdrop_path: full.backdrop_path ?? null,
    runtime: full.runtime ?? null,
    tagline: full.tagline ?? null,
    vote_average: full.vote_average ?? null,
    imdb_id: full.imdb_id ?? null,
  }
  const { data: existing, error: selErr } = await supabase
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdb_id)
    .eq('media_type', media_type)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) {
    const { error } = await supabase.from('titles').update(fields).eq('id', existing.id)
    if (error) throw error
    return existing.id
  }
  const { data, error } = await supabase.from('titles').insert(fields).select('id').single()
  if (error) throw error
  return data.id
}

// ---------- Fast bulk import helpers ----------

// Upsert many titles at once (no per-title detail fetch); returns Map "media-tmdbId" -> title id.
// Preserves already-enriched rows (ignoreDuplicates), then fetches all ids.
export async function ensureTitlesBulk(seeds) {
  const uniq = new Map()
  for (const s of seeds) if (s?.tmdb_id) uniq.set(`${s.media_type}-${s.tmdb_id}`, s)
  const list = [...uniq.values()]
  const rows = list.map((s) => ({
    tmdb_id: s.tmdb_id, media_type: s.media_type, title: s.title,
    year: s.year ?? null, poster_path: s.poster_path ?? null, overview: s.overview ?? null,
  }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('titles')
      .upsert(rows.slice(i, i + 500), { onConflict: 'tmdb_id,media_type', ignoreDuplicates: true })
    if (error) throw error
  }
  const map = new Map()
  const tmdbIds = [...new Set(list.map((s) => s.tmdb_id))]
  for (let i = 0; i < tmdbIds.length; i += 500) {
    const { data, error } = await supabase.from('titles')
      .select('id, tmdb_id, media_type').in('tmdb_id', tmdbIds.slice(i, i + 500))
    if (error) throw error
    for (const r of data) map.set(`${r.media_type}-${r.tmdb_id}`, r.id)
  }
  return map
}

// Fill genre/runtime/rating/ids on titles that came in without them. Imports
// create bare title rows from search seeds (no genre), so genre-based features
// stay empty until a title's page is opened. Call this after a bulk import to
// enrich the new titles up front. Only fetches titles still missing genre, runs
// in small concurrent batches, and skips any title that fails so one bad TMDB
// lookup never blocks an import. Returns how many titles it filled.
export async function enrichTitlesDetail(titleIds) {
  const ids = [...new Set((titleIds || []).filter(Boolean))]
  if (!ids.length) return 0
  const need = []
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await supabase.from('titles')
      .select('id, tmdb_id, media_type, genre')
      .in('id', ids.slice(i, i + 500))
    for (const r of (data || [])) if (r.tmdb_id && (!r.genre || r.genre === '')) need.push(r)
  }
  let filled = 0
  for (let i = 0; i < need.length; i += 8) {
    await Promise.all(need.slice(i, i + 8).map(async (r) => {
      try {
        const d = await getTitleDetailLite(r.tmdb_id, r.media_type)
        const fields = {}
        if (d.genre) fields.genre = d.genre
        if (d.runtime) fields.runtime = d.runtime
        if (d.vote_average != null) fields.vote_average = d.vote_average
        if (d.imdb_id) fields.imdb_id = d.imdb_id
        if (d.backdrop_path) fields.backdrop_path = d.backdrop_path
        if (Object.keys(fields).length) {
          const { error } = await supabase.from('titles').update(fields).eq('id', r.id)
          if (!error) filled++
        }
      } catch { /* skip a title that fails; never block the import */ }
    }))
  }
  return filled
}
export async function insertWatchesBulk(rows) {
  const ids = []
  for (let i = 0; i < rows.length; i += 400) {
    const { data, error } = await supabase.from('watches').insert(rows.slice(i, i + 400)).select('id')
    if (error) throw error
    for (const r of data) ids.push(r.id)
  }
  return ids
}

export async function insertRatingsBulk(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('ratings').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

export async function insertWatchlistBulk(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    // Upsert + ignoreDuplicates so a title already on the list (any source) is
    // skipped at the DB level. A unique (group_id, title_id) constraint backs this.
    const { error } = await supabase.from('watchlist')
      .upsert(rows.slice(i, i + 500), { onConflict: 'group_id,title_id', ignoreDuplicates: true })
    if (error) throw error
  }
}

// ---------- Import history & revert ----------

// Snapshot of what a group already contains, so an import can compute an
// incremental diff (paginates past the 1000-row API cap).
export async function getGroupImportSnapshot(groupId, profileId = null) {
  async function fetchAll(table, cols) {
    const out = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select(cols).eq('group_id', groupId).range(from, from + 999)
      if (error) throw error
      out.push(...(data || []))
      if (!data || data.length < 1000) break
    }
    return out
  }
  const [w, e, wl] = await Promise.all([
    fetchAll('watches', 'id, title_id'),
    fetchAll('episode_watches', 'title_id, season_number, episode_number, rewatch_count'),
    fetchAll('watchlist', 'title_id'),
  ])
  const episodes = new Map()
  for (const r of e) episodes.set(`${r.title_id}-${r.season_number}-${r.episode_number}`, r.rewatch_count || 0)

  // The importing profile's existing ratings, keyed by title (for "rating changed" detection).
  const ratings = new Map()
  if (profileId) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('ratings')
        .select('watch_id, score, watches!inner(title_id, group_id)')
        .eq('profile_id', profileId).eq('watches.group_id', groupId).range(from, from + 999)
      if (error) throw error
      for (const r of (data || [])) ratings.set(r.watches.title_id, { watchId: r.watch_id, score: r.score })
      if (!data || data.length < 1000) break
    }
  }
  return {
    watches: new Set(w.map((r) => r.title_id)),
    // title_id -> an existing watch id, so an import can attach a rating to a
    // title you already logged (but never scored). Last watch per title wins.
    watchIds: new Map(w.map((r) => [r.title_id, r.id])),
    episodes,
    watchlist: new Set(wl.map((r) => r.title_id)),
    ratings,
  }
}

// Bump rewatch_count on episodes already logged (used by incremental imports).
export async function updateEpisodeRewatches(updates) {
  for (const u of updates) {
    const { error } = await supabase.from('episode_watches')
      .update({ rewatch_count: u.rewatchCount })
      .eq('title_id', u.titleId).eq('group_id', u.groupId)
      .eq('season_number', u.season).eq('episode_number', u.episode)
    if (error) throw error
  }
}

export async function createImportBatch({ id, ownerId, householdId = null, kind, groupId = null, profileId = null, filename = null, watches = 0, episodes = 0, watchlist = 0 }) {
  const { error } = await supabase.from('import_batches').insert({
    id, owner_id: ownerId, household_id: householdId, kind, group_id: groupId, profile_id: profileId,
    filename, watches_count: watches, episodes_count: episodes, watchlist_count: watchlist,
  })
  if (error) throw error
}

export async function listImportBatches() {
  const { data, error } = await supabase
    .from('import_batches')
    .select('id, kind, filename, watches_count, episodes_count, watchlist_count, created_at, groups:group_id(name, color), profiles:profile_id(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Clear an import from history WITHOUT deleting any data: unlink the rows it
// tagged, then drop the history record. Watches, episodes and ratings stay.
export async function dismissImportBatch(id) {
  await supabase.from('watches').update({ import_batch: null }).eq('import_batch', id)
  await supabase.from('episode_watches').update({ import_batch: null }).eq('import_batch', id)
  await supabase.from('watchlist').update({ import_batch: null }).eq('import_batch', id)
  const { error } = await supabase.from('import_batches').delete().eq('id', id)
  if (error) throw error
}

// Undo an import: remove every row it created (ratings cascade with watches).
export async function revertImportBatch(id) {
  // ratings have a FK to watches; delete them explicitly first to be safe
  const { data: ws } = await supabase.from('watches').select('id').eq('import_batch', id)
  const ids = (ws || []).map((w) => w.id)
  for (let i = 0; i < ids.length; i += 300) {
    await supabase.from('ratings').delete().in('watch_id', ids.slice(i, i + 300))
  }
  await supabase.from('watches').delete().eq('import_batch', id)
  await supabase.from('episode_watches').delete().eq('import_batch', id)
  await supabase.from('watchlist').delete().eq('import_batch', id)
  const { error } = await supabase.from('import_batches').delete().eq('id', id)
  if (error) throw error
}

// All logged watches for a title (with group + ratings), newest first.
export async function getWatchesForTitle(titleId) {
  const { data, error } = await supabase
    .from('watches')
    .select('id, watched_on, date_precision, note, episodes_watched, where_watched, service, group_id, tags, is_rewatch, rewatch_count, groups(id, name, color), ratings(id, profile_id, score)')
    .eq('title_id', titleId)
    .order('watched_on', { ascending: false })
  if (error) throw error
  return data
}

// ---------- Episode tracking (per-episode, per-group) ----------

export async function listEpisodeWatches(titleId, groupId) {
  let q = supabase
    .from('episode_watches')
    .select('id, season_number, episode_number, watched_on, rating, rewatch_count, where_watched, service')
    .eq('title_id', titleId)
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
  const { data, error } = await q
  if (error) throw error
  return data
}

// Tick the next N unwatched AIRED episodes for a show, in order. The
// "Mark watched" modal only wrote a diary row with an episode count, which left
// progress, Continue watching and the Completed state untouched (the app reads
// per-episode ticks, not that number). This makes the count actually mark
// episodes. Continues from where you are rather than restarting at S1E1, never
// ticks an unaired episode, and never overwrites an existing episode's date.
// Returns how many it ticked.
export async function markNextEpisodes({ titleId, tmdbId, groupId, count, watchedOn, createdBy, whereWatched, service }) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!n || !titleId || !tmdbId) return 0
  let aired = []
  try { aired = await getAiredEpisodeList(tmdbId) } catch { return 0 }
  if (!aired.length) return 0
  const seen = await listEpisodeWatches(titleId, groupId).catch(() => [])
  const done = new Set((seen || []).map((r) => `${r.season_number}-${r.episode_number}`))
  const next = aired.filter((e) => !done.has(`${e.season}-${e.episode}`)).slice(0, n)
  if (!next.length) return 0
  await markEpisodesBulk({
    titleId, groupId, createdBy,
    episodes: next.map((e) => ({
      season: e.season, episode: e.episode, watchedOn: watchedOn || null,
      whereWatched: whereWatched || null, service: service || null,
    })),
  })
  return next.length
}

// Set where/on what service one episode was watched. Upserts, so it works
// whether the episode is already ticked or is being ticked now. Passing an
// empty string clears that field; passing undefined leaves it alone.
export async function setEpisodeContext({ titleId, groupId, season, episode, whereWatched, service, watchedOn, createdBy }) {
  const row = {
    title_id: titleId, group_id: groupId,
    season_number: season, episode_number: episode,
    created_by: createdBy,
  }
  if (watchedOn !== undefined) row.watched_on = watchedOn || null
  if (whereWatched !== undefined) row.where_watched = whereWatched || null
  if (service !== undefined) row.service = service || null
  const { error } = await supabase.from('episode_watches').upsert(row, {
    onConflict: 'title_id,group_id,season_number,episode_number',
  })
  if (error) throw error
}

// Stamp where/service onto the episodes of a show you've already watched, so a
// backlog of ticks can be labelled in one go instead of episode by episode.
// Only touches episodes that are already ticked; pass a season to limit it.
// Returns how many rows were updated.
export async function setEpisodesContext({ titleId, groupId, season = null, whereWatched, service, onlyEmpty = false, createdBy }) {
  // The RLS policy's WITH CHECK requires the resulting row to be attributed to
  // the caller, so editing someone else's tick has to re-attribute it. Without
  // this the update is not an error, it just matches zero rows, which would
  // look like the button doing nothing.
  const attrib = createdBy ? { created_by: createdBy } : {}
  const base = (builder) => {
    let q = builder.eq('title_id', titleId)
    q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
    if (season != null) q = q.eq('season_number', season)
    return q
  }
  const touched = new Set()
  const run = async (patch, emptyCol) => {
    let q = base(supabase.from('episode_watches').update({ ...patch, ...attrib }))
    // "Only fill the blanks" mode is per field, so an episode that already has
    // a service but no device still gets its device filled in, and neither
    // field overwrites one you set deliberately.
    if (emptyCol) q = q.is(emptyCol, null)
    const { data, error } = await q.select('id')
    if (error) throw error
    for (const r of data || []) touched.add(r.id)
  }
  if (onlyEmpty) {
    if (service !== undefined) await run({ service: service || null }, 'service')
    if (whereWatched !== undefined) await run({ where_watched: whereWatched || null }, 'where_watched')
  } else {
    const patch = {}
    if (whereWatched !== undefined) patch.where_watched = whereWatched || null
    if (service !== undefined) patch.service = service || null
    if (!Object.keys(patch).length) return 0
    await run(patch, null)
  }
  return touched.size
}

// Rate a single episode (implies it's watched). Preserves an existing watched date.
export async function setEpisodeRating({ titleId, groupId, season, episode, rating, watchedOn, createdBy, whereWatched, service }) {
  let sel = supabase.from('episode_watches').select('id')
    .eq('title_id', titleId).eq('season_number', season).eq('episode_number', episode)
  sel = groupId ? sel.eq('group_id', groupId) : sel.is('group_id', null)
  const { data: existing } = await sel.maybeSingle()
  if (existing) {
    const { error } = await supabase.from('episode_watches').update({ rating }).eq('id', existing.id)
    if (error) throw error
    return
  }
  // Rating an unticked episode creates the row, so it carries the same stamp.
  const { error } = await supabase.from('episode_watches').insert({
    title_id: titleId, group_id: groupId, season_number: season, episode_number: episode,
    rating, watched_on: watchedOn || undefined, created_by: createdBy,
    ...(whereWatched ? { where_watched: whereWatched } : {}),
    ...(service ? { service } : {}),
  })
  if (error) throw error
}

// ---------- Per-season ratings (dual: one row per profile per season) ----------
export async function getSeasonRatings(titleId, groupId) {
  let q = supabase.from('season_ratings').select('season_number, profile_id, score').eq('title_id', titleId)
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function setSeasonRating({ titleId, groupId, profileId, season, score, createdBy }) {
  if (score == null) {
    let del = supabase.from('season_ratings').delete()
      .eq('title_id', titleId).eq('profile_id', profileId).eq('season_number', season)
    del = groupId ? del.eq('group_id', groupId) : del.is('group_id', null)
    const { error } = await del
    if (error) throw error
    return
  }
  const { error } = await supabase.from('season_ratings').upsert(
    { title_id: titleId, group_id: groupId, profile_id: profileId, season_number: season, score, created_by: createdBy },
    { onConflict: 'title_id,group_id,profile_id,season_number' },
  )
  if (error) throw error
}

// All season ratings across the household, with title + profile, for analytics.
export async function listAllSeasonRatings() {
  return pagedSelect('season_ratings',
    'id, season_number, score, profile_id, titles(id, tmdb_id, title, media_type, poster_path), profiles(name, color)',
    { limit: 100000, order: (q) => q.order('id', { ascending: true }) })
}

export async function markEpisode({ titleId, groupId, season, episode, watchedOn, createdBy, whereWatched, service }) {
  const { error } = await supabase.from('episode_watches').upsert(
    {
      title_id: titleId, group_id: groupId,
      season_number: season, episode_number: episode,
      watched_on: watchedOn || undefined, created_by: createdBy,
      ...(whereWatched !== undefined ? { where_watched: whereWatched || null } : {}),
      ...(service !== undefined ? { service: service || null } : {}),
    },
    { onConflict: 'title_id,group_id,season_number,episode_number' }
  )
  if (error) throw error
  // Starting a show means it is no longer "to watch": drop it from that list.
  await removeFromWantList(titleId, groupId)
  // Marking a new episode = resuming, so undo any "stopped tracking" flag.
  try { await supabase.from('dropped_shows').delete().eq('title_id', titleId).eq('group_id', groupId) } catch { /* non-fatal */ }
}

// Set (or clear) the watched date on an episode. Upserts so it works whether
// the episode was already marked or is being marked for the first time; passing
// an empty date keeps it watched but with no date.
export async function setEpisodeWatchedDate({ titleId, groupId, season, episode, watchedOn, createdBy, whereWatched, service }) {
  const { error } = await supabase.from('episode_watches').upsert(
    {
      title_id: titleId, group_id: groupId,
      season_number: season, episode_number: episode,
      watched_on: watchedOn || null, created_by: createdBy,
      // Setting a date on an untracked episode creates the row, so it needs the
      // same where/service stamp a plain tick gets. Only sent when there is one
      // to send, so this never clears a label on an existing row.
      ...(whereWatched ? { where_watched: whereWatched } : {}),
      ...(service ? { service } : {}),
    },
    { onConflict: 'title_id,group_id,season_number,episode_number' }
  )
  if (error) throw error
}

export async function unmarkEpisode({ titleId, groupId, season, episode }) {
  let q = supabase
    .from('episode_watches')
    .delete()
    .eq('title_id', titleId)
    .eq('season_number', season)
    .eq('episode_number', episode)
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
  const { error } = await q
  if (error) throw error
}

export async function unmarkAllEpisodes({ titleId, groupId }) {
  let q = supabase.from('episode_watches').delete().eq('title_id', titleId)
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
  const { error } = await q
  if (error) throw error
}

// Bulk upsert episode watches, each with its own watched date (for imports).
export async function markEpisodesBulk({ titleId, groupId, episodes, createdBy, importBatch = null }) {
  const rows = episodes.map((e) => ({
    title_id: titleId, group_id: groupId,
    season_number: e.season, episode_number: e.episode,
    watched_on: e.watchedOn || null, created_by: createdBy, import_batch: importBatch,
    rewatch_count: e.rewatchCount || 0,
    ...(e.rating != null ? { rating: e.rating } : {}),
    ...(e.whereWatched ? { where_watched: e.whereWatched } : {}),
    ...(e.service ? { service: e.service } : {}),
  }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from('episode_watches')
      // ignoreDuplicates: only add episodes that aren't logged yet - never
      // overwrite an existing episode's real watched date or rating.
      .upsert(rows.slice(i, i + 500), { onConflict: 'title_id,group_id,season_number,episode_number', ignoreDuplicates: true })
    if (error) throw error
  }
}

export async function markSeason({ titleId, groupId, season, episodes, watchedOn, createdBy, whereWatched, service }) {
  const rows = episodes.map((ep) => ({
    title_id: titleId, group_id: groupId, season_number: season,
    episode_number: ep, watched_on: watchedOn || undefined, created_by: createdBy,
    ...(whereWatched ? { where_watched: whereWatched } : {}),
    ...(service ? { service } : {}),
  }))
  if (!rows.length) return
  const { error } = await supabase
    .from('episode_watches')
    // Only fill in episodes not already logged; keep existing dates/ratings.
    .upsert(rows, { onConflict: 'title_id,group_id,season_number,episode_number', ignoreDuplicates: true })
  if (error) throw error
}

// Shows with episodes ticked off but not yet complete - for "Continue watching".
// Distinct watched episodes + last-watched date per TV show, aggregated across
// all groups. Pages through episode_watches (PostgREST caps at 1000/response,
// and the library now runs to 10k+ rows) using minimal columns, then batch-loads
// the titles so we never join titles(*) across every episode row.
// In-progress shows, split per GROUP so "Continue watching" can tell your solo
// list apart from a shared one (a show can be in progress in one group and
// finished in another). Each entry carries its group so the UI can label/filter.
export async function listInProgressShows() {
  // Aggregated in the DB (see the in_progress_shows() function) so we transfer
  // ~200 rows instead of every episode watch. Split per (show, group).
  const { data, error } = await supabase.rpc('in_progress_shows')
  if (error) throw error
  return (data || [])
    .map((r) => ({
      title: { id: r.title_id, tmdb_id: r.tmdb_id, media_type: r.media_type, title: r.title, poster_path: r.poster_path, year: r.year, total_episodes: r.total_episodes },
      group: r.group_id ? { id: r.group_id, name: r.group_name, color: r.group_color } : null,
      groupId: r.group_id,
      watched: r.watched,
      total: r.total_episodes || 0,
      last: r.last_watched,
      // Other lists you've logged this title in, so a card can offer "watching
      // this with <list>". Shape: [{ group_id, name, color, watched }].
      altGroups: Array.isArray(r.alt_groups) ? r.alt_groups : [],
    }))
    .sort((a, b) => (b.last || '').localeCompare(a.last || ''))
}

// Pin which list a show belongs to in Continue watching (its "home"). This is a
// display choice only: no episodes move between lists, so per-list watch counts
// and stats are untouched. One home per title; clearShowHome reverts to the
// automatic "most recently watched list wins" behaviour.
export async function setShowHome(titleId, groupId, createdBy) {
  const { error } = await supabase.from('show_home')
    .upsert({ title_id: titleId, group_id: groupId, created_by: createdBy }, { onConflict: 'title_id' })
  if (error) throw error
}

export async function clearShowHome(titleId) {
  const { error } = await supabase.from('show_home').delete().eq('title_id', titleId)
  if (error) throw error
}

// Stop tracking a show in a group: it drops off Continue Watching but its
// episode history is kept. Reversible (restoreShow, or just mark a new episode).
export async function dropShow(titleId, groupId, createdBy) {
  const { error } = await supabase.from('dropped_shows')
    .upsert({ title_id: titleId, group_id: groupId, created_by: createdBy }, { onConflict: 'group_id,title_id' })
  if (error) throw error
}

export async function restoreShow(titleId, groupId) {
  const { error } = await supabase.from('dropped_shows').delete().eq('title_id', titleId).eq('group_id', groupId)
  if (error) throw error
}

// Shows you've stopped tracking (per group). Same shape as listInProgressShows
// so the "Stopped tracking" list can render like Continue watching.
export async function listDroppedShows() {
  const { data, error } = await supabase.rpc('dropped_shows_detail')
  if (error) throw error
  return (data || [])
    .map((r) => ({
      title: { id: r.title_id, tmdb_id: r.tmdb_id, media_type: r.media_type, title: r.title, poster_path: r.poster_path, year: r.year, total_episodes: r.total_episodes },
      group: r.group_id ? { id: r.group_id, name: r.group_name, color: r.group_color } : null,
      groupId: r.group_id,
      watched: r.watched,
      total: r.total_episodes || 0,
      last: r.last_watched,
      droppedOn: r.dropped_on,
    }))
}

// All TV shows you've ticked episodes for (watched count + cached total).
export async function listTrackedShows() {
  // Aggregated in the DB (tracked_shows()) so we transfer ~one row per show
  // instead of every episode watch. Fetching the whole watch history and
  // counting client-side was the main reason this was slow to load on mobile.
  const { data, error } = await supabase.rpc('tracked_shows')
  if (error) throw error
  return (data || []).map((r) => ({
    title: {
      id: r.title_id, tmdb_id: r.tmdb_id, media_type: r.media_type,
      title: r.title, poster_path: r.poster_path, year: r.year, total_episodes: r.total_episodes,
    },
    watched: r.watched,
    cachedTotal: r.total_episodes || 0,
    last: r.last_watched,
  }))
}

// Distinct episodes watched + first/last watched date for one title (across the
// user's groups). Used for the "you started / last watched" line on TV headers.
export async function getEpisodeWatchSpan(titleId) {
  const { data, error } = await supabase.from('episode_watches')
    .select('season_number, episode_number, watched_on, group_id, groups(name, color)').eq('title_id', titleId)
  if (error) throw error
  const eps = new Set(); const dated = []
  const byGroup = new Map()   // which group(s) watched this show
  for (const r of data || []) {
    eps.add(`${r.season_number}-${r.episode_number}`)
    if (r.watched_on) dated.push(r.watched_on)
    if (!byGroup.has(r.group_id)) byGroup.set(r.group_id, { id: r.group_id, name: r.groups?.name, color: r.groups?.color, eps: new Set() })
    byGroup.get(r.group_id).eps.add(`${r.season_number}-${r.episode_number}`)
  }
  dated.sort()
  const groups = [...byGroup.values()].map((g) => ({ id: g.id, name: g.name, color: g.color, count: g.eps.size })).sort((a, b) => b.count - a.count)
  return { count: eps.size, first: dated[0] || null, last: dated[dated.length - 1] || null, groups }
}

export async function setTitleTotalEpisodes(titleId, total) {
  const { error } = await supabase.from('titles').update({ total_episodes: total }).eq('id', titleId)
  if (error) throw error
}

export async function getTitle(id) {
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---------- Groups ----------

export async function listGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, color, owner_id, created_at, group_members(id, profile_id, member_name)')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createGroup({ name, color, ownerId, memberNames = [] }) {
  // Attach the group to the creator's household so the whole household sees it.
  const { data: hm } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('profile_id', ownerId)
    .limit(1)
    .maybeSingle()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, color: color || undefined, owner_id: ownerId, household_id: hm?.household_id || null })
    .select('id')
    .single()
  if (error) throw error
  if (memberNames.length) {
    const rows = memberNames
      .filter((n) => n.trim())
      .map((member_name) => ({ group_id: group.id, member_name: member_name.trim() }))
    if (rows.length) {
      const { error: mErr } = await supabase.from('group_members').insert(rows)
      if (mErr) throw mErr
    }
  }
  return group.id
}

export async function addProfileToGroup(groupId, profileId) {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, profile_id: profileId })
  if (error) throw error
}

export async function deleteGroup(groupId) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
}

// ---------- Watchlist ----------

export async function listWatchlist(groupId = null, limit = 100000) {
  // The "to watch" list only (unseen). Rewatch items live under list_type 'rewatch'.
  // Paginated so a watchlist over 1000 rows isn't silently truncated.
  return pagedSelect('watchlist', 'id, group_id, added_by, created_at, list_type, titles(*), groups(id, name, color)', {
    groupId, limit,
    order: (q) => q.eq('list_type', 'want').order('created_at', { ascending: false }).order('id', { ascending: true }),
  })
}

// The rewatch list: titles you've seen and want to watch again (per group).
export async function listRewatchlist(groupId = null, limit = 100000) {
  return pagedSelect('watchlist', 'id, group_id, added_by, created_at, list_type, titles(*), groups(id, name, color)', {
    groupId, limit,
    order: (q) => q.eq('list_type', 'rewatch').order('created_at', { ascending: false }).order('id', { ascending: true }),
  })
}

// Add a title to a group's rewatch list. A title lives in exactly one list per
// group, so if it was on the "to watch" list this moves it to rewatch.
export async function addToRewatchlist({ seed, titleId, groupId, addedBy }) {
  const tId = titleId || (await ensureTitle(seed))
  const { data, error } = await supabase
    .from('watchlist')
    .upsert({ title_id: tId, group_id: groupId, added_by: addedBy, list_type: 'rewatch' }, { onConflict: 'group_id,title_id' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// When something is logged as watched, drop it from that group's "to watch"
// list (it is no longer unseen). Rewatch-list rows are left untouched.
async function removeFromWantList(titleId, groupId) {
  if (!titleId || !groupId) return
  try {
    await supabase.from('watchlist').delete()
      .eq('title_id', titleId).eq('group_id', groupId).eq('list_type', 'want')
  } catch { /* non-fatal: never block a watch on watchlist cleanup */ }
}

// Accepts either a resolved titleId (from the title page) or a search `seed`
// to create the title from (QuickAdd / Browse). A title lives once per group.
export async function addToWatchlist({ seed, titleId, groupId, addedBy }) {
  const tId = titleId || (await ensureTitle(seed))
  // Avoid duplicates for the same group.
  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('title_id', tId)
    .eq('group_id', groupId)
    .maybeSingle()
  if (existing) return existing.id
  const { data, error } = await supabase
    .from('watchlist')
    .insert({ title_id: tId, group_id: groupId, added_by: addedBy })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function removeFromWatchlist(id) {
  const { error } = await supabase.from('watchlist').delete().eq('id', id)
  if (error) throw error
}

// Which of your lists (per group) this title is already on, so a title page can
// show its current state instead of a blank "Add to list". Shape:
// [{ id, groupId, listType: 'want'|'rewatch', group: { id, name, color } }].
export async function getTitleListMembership(titleId) {
  if (!titleId) return []
  const { data, error } = await supabase
    .from('watchlist')
    .select('id, group_id, list_type, groups(id, name, color)')
    .eq('title_id', titleId)
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.id, groupId: r.group_id, listType: r.list_type,
    group: r.groups ? { id: r.groups.id, name: r.groups.name, color: r.groups.color } : null,
  }))
}

// Set (or clear) this title's list membership for one group in a single call.
// listType 'want' or 'rewatch' adds or switches; null removes. A title lives in
// exactly one list per group, so the upsert moves it between the two.
export async function setTitleList({ titleId, groupId, listType, addedBy }) {
  if (!listType) {
    const { error } = await supabase.from('watchlist').delete()
      .eq('title_id', titleId).eq('group_id', groupId)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('watchlist')
    .upsert({ title_id: titleId, group_id: groupId, added_by: addedBy, list_type: listType },
      { onConflict: 'group_id,title_id' })
  if (error) throw error
}

// Copy an existing title into another group's watchlist. No-op (returns the
// existing row id) if that group already has it, so it is safe to run in bulk.
export async function copyWatchlistToGroup(titleId, targetGroupId, addedBy) {
  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('title_id', titleId)
    .eq('group_id', targetGroupId)
    .maybeSingle()
  if (existing) return { id: existing.id, created: false }
  const { data, error } = await supabase
    .from('watchlist')
    .insert({ title_id: titleId, group_id: targetGroupId, added_by: addedBy })
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id, created: true }
}

// Move a single watchlist row to another group: copy across, then drop the
// original. If the target already has the title we still drop the original.
export async function moveWatchlistItem(watchlistId, titleId, targetGroupId, addedBy) {
  await copyWatchlistToGroup(titleId, targetGroupId, addedBy)
  await removeFromWatchlist(watchlistId)
}

// Bulk copy/move a whole group's watchlist into another group. Returns a
// breakdown so the UI can report exactly what happened.
export async function mergeWatchlists(sourceGroupId, targetGroupId, addedBy, { move = false } = {}) {
  if (sourceGroupId === targetGroupId) return { copied: 0, skipped: 0, removed: 0 }
  const src = await listWatchlist(sourceGroupId)
  let copied = 0, skipped = 0
  for (const it of src) {
    const tid = it.titles?.id
    if (!tid) continue
    const { created } = await copyWatchlistToGroup(tid, targetGroupId, addedBy)
    created ? copied++ : skipped++
  }
  let removed = 0
  if (move) {
    for (const it of src) { await removeFromWatchlist(it.id); removed++ }
  }
  return { copied, skipped, removed }
}

// ---------- Friends / social ----------

export async function sendFriendRequest(email) {
  const { data, error } = await supabase.rpc('send_friend_request', { target_email: email })
  if (error) throw error
  return data // 'ok' | 'not_found' | 'self' | 'no_household'
}
export async function listFriends() {
  const { data, error } = await supabase.rpc('my_friends')
  if (error) throw error
  return data || []
}
export async function acceptFriend(friendshipId) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
  if (error) throw error
}
export async function removeFriend(friendshipId) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}
export async function friendFeed() {
  const { data, error } = await supabase.rpc('friend_feed', { limit_n: 60 })
  if (error) throw error
  return data || []
}

// ---------- Watches + Ratings (the "Mark as Watched" + dual-rating core) ----------

// Create a watch and its ratings in one go.
// ratings: { [profileId]: score|null }
export async function markWatched({
  seed,
  titleId,
  groupId,
  watchedOn,
  note,
  episodesWatched = 0,
  createdBy,
  ratings = {},
  visibility = 'private',
  whereWatched = null,
  service = null,
  noDate = false,
  datePrecision = 'day',
  tags = [],
  isRewatch = false,
}) {
  const tId = titleId || (await ensureTitle(seed))
  const { data: watch, error } = await supabase
    .from('watches')
    .insert({
      title_id: tId,
      group_id: groupId,
      // noDate => "don't remember" => store null (column is nullable)
      watched_on: noDate ? null : (watchedOn || undefined),
      date_precision: noDate ? null : datePrecision,
      note: note || null,
      episodes_watched: episodesWatched || 0,
      created_by: createdBy,
      visibility,
      where_watched: whereWatched || null,
      service: service || null,
      tags: tags || [],
      is_rewatch: !!isRewatch,
    })
    .select('id')
    .single()
  if (error) throw error

  const ratingRows = Object.entries(ratings)
    .filter(([, score]) => score != null && score !== '')
    .map(([profile_id, score]) => ({
      watch_id: watch.id,
      profile_id,
      score: Number(score),
    }))
  if (ratingRows.length) {
    const { error: rErr } = await supabase.from('ratings').insert(ratingRows)
    if (rErr) throw rErr
  }
  await removeFromWantList(tId, groupId)
  return watch.id
}

// Diary = all watches, newest first, with title + group + ratings.
export async function listDiary({ groupId = null, limit = 200 } = {}) {
  const cols = 'id, watched_on, date_precision, note, episodes_watched, where_watched, service, visibility, group_id, created_by, created_at, tags, is_rewatch, rewatch_count, ' +
    'titles(*), groups(id, name, color), ratings(id, profile_id, score)'
  // PostgREST caps any single response at 1000 rows, so page through with
  // .range() up to `limit`. A stable id tiebreaker is required because bulk
  // imports share watched_on/created_at, which would otherwise let rows shift
  // between pages (causing duplicates or gaps).
  return pagedSelect('watches', cols, {
    groupId, limit,
    order: (q) => q.order('watched_on', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: true }),
  })
}

// Page through a table with .range() until `limit` rows (or the data) run out.
async function pagedSelect(table, cols, { groupId = null, limit = 1000, order }) {
  const PAGE = 1000
  const out = []
  for (let from = 0; from < limit; from += PAGE) {
    const to = Math.min(from + PAGE, limit) - 1
    let q = supabase.from(table).select(cols)
    q = order(q)
    q = q.range(from, to)
    if (groupId) q = q.eq('group_id', groupId)
    const { data, error } = await q
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < (to - from + 1)) break
  }
  return out
}

// Episode-level diary: individual episode watches, newest first, with title + group.
export async function listEpisodeDiary({ groupId = null, limit = 400 } = {}) {
  const cols = 'id, season_number, episode_number, watched_on, rating, rewatch_count, created_at, created_by, group_id, ' +
    'where_watched, service, ' +
    'titles(id, tmdb_id, title, media_type, poster_path, year, runtime), groups(id, name, color)'
  return pagedSelect('episode_watches', cols, {
    groupId, limit,
    order: (q) => q.order('watched_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).order('id', { ascending: true }),
  })
}

export async function updateWatch(id, fields) {
  const { error } = await supabase.from('watches').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteWatch(id) {
  const { error } = await supabase.from('watches').delete().eq('id', id)
  if (error) throw error
}

// Upsert a single person's rating on a watch.
export async function setRating(watchId, profileId, score) {
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('watch_id', watchId)
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existing) {
    const { error } = await supabase
      .from('ratings')
      .update({ score })
      .eq('id', existing.id)
    if (error) throw error
    return existing.id
  }
  const { data, error } = await supabase
    .from('ratings')
    .insert({ watch_id: watchId, profile_id: profileId, score })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// ---------- Notification sync (cross-device) ----------
// Per-user state so baselines, dismissals and read-status follow you across
// phones/laptops instead of living only in this browser's localStorage.

export async function loadNotifState() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('notif_state')
      .select('title_id, baseline_aired, dismissed')
      .eq('user_id', user.id)
      .order('title_id', { ascending: true })
      .range(from, from + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

// Upsert one title's state. baseline/dismissed are optional (only set what changed).
export async function saveNotifState({ titleId, baselineAired, dismissed }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const row = { user_id: user.id, title_id: titleId, updated_at: new Date().toISOString() }
  if (baselineAired != null) row.baseline_aired = baselineAired
  if (dismissed != null) row.dismissed = dismissed
  const { error } = await supabase
    .from('notif_state')
    .upsert(row, { onConflict: 'user_id,title_id' })
  if (error) throw error
}

// Bulk upsert many baselines at once (used when seeding new shows).
export async function saveNotifBaselines(map) {
  const entries = Object.entries(map || {})
  if (!entries.length) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const now = new Date().toISOString()
  const rows = entries.map(([titleId, baseline]) => ({
    user_id: user.id, title_id: titleId, baseline_aired: baseline, updated_at: now,
  }))
  const { error } = await supabase
    .from('notif_state')
    .upsert(rows, { onConflict: 'user_id,title_id', ignoreDuplicates: false })
  if (error) throw error
}

// ---------- Ongoing shows ----------
// Shows you dip in and out of and never intend to finish (wrestling, Pokémon,
// chat shows). They carry no backlog and send no notifications.
export async function listOngoingShows() {
  const { data, error } = await supabase.rpc('ongoing_shows_list')
  if (error) throw error
  return (data || []).map((r) => ({
    title: {
      id: r.title_id, tmdb_id: r.tmdb_id, media_type: 'tv',
      title: r.title, poster_path: r.poster_path, year: r.year, total_episodes: r.total_episodes,
    },
    watched: r.watched || 0,
    last: r.last_watched,
  }))
}

export async function isOngoing(titleId) {
  if (!titleId) return false
  const { data, error } = await supabase.rpc('is_ongoing', { p_title: titleId })
  if (error) return false
  return !!data
}

export async function setOngoing(titleId, on, userId) {
  if (!titleId) return
  if (!on) {
    const { error } = await supabase.from('ongoing_shows').delete().eq('title_id', titleId)
    if (error) throw error
    return
  }
  // The marker is per household, so find the caller's one first.
  const { data: hm } = await supabase
    .from('household_members').select('household_id').eq('profile_id', userId).limit(1).maybeSingle()
  if (!hm?.household_id) throw new Error('No household yet')
  const { error } = await supabase.from('ongoing_shows')
    .upsert({ title_id: titleId, household_id: hm.household_id, created_by: userId },
            { onConflict: 'title_id,household_id' })
  if (error) throw error
}

// Bulk upsert several titles' notification state in one request. "Mark all read"
// used to fire one request per show, which was fine while the page only looked
// at 60 shows and is not now that it looks at all of them.
export async function saveNotifStates(items) {
  const list = (items || []).filter((r) => r && r.titleId)
  if (!list.length) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const now = new Date().toISOString()
  const rows = list.map((r) => {
    const row = { user_id: user.id, title_id: r.titleId, updated_at: now }
    if (r.baselineAired != null) row.baseline_aired = r.baselineAired
    if (r.dismissed != null) row.dismissed = r.dismissed
    return row
  })
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('notif_state')
      .upsert(rows.slice(i, i + 500), { onConflict: 'user_id,title_id', ignoreDuplicates: false })
    if (error) throw error
  }
}

// Set of TMDB ids the household has logged (watched or watchlisted) - used to
// badge titles you've seen on person / discovery pages.
export async function getLoggedTmdbIds() {
  const order = (q) => q.order('id', { ascending: true })
  const [w, wl] = await Promise.all([
    pagedSelect('watches', 'id, titles(tmdb_id)', { limit: 100000, order }),
    pagedSelect('watchlist', 'id, titles(tmdb_id)', { limit: 100000, order }),
  ])
  const set = new Set()
  for (const r of w) if (r.titles?.tmdb_id) set.add(r.titles.tmdb_id)
  for (const r of wl) if (r.titles?.tmdb_id) set.add(r.titles.tmdb_id)
  return set
}

// The whole library in one JSON row: watched ids, watchlisted ids, and which
// groups watched what. One row, so PostgREST's 1000-row response cap cannot
// truncate it, which it was doing to the old row-per-title versions. About
// 85KB. Concurrent callers share one request; the next call refetches.
let snapInFlight = null
function librarySnapshot() {
  if (snapInFlight) return snapInFlight
  snapInFlight = supabase.rpc('library_snapshot')
    .then(({ data, error }) => { if (error) throw error; return data || {} })
    .finally(() => { snapInFlight = null })
  return snapInFlight
}

// Library TMDB ids split into watched vs watchlisted, so a person page can flag
// which of their credits you've seen.
export async function getLibraryTmdbIds() {
  const s = await librarySnapshot()
  return { watched: new Set(s.watched || []), watchlist: new Set(s.watchlisted || []) }
}

// tmdb_id -> Set(group_id) for everything watched, so a list can report whose
// progress it is (yours alone, yours together, anyone's) instead of just
// "somebody in the household saw this".
export async function getLibraryGroupMap() {
  const s = await librarySnapshot()
  const m = new Map()
  for (const [tmdbId, groupIds] of Object.entries(s.groups || {})) {
    m.set(Number(tmdbId), new Set(groupIds || []))
  }
  return m
}

// ---------- Where to watch (manual override + live API) ----------

export async function getTitleServices(titleId) {
  const { data } = await supabase.from('title_services').select('services').eq('title_id', titleId).limit(1).maybeSingle()
  return data?.services || []
}

export async function setTitleServices(titleId, services, profileId) {
  const { data: hm } = await supabase
    .from('household_members').select('household_id').eq('profile_id', profileId).limit(1).maybeSingle()
  if (!hm?.household_id) throw new Error('No household yet')
  const { error } = await supabase.from('title_services').upsert(
    { title_id: titleId, household_id: hm.household_id, services, updated_by: profileId, updated_at: new Date().toISOString() },
    { onConflict: 'title_id,household_id' })
  if (error) throw error
}

// Live streaming availability via the `streaming` edge function (Movie of the Night).
export async function getStreamingAvailability({ tmdbId, mediaType, imdbId, country }) {
  try {
    const { data, error } = await supabase.functions.invoke('streaming', { body: { tmdbId, mediaType, imdbId, country } })
    if (error) return { ok: false }
    return data
  } catch { return { ok: false } }
}

// ---------- IMDb ratings (via OMDb, proxied + cached server-side) ----------

export async function getImdbRating(imdbId) {
  if (!imdbId) return null
  try {
    const { data, error } = await supabase.functions.invoke('imdb', { body: { type: 'title', imdbId } })
    if (error || !data?.ok) return null
    return { rating: data.rating, votes: data.votes }
  } catch { return null }
}

export async function getImdbSeasonRatings(imdbId, season) {
  if (!imdbId) return {}
  try {
    const { data, error } = await supabase.functions.invoke('imdb', { body: { type: 'season', imdbId, season } })
    if (error || !data?.ok) return {}
    return data.episodes || {}
  } catch { return {} }
}

// Trivia (spoiler-free + spoiler) for a title, from the imdb-extras function.
export async function getTitleTrivia(imdbId) {
  if (!imdbId) return { unspoilt: [], spoilt: [] }
  try {
    const { data, error } = await supabase.functions.invoke('imdb-extras', { body: { type: 'trivia', imdbId } })
    if (error || !data?.ok) return { unspoilt: [], spoilt: [] }
    return { unspoilt: data.unspoilt || [], spoilt: data.spoilt || [] }
  } catch { return { unspoilt: [], spoilt: [] } }
}

// Memorable quotes (dialogue) for a title.
export async function getTitleQuotes(imdbId) {
  if (!imdbId) return []
  try {
    const { data, error } = await supabase.functions.invoke('imdb-extras', { body: { type: 'quotes', imdbId } })
    if (error || !data?.ok) return []
    return data.quotes || []
  } catch { return [] }
}

// "Fans also like" recommendations (TasteDive, resolved to TMDB titles).
export async function getSimilarByTaste(title, mediaType) {
  if (!title) return []
  try {
    const { data, error } = await supabase.functions.invoke('tastedive', { body: { title, mediaType } })
    if (error || !data?.ok) return []
    return data.items || []
  } catch { return [] }
}

// ---------- Public profile sharing ----------

export async function getMyShare(profileId) {
  const { data, error } = await supabase
    .from('share_profiles').select('token, enabled').eq('profile_id', profileId).maybeSingle()
  if (error) throw error
  return data
}

// Enable sharing (creating a token if needed) or disable it.
export async function setShareEnabled({ profileId, enabled, token }) {
  const row = { profile_id: profileId, enabled }
  if (token) row.token = token
  const { error } = await supabase.from('share_profiles').upsert(row, { onConflict: 'profile_id' })
  if (error) throw error
}

// Public, unauthenticated read of a shared profile (via security-definer RPC).
export async function getPublicProfile(token) {
  const { data, error } = await supabase.rpc('public_profile', { p_token: token })
  if (error) throw error
  return data
}

// ---------- Profile favourites (Top 4) ----------

export async function listFavorites(profileId = null) {
  let q = supabase
    .from('favorites')
    .select('id, profile_id, position, titles(*)')
    .order('position', { ascending: true })
  if (profileId) q = q.eq('profile_id', profileId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function addFavorite({ profileId, seed, titleId }) {
  const tId = titleId || (await ensureTitle(seed))
  const { count } = await supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('profile_id', profileId)
  const { error } = await supabase.from('favorites')
    .upsert({ profile_id: profileId, title_id: tId, position: count || 0 }, { onConflict: 'profile_id,title_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function removeFavorite(id) {
  const { error } = await supabase.from('favorites').delete().eq('id', id)
  if (error) throw error
}

export async function reorderFavorites(orderedIds) {
  await Promise.all(orderedIds.map((id, i) => supabase.from('favorites').update({ position: i }).eq('id', id)))
}

// ---------- Subscriptions (cost tracker) ----------

export async function listSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, name, cost, currency, cycle, active, note, category, plan, paid_by, provider, renews_on, auto_renew, price_after_trial, contract_end, term_months, payment_method, parent_id, owner_id, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

const FREE_CYCLES = ['free', 'trial', 'tier', 'bundle']
export async function createSubscription({ name, cost, currency, cycle, note, category, plan, paidBy, provider, renewsOn, autoRenew, priceAfterTrial, contractEnd, termMonths, paymentMethod, parentId, ownerId }) {
  const { data: hm } = await supabase
    .from('household_members').select('household_id').eq('profile_id', ownerId).limit(1).maybeSingle()
  const isFree = FREE_CYCLES.includes(cycle)
  const { error } = await supabase.from('subscriptions').insert({
    name, cost: isFree ? 0 : Number(cost) || 0, currency: currency || 'USD', cycle: cycle || 'monthly',
    note: note || null, category: category || null, plan: plan || null,
    paid_by: paidBy || null, provider: provider || null, renews_on: renewsOn || null,
    auto_renew: autoRenew !== false,
    price_after_trial: priceAfterTrial ? Number(priceAfterTrial) : null,
    contract_end: contractEnd || null, term_months: termMonths ? Number(termMonths) : null,
    payment_method: paymentMethod || null, parent_id: parentId || null,
    owner_id: ownerId, household_id: hm?.household_id || null,
  })
  if (error) throw error
}

export async function updateSubscription(id, fields) {
  const { error } = await supabase.from('subscriptions').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteSubscription(id) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) throw error
}

// ---------- Custom lists (collections) ----------

export async function listCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description, emoji, ranked, owner_id, created_at, collection_items(position, titles(tmdb_id, poster_path))')
    .order('created_at', { ascending: false })
  if (error) throw error
  // Carry the TMDB ids so the index can show how far through each list you are
  // without a second round trip per card.
  return (data || []).map((c) => {
    const items = [...(c.collection_items || [])].sort((a, b) => (a.position || 0) - (b.position || 0))
    return {
      ...c,
      item_count: items.length,
      tmdb_ids: items.map((i) => i.titles?.tmdb_id).filter((x) => x != null),
      // First few posters, for the fan on the card.
      posters: items.map((i) => i.titles?.poster_path).filter(Boolean).slice(0, 4),
    }
  })
}

export async function getCollection(id) {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description, emoji, ranked, owner_id, created_at, ' +
      'collection_items(id, position, note, added_at, titles(*))')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  data.items = (data.collection_items || []).sort((a, b) => a.position - b.position || a.added_at.localeCompare(b.added_at))
  return data
}

export async function createCollection({ name, description, emoji, ranked, ownerId }) {
  const { data: hm } = await supabase
    .from('household_members').select('household_id').eq('profile_id', ownerId).limit(1).maybeSingle()
  const { data, error } = await supabase
    .from('collections')
    .insert({ name, description: description || null, emoji: emoji || null, ranked: !!ranked, owner_id: ownerId, household_id: hm?.household_id || null })
    .select('id').single()
  if (error) throw error
  return data.id
}

export async function updateCollection(id, fields) {
  const { error } = await supabase.from('collections').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteCollection(id) {
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) throw error
}

// Add a title (by TMDB seed) to a collection, appended at the end.
export async function addToCollection({ collectionId, seed, titleId, note }) {
  const tId = titleId || (await ensureTitle(seed))
  const { data: last } = await supabase
    .from('collection_items').select('position').eq('collection_id', collectionId)
    .order('position', { ascending: false }).limit(1).maybeSingle()
  const position = (last?.position ?? -1) + 1
  const { error } = await supabase
    .from('collection_items')
    .upsert({ collection_id: collectionId, title_id: tId, position, note: note || null }, { onConflict: 'collection_id,title_id', ignoreDuplicates: true })
  if (error) throw error
  return tId
}

export async function removeFromCollection(itemId) {
  const { error } = await supabase.from('collection_items').delete().eq('id', itemId)
  if (error) throw error
}

// Persist a new ordering: array of item ids in desired order.
export async function reorderCollection(orderedIds) {
  await Promise.all(orderedIds.map((id, i) =>
    supabase.from('collection_items').update({ position: i }).eq('id', id)))
}

// ---------- Native restore for lists / favourites / subscriptions ----------

// Restore Top-4 favourites (skips ones already set). rows: [{profileId, titleId, position}]
export async function restoreFavouritesBulk(rows) {
  for (const r of rows) {
    if (!r.profileId || !r.titleId) continue
    const { error } = await supabase.from('favorites')
      .upsert({ profile_id: r.profileId, title_id: r.titleId, position: r.position ?? 0 }, { onConflict: 'profile_id,title_id', ignoreDuplicates: true })
    if (error) throw error
  }
  return rows.length
}

// Restore subscriptions, skipping any whose name already exists (re-owned to the
// importing user). rows: the raw subscription objects from the backup.
export async function restoreSubscriptions(rows, ownerId) {
  const existing = new Set((await listSubscriptions()).map((s) => (s.name || '').toLowerCase()))
  let added = 0
  for (const s of rows || []) {
    if (!s?.name || existing.has(s.name.toLowerCase())) continue
    existing.add(s.name.toLowerCase())
    await createSubscription({
      name: s.name, cost: s.cost, currency: s.currency, cycle: s.cycle, note: s.note,
      category: s.category, plan: s.plan, paidBy: s.paid_by, provider: s.provider,
      renewsOn: s.renews_on, autoRenew: s.auto_renew, priceAfterTrial: s.price_after_trial,
      contractEnd: s.contract_end, termMonths: s.term_months, paymentMethod: s.payment_method,
      parentId: null, ownerId,
    }).catch(() => {})
    added++
  }
  return added
}

// Restore custom lists and their items. Matches an existing list by name (case
// insensitive) or creates it, then adds resolved items (dedup by title).
// plan: [{name, description, emoji, ranked, items:[{titleId, note}]}]
export async function restoreCollections(plan, ownerId) {
  const existing = await listCollections()
  const byName = new Map(existing.map((c) => [(c.name || '').toLowerCase(), c.id]))
  let lists = 0, items = 0
  for (const col of plan || []) {
    if (!col.name) continue
    let cid = byName.get(col.name.toLowerCase())
    if (!cid) {
      cid = await createCollection({ name: col.name, description: col.description, emoji: col.emoji, ranked: col.ranked, ownerId })
      byName.set(col.name.toLowerCase(), cid); lists++
    }
    for (const it of col.items || []) {
      if (!it.titleId) continue
      await addToCollection({ collectionId: cid, titleId: it.titleId, note: it.note }).catch(() => {})
      items++
    }
  }
  return { lists, items }
}

// ---------- Backup / export ----------
// Gather everything the household can see into one plain object for download.
// Existing (title, date) watch keys for a group, so a native restore can skip
// diary entries it already has instead of duplicating them.
export async function getExistingWatchKeys(groupId) {
  const rows = await pagedSelect('watches', 'title_id, watched_on', {
    groupId, limit: 200000, order: (q) => q.order('id', { ascending: true }),
  })
  return new Set(rows.map((r) => `${r.title_id}|${r.watched_on || ''}`))
}

// Restore season ratings from a backup (skips ones already present).
export async function restoreSeasonRatingsBulk(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('season_ratings')
      .upsert(rows.slice(i, i + 500), { onConflict: 'title_id,group_id,profile_id,season_number', ignoreDuplicates: true })
    if (error) throw error
  }
}

// Season ratings with everything needed to re-import (group + profile + title).
async function exportSeasonRatings() {
  const data = await pagedSelect('season_ratings',
    'id, season_number, score, group_id, profile_id, groups(name), profiles(name), titles(tmdb_id, media_type, title)',
    { limit: 100000, order: (q) => q.order('id', { ascending: true }) })
  return (data || []).map((r) => ({
    tmdb_id: r.titles?.tmdb_id, media_type: r.titles?.media_type, title: r.titles?.title,
    season_number: r.season_number, score: r.score,
    group_id: r.group_id, group_name: r.groups?.name,
    profile_id: r.profile_id, profile_name: r.profiles?.name,
  }))
}

// Profile Top-4 favourites, portable by tmdb id + profile name.
async function exportFavourites() {
  const rows = await listFavorites()
  return rows.map((f) => ({
    profile_id: f.profile_id, position: f.position,
    tmdb_id: f.titles?.tmdb_id, media_type: f.titles?.media_type, title: f.titles?.title,
  }))
}

// Collections with their items (each item portable by tmdb id).
async function exportCollections() {
  const cols = await listCollections()
  const out = []
  for (const c of cols) {
    let items = []
    try {
      const full = await getCollection(c.id)
      items = (full.items || full.collection_items || []).map((it) => ({
        tmdb_id: it.titles?.tmdb_id, media_type: it.titles?.media_type, title: it.titles?.title,
        position: it.position, note: it.note || null,
      }))
    } catch { /* keep the collection even if items fail */ }
    out.push({ name: c.name, description: c.description, emoji: c.emoji, ranked: c.ranked, items })
  }
  return out
}

// One categorized, re-importable file with everything the user owns.
export async function exportAllData() {
  const [profiles, groups, diary, episodes, watchlist, collections, seasonRatings, favourites, subscriptions] = await Promise.all([
    listProfiles(),
    listGroups(),
    listDiary({ limit: 100000 }),
    listEpisodeDiary({ limit: 100000 }),
    listWatchlist(),
    exportCollections(),
    exportSeasonRatings(),
    exportFavourites(),
    listSubscriptions(),
  ])
  return {
    app: 'ReelBook',
    schema: 3,
    exported_at: new Date().toISOString(),
    counts: {
      profiles: profiles.length, groups: groups.length, diary: diary.length,
      episodes: episodes.length, watchlist: watchlist.length, collections: collections.length,
      season_ratings: seasonRatings.length, favourites: favourites.length, subscriptions: subscriptions.length,
    },
    profiles, groups, diary, episodes, watchlist, collections,
    season_ratings: seasonRatings, favourites, subscriptions,
  }
}

// ---------- Push subscriptions (Web Push) ----------

export async function savePushSubscription(sub) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const j = sub.toJSON ? sub.toJSON() : sub
  const row = {
    user_id: user.id,
    endpoint: j.endpoint,
    p256dh: j.keys?.p256dh,
    auth: j.keys?.auth,
    user_agent: navigator.userAgent?.slice(0, 300) || null,
  }
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' })
  if (error) throw error
}

export async function deletePushSubscription(endpoint) {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) throw error
}

// Ask the server to send a test push to this user's devices.
export async function sendTestPush() {
  const { data, error } = await supabase.functions.invoke('push-episodes', { body: { action: 'test' } })
  if (error) throw error
  return data
}
