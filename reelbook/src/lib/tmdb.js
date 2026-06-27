// TMDB API client.
// Uses the v4 "API Read Access Token" (bearer) from VITE_TMDB_TOKEN.
// Docs: https://developer.themoviedb.org/reference/intro/getting-started
//
// NOTE: "This product uses the TMDB API but is not endorsed or certified by TMDB."

const TOKEN = import.meta.env.VITE_TMDB_TOKEN
const BASE = 'https://api.themoviedb.org/3'

export const IMG = {
  poster: (path, size = 'w342') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path, size = 'w1280') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  profile: (path, size = 'w185') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  still: (path, size = 'w300') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  logo: (path, size = 'w92') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
}

async function tmdb(path, params = {}) {
  if (!TOKEN || TOKEN.startsWith('PASTE_')) {
    throw new Error(
      'TMDB token missing. Add VITE_TMDB_TOKEN to reelbook/.env (your v4 Read Access Token).'
    )
  }
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

function yearOf(dateStr) {
  if (!dateStr) return null
  const y = parseInt(String(dateStr).slice(0, 4), 10)
  return Number.isFinite(y) ? y : null
}

// Normalize a TMDB multi-search / detail result into our shape.
export function normalizeResult(r) {
  const media_type = r.media_type || (r.title ? 'movie' : 'tv')
  if (media_type !== 'movie' && media_type !== 'tv') return null
  const isMovie = media_type === 'movie'
  return {
    tmdb_id: r.id,
    media_type,
    title: isMovie ? r.title : r.name,
    year: yearOf(isMovie ? r.release_date : r.first_air_date),
    poster_path: r.poster_path || null,
    overview: r.overview || null,
    // genre filled in by detail call when available
    genre: null,
  }
}

// Combined movie+TV search for the Discover screen.
export async function searchMulti(query, page = 1) {
  if (!query?.trim()) return []
  const data = await tmdb('/search/multi', {
    query,
    page,
    include_adult: 'false',
  })
  return (data.results || [])
    .map(normalizeResult)
    .filter(Boolean)
    .filter((r) => r.title)
}

// Look up a TMDB title from an IMDb id (tt0123456) — used by the IMDb importer.
export async function findByImdbId(imdbId) {
  const data = await tmdb(`/find/${imdbId}`, { external_source: 'imdb_id' })
  const hit = (data.movie_results || [])[0] || (data.tv_results || [])[0]
  if (!hit) return null
  return normalizeResult(hit)
}

// Look up a TMDB title from a TheTVDB id (TV Time uses these for series).
export async function findByTvdbId(tvdbId) {
  const data = await tmdb(`/find/${tvdbId}`, { external_source: 'tvdb_id' })
  const hit = (data.tv_results || [])[0] || (data.movie_results || [])[0]
  return hit ? normalizeResult(hit) : null
}

// Best-effort title search returning the top match (importer fallback).
export async function findByTitle(query, year, mediaHint) {
  const results = await searchMulti(query)
  if (!results.length) return null
  let pool = results
  if (mediaHint) {
    const filtered = results.filter((r) => r.media_type === mediaHint)
    if (filtered.length) pool = filtered
  }
  if (year) {
    const exact = pool.find((r) => r.year === Number(year))
    if (exact) return exact
  }
  return pool[0]
}

// Genre list for the advanced filters.
export async function getGenres(mediaType) {
  const data = await tmdb(`/genre/${mediaType}/list`)
  return data.genres || []
}

// Advanced filtered browse via TMDB Discover.
export async function discoverTitles(mediaType, opts = {}) {
  const { genres = [], yearMin, yearMax, ratingMin, sortBy = 'popularity.desc', page = 1 } = opts
  const params = { sort_by: sortBy, page, include_adult: 'false' }
  if (genres.length) params.with_genres = genres.join(',')
  if (ratingMin) { params['vote_average.gte'] = ratingMin; params['vote_count.gte'] = 50 }
  const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date'
  if (yearMin) params[`${dateField}.gte`] = `${yearMin}-01-01`
  if (yearMax) params[`${dateField}.lte`] = `${yearMax}-12-31`
  const data = await tmdb(`/discover/${mediaType}`, params)
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: (data.results || []).map((r) => normalizeResult({ ...r, media_type: mediaType })).filter(Boolean).filter((r) => r.poster_path),
  }
}

// Trending this week (movies + TV) — shown on the Discover screen before searching.
export async function getTrending() {
  const data = await tmdb('/trending/all/week')
  return (data.results || [])
    .map(normalizeResult)
    .filter(Boolean)
    .filter((r) => r.title && r.poster_path)
}

// Curated rows for the Discover home.
export async function getPopular(mediaType) {
  const data = await tmdb(`/${mediaType}/popular`)
  return (data.results || []).map((r) => normalizeResult({ ...r, media_type: mediaType })).filter(Boolean).filter((r) => r.poster_path)
}
export async function getTopRated(mediaType) {
  const data = await tmdb(`/${mediaType}/top_rated`)
  return (data.results || []).map((r) => normalizeResult({ ...r, media_type: mediaType })).filter(Boolean).filter((r) => r.poster_path)
}

// "More like this" on the detail page.
export async function getRecommendations(tmdbId, mediaType) {
  const data = await tmdb(`/${mediaType}/${tmdbId}/recommendations`)
  return (data.results || []).map((r) => normalizeResult({ ...r, media_type: mediaType })).filter(Boolean).filter((r) => r.poster_path).slice(0, 12)
}

// Rich detail for the title page: core fields + credits + external ids + providers + videos.
export async function getFullDetail(tmdbId, mediaType) {
  const data = await tmdb(`/${mediaType}/${tmdbId}`, {
    append_to_response: 'credits,external_ids,watch/providers,videos',
  })
  const isMovie = mediaType === 'movie'
  const runtime = isMovie
    ? data.runtime ?? null
    : (data.episode_run_time && data.episode_run_time[0]) ?? null

  const cast = (data.credits?.cast || []).slice(0, 18).map((c) => ({
    id: c.id, name: c.name, character: c.character, profile_path: c.profile_path,
  }))
  let crew = []
  if (isMovie) {
    const directors = (data.credits?.crew || []).filter((c) => c.job === 'Director')
    crew = directors.map((d) => ({ role: 'Director', name: d.name }))
  } else {
    crew = (data.created_by || []).map((c) => ({ role: 'Creator', name: c.name }))
  }

  const seasons = !isMovie
    ? (data.seasons || [])
        .filter((s) => (s.episode_count || 0) > 0)
        .map((s) => ({
          season_number: s.season_number,
          name: s.name,
          episode_count: s.episode_count,
          air_date: s.air_date,
        }))
    : []

  return {
    // fields we cache into `titles`
    tmdb_id: data.id,
    media_type: mediaType,
    title: isMovie ? data.title : data.name,
    year: yearOf(isMovie ? data.release_date : data.first_air_date),
    poster_path: data.poster_path || null,
    backdrop_path: data.backdrop_path || null,
    overview: data.overview || null,
    genre: (data.genres || []).map((g) => g.name).join(', ') || null,
    total_episodes: isMovie ? null : data.number_of_episodes ?? null,
    runtime,
    tagline: data.tagline || null,
    vote_average: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
    imdb_id: data.external_ids?.imdb_id || data.imdb_id || null,
    // display-only extras
    vote_count: data.vote_count || 0,
    genres: (data.genres || []).map((g) => g.name),
    cast,
    crew,
    seasons,
    number_of_seasons: data.number_of_seasons ?? seasons.length,
    providers: data['watch/providers']?.results || {},
    trailer_key: pickTrailer(data.videos?.results),
  }
}

function pickTrailer(videos = []) {
  const yt = videos.filter((v) => v.site === 'YouTube')
  const t = yt.find((v) => v.type === 'Trailer' && v.official) ||
            yt.find((v) => v.type === 'Trailer') ||
            yt.find((v) => v.type === 'Teaser') || yt[0]
  return t?.key || null
}

// How many episodes have actually AIRED (TMDB's number_of_episodes also counts
// announced/unaired episodes for ongoing shows, which breaks "caught up" logic).
function airedEpisodes(data) {
  if (!data.next_episode_to_air) return data.number_of_episodes ?? null // ended / fully aired
  const last = data.last_episode_to_air
  if (!last) return data.number_of_episodes ?? null
  let count = (data.seasons || [])
    .filter((s) => (s.season_number || 0) >= 1 && s.season_number < last.season_number)
    .reduce((a, s) => a + (s.episode_count || 0), 0)
  count += last.episode_number || 0
  return count
}

// Current episode status for a tracked show (for catch-up + notifications).
export async function getTvStatus(tmdbId) {
  const data = await tmdb(`/tv/${tmdbId}`)
  const n = data.next_episode_to_air
  return {
    number_of_episodes: data.number_of_episodes ?? null,
    aired_episodes: airedEpisodes(data),
    status: data.status || null,
    next_episode: n ? { air_date: n.air_date, name: n.name, season: n.season_number, episode: n.episode_number } : null,
  }
}

// Episodes for one season of a TV show.
export async function getSeason(tmdbId, seasonNumber) {
  const data = await tmdb(`/tv/${tmdbId}/season/${seasonNumber}`)
  return (data.episodes || []).map((e) => ({
    episode_number: e.episode_number,
    name: e.name,
    air_date: e.air_date,
    overview: e.overview,
    still_path: e.still_path,
    runtime: e.runtime,
  }))
}

// Country codes that have provider data (for the in-app region switcher).
export function providerRegions(providers) {
  return Object.keys(providers || {}).sort()
}

// Full detail for a single title (used when adding/caching).
export async function getDetail(tmdbId, mediaType) {
  const data = await tmdb(`/${mediaType}/${tmdbId}`)
  const isMovie = mediaType === 'movie'
  return {
    tmdb_id: data.id,
    media_type: mediaType,
    title: isMovie ? data.title : data.name,
    year: yearOf(isMovie ? data.release_date : data.first_air_date),
    poster_path: data.poster_path || null,
    overview: data.overview || null,
    genre: (data.genres || []).map((g) => g.name).join(', ') || null,
    total_episodes: isMovie ? null : data.number_of_episodes ?? null,
  }
}
