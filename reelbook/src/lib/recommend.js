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

// Netflix-style "Because you liked X" rails: one rail per highly-rated seed,
// each with that title's top recommendations. Titles are de-duped across rails
// (kept in their strongest rail) so you don't see the same poster twice.
export async function recommendRails({ entries, exclude = new Set(), type = 'all', maxRails = 6, perRail = 12 }) {
  const scored = entries
    .map((e) => {
      const rs = (e.ratings || []).filter((r) => r.score != null)
      const avg = rs.length ? rs.reduce((a, b) => a + b.score, 0) / rs.length : 0
      return { t: e.titles, avg }
    })
    .filter((x) => x.t && x.t.tmdb_id && x.avg >= 7)   // only seed from titles you genuinely liked
    .sort((a, b) => b.avg - a.avg)

  const seeds = []
  const seen = new Set()
  for (const { t } of scored) {
    const k = keyOf(t.media_type, t.tmdb_id)
    if (seen.has(k)) continue
    seen.add(k)
    if (type !== 'all' && t.media_type !== type) continue
    seeds.push(t)
    if (seeds.length >= maxRails) break
  }
  if (!seeds.length) return []

  const lists = await Promise.allSettled(seeds.map((s) => getRecommendations(s.tmdb_id, s.media_type)))
  const usedItems = new Set()
  const rails = []
  lists.forEach((res, i) => {
    if (res.status !== 'fulfilled') return
    const items = []
    for (const r of res.value) {
      if (type !== 'all' && r.media_type !== type) continue
      const k = keyOf(r.media_type, r.tmdb_id)
      if (exclude.has(k) || usedItems.has(k)) continue
      usedItems.add(k)
      items.push(r)
      if (items.length >= perRail) break
    }
    if (items.length >= 3) rails.push({ seed: seeds[i], items })
  })
  return rails
}
