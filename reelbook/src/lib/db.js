import { supabase } from './supabase'
import { getDetail } from './tmdb'

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

// Insert many watches; returns the new ids in input order (for attaching ratings).
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
    const { error } = await supabase.from('watchlist').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

// All logged watches for a title (with group + ratings), newest first.
export async function getWatchesForTitle(titleId) {
  const { data, error } = await supabase
    .from('watches')
    .select('id, watched_on, date_precision, note, episodes_watched, where_watched, service, group_id, groups(id, name, color), ratings(id, profile_id, score)')
    .eq('title_id', titleId)
    .order('watched_on', { ascending: false })
  if (error) throw error
  return data
}

// ---------- Episode tracking (per-episode, per-group) ----------

export async function listEpisodeWatches(titleId, groupId) {
  let q = supabase
    .from('episode_watches')
    .select('id, season_number, episode_number, watched_on, rating')
    .eq('title_id', titleId)
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null)
  const { data, error } = await q
  if (error) throw error
  return data
}

// Rate a single episode (implies it's watched). Preserves an existing watched date.
export async function setEpisodeRating({ titleId, groupId, season, episode, rating, watchedOn, createdBy }) {
  let sel = supabase.from('episode_watches').select('id')
    .eq('title_id', titleId).eq('season_number', season).eq('episode_number', episode)
  sel = groupId ? sel.eq('group_id', groupId) : sel.is('group_id', null)
  const { data: existing } = await sel.maybeSingle()
  if (existing) {
    const { error } = await supabase.from('episode_watches').update({ rating }).eq('id', existing.id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('episode_watches').insert({
    title_id: titleId, group_id: groupId, season_number: season, episode_number: episode,
    rating, watched_on: watchedOn || undefined, created_by: createdBy,
  })
  if (error) throw error
}

export async function markEpisode({ titleId, groupId, season, episode, watchedOn, createdBy }) {
  const { error } = await supabase.from('episode_watches').upsert(
    {
      title_id: titleId, group_id: groupId,
      season_number: season, episode_number: episode,
      watched_on: watchedOn || undefined, created_by: createdBy,
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
export async function markEpisodesBulk({ titleId, groupId, episodes, createdBy }) {
  const rows = episodes.map((e) => ({
    title_id: titleId, group_id: groupId,
    season_number: e.season, episode_number: e.episode,
    watched_on: e.watchedOn || null, created_by: createdBy,
  }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from('episode_watches')
      .upsert(rows.slice(i, i + 500), { onConflict: 'title_id,group_id,season_number,episode_number' })
    if (error) throw error
  }
}

export async function markSeason({ titleId, groupId, season, episodes, watchedOn, createdBy }) {
  const rows = episodes.map((ep) => ({
    title_id: titleId, group_id: groupId, season_number: season,
    episode_number: ep, watched_on: watchedOn || undefined, created_by: createdBy,
  }))
  if (!rows.length) return
  const { error } = await supabase
    .from('episode_watches')
    .upsert(rows, { onConflict: 'title_id,group_id,season_number,episode_number' })
  if (error) throw error
}

// Shows with episodes ticked off but not yet complete — for "Continue watching".
export async function listInProgressShows() {
  const { data, error } = await supabase
    .from('episode_watches')
    .select('title_id, season_number, episode_number, watched_on, titles(*)')
  if (error) throw error
  const byTitle = new Map()
  for (const row of data || []) {
    const t = row.titles
    if (!t || t.media_type !== 'tv') continue
    if (!byTitle.has(row.title_id)) byTitle.set(row.title_id, { title: t, eps: new Set(), last: row.watched_on })
    const e = byTitle.get(row.title_id)
    e.eps.add(`${row.season_number}-${row.episode_number}`)
    if (row.watched_on && (!e.last || row.watched_on > e.last)) e.last = row.watched_on
  }
  const out = []
  for (const { title, eps, last } of byTitle.values()) {
    const total = title.total_episodes || 0
    const watched = eps.size
    if (total && watched >= total) continue // finished
    out.push({ title, watched, total, last })
  }
  return out.sort((a, b) => (b.last || '').localeCompare(a.last || ''))
}

// All TV shows you've ticked episodes for (watched count + cached total).
export async function listTrackedShows() {
  const { data, error } = await supabase
    .from('episode_watches')
    .select('title_id, season_number, episode_number, watched_on, titles(*)')
  if (error) throw error
  const byTitle = new Map()
  for (const row of data || []) {
    const t = row.titles
    if (!t || t.media_type !== 'tv') continue
    if (!byTitle.has(row.title_id)) byTitle.set(row.title_id, { title: t, eps: new Set(), last: row.watched_on })
    const e = byTitle.get(row.title_id)
    e.eps.add(`${row.season_number}-${row.episode_number}`)
    if (row.watched_on && (!e.last || row.watched_on > e.last)) e.last = row.watched_on
  }
  return [...byTitle.values()].map(({ title, eps, last }) => ({
    title, watched: eps.size, cachedTotal: title.total_episodes || 0, last,
  }))
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

export async function listWatchlist(groupId = null) {
  let q = supabase
    .from('watchlist')
    .select('id, group_id, added_by, created_at, titles(*), groups(id, name, color)')
    .order('created_at', { ascending: false })
  if (groupId) q = q.eq('group_id', groupId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addToWatchlist({ seed, groupId, addedBy }) {
  const titleId = await ensureTitle(seed)
  // Avoid duplicates for the same group.
  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('title_id', titleId)
    .eq('group_id', groupId)
    .maybeSingle()
  if (existing) return existing.id
  const { data, error } = await supabase
    .from('watchlist')
    .insert({ title_id: titleId, group_id: groupId, added_by: addedBy })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function removeFromWatchlist(id) {
  const { error } = await supabase.from('watchlist').delete().eq('id', id)
  if (error) throw error
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
  return watch.id
}

// Diary = all watches, newest first, with title + group + ratings.
export async function listDiary({ groupId = null, limit = 200 } = {}) {
  let q = supabase
    .from('watches')
    .select(
      'id, watched_on, date_precision, note, episodes_watched, where_watched, service, group_id, created_by, created_at, ' +
        'titles(*), groups(id, name, color), ratings(id, profile_id, score)'
    )
    .order('watched_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (groupId) q = q.eq('group_id', groupId)
  const { data, error } = await q
  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from('notif_state')
    .select('title_id, baseline_aired, dismissed')
    .eq('user_id', user.id)
  if (error) throw error
  return data || []
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
