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
  backdrop: (path, size = 'w780') =>
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

// Trending this week (movies + TV) — shown on the Discover screen before searching.
export async function getTrending() {
  const data = await tmdb('/trending/all/week')
  return (data.results || [])
    .map(normalizeResult)
    .filter(Boolean)
    .filter((r) => r.title && r.poster_path)
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
