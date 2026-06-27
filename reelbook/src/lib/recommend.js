import { getRecommendations } from './tmdb'

export const keyOf = (mediaType, tmdbId) => `${mediaType}-${tmdbId}`

// Recommend titles from watch history.
// entries: diary rows (with titles + ratings). exclude: Set of "media-tmdbId" to skip.
// Returns a ranked list of normalized title objects.
export async function recommendFromHistory({ entries, exclude = new Set(), type = 'all', maxSeeds = 8, max = 24 }) {
  // Seeds = highest-rated watched titles (de-duped), weighted by rating.
  const scored = entries
    .map((e) => {
      const rs = (e.ratings || []).filter((r) => r.score != null)
      const avg = rs.length ? rs.reduce((a, b) => a + b.score, 0) / rs.length : 0
      return { t: e.titles, avg }
    })
    .filter((x) => x.t && x.t.tmdb_id)
    .sort((a, b) => b.avg - a.avg)

  const seeds = []
  const seenSeed = new Set()
  for (const { t, avg } of scored) {
    const k = keyOf(t.media_type, t.tmdb_id)
    if (seenSeed.has(k)) continue
    seenSeed.add(k)
    seeds.push({ tmdb_id: t.tmdb_id, media: t.media_type, weight: Math.max(1, avg || 5) })
    if (seeds.length >= maxSeeds) break
  }
  if (!seeds.length) return []

  const lists = await Promise.allSettled(seeds.map((s) => getRecommendations(s.tmdb_id, s.media)))

  const cand = new Map() // key -> { item, score }
  lists.forEach((res, i) => {
    if (res.status !== 'fulfilled') return
    const w = seeds[i].weight
    res.value.forEach((r, idx) => {
      if (type !== 'all' && r.media_type !== type) return
      const k = keyOf(r.media_type, r.tmdb_id)
      if (exclude.has(k)) return
      const rankBonus = 1 + Math.max(0, 12 - idx) / 12 // earlier in TMDB list = stronger
      const score = w * rankBonus
      const prev = cand.get(k)
      if (prev) prev.score += score
      else cand.set(k, { item: r, score })
    })
  })

  return [...cand.values()].sort((a, b) => b.score - a.score).slice(0, max).map((x) => x.item)
}
