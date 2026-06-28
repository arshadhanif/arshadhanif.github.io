import { useEffect, useMemo, useState } from 'react'
import { listDiary, listEpisodeDiary } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Spinner, Empty, Poster, TitleLink } from '../components/ui'

export default function Wrapped() {
  const { profiles } = useAppData()
  const [diary, setDiary] = useState([])
  const [eps, setEps] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    Promise.all([listDiary({ limit: 100000 }), listEpisodeDiary({ limit: 100000 })])
      .then(([d, e]) => { setDiary(d); setEps(e) })
      .finally(() => setLoading(false))
  }, [])

  const years = useMemo(() => {
    const set = new Set()
    for (const e of diary) if (e.watched_on) set.add(+String(e.watched_on).slice(0, 4))
    for (const e of eps) if (e.watched_on) set.add(+String(e.watched_on).slice(0, 4))
    return [...set].sort((a, b) => b - a)
  }, [diary, eps])

  const w = useMemo(() => computeWrapped(diary, eps, year, profiles), [diary, eps, year, profiles])

  if (loading) return <div className="page"><Spinner label="Wrapping up your year…" /></div>

  async function share() {
    const txt = `My ${year} in ReelBook: ${w.titles} titles, ${w.episodes} episodes, ~${w.hours} hours. Top: ${w.topMovie?.title || w.topShow?.title || 'N/A'}.`
    try {
      if (navigator.share) await navigator.share({ title: `My ${year} in ReelBook`, text: txt })
      else { await navigator.clipboard.writeText(txt); alert('Summary copied. Screenshot the card to share the visuals.') }
    } catch { /* user cancelled */ }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Year in Review</h1>
        <div className="row" style={{ gap: 8 }}>
          {years.length > 1 && (
            <select value={year} onChange={(e) => setYear(+e.target.value)} style={{ width: 'auto' }}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <button className="btn sm" onClick={share}>Share</button>
        </div>
      </div>

      {w.total === 0 ? (
        <Empty icon="🎬">Nothing logged in {year} yet. Pick another year, or start logging watches.</Empty>
      ) : (
        <div className="wrap-card">
          <div className="wrap-hero">
            <div className="wrap-kicker">REELBOOK</div>
            <div className="wrap-year">{year}</div>
            <div className="wrap-tag">Your year on screen</div>
          </div>

          <div className="wrap-stats">
            <Big v={w.titles} l="titles watched" />
            <Big v={w.hours} l="hours" />
            <Big v={w.episodes} l="episodes" />
            <Big v={w.movies} l="movies" />
            <Big v={w.shows} l="shows" />
            <Big v={w.activeDays} l="days watching" />
          </div>

          {(w.topMovie || w.topShow) && (
            <div className="wrap-tops">
              {w.topMovie && (
                <TitleLink className="wrap-top" tmdbId={w.topMovie.tmdb_id} media="movie">
                  <div style={{ width: 92 }}><Poster title={w.topMovie.title} mediaType="movie" posterPath={w.topMovie.poster_path} /></div>
                  <div className="wrap-top-cap">Top movie</div>
                  <div className="wrap-top-title">{w.topMovie.title}</div>
                  {w.topMovie.avg != null && <div className="faint">★ {w.topMovie.avg}</div>}
                </TitleLink>
              )}
              {w.topShow && (
                <TitleLink className="wrap-top" tmdbId={w.topShow.tmdb_id} media="tv">
                  <div style={{ width: 92 }}><Poster title={w.topShow.title} mediaType="tv" posterPath={w.topShow.poster_path} /></div>
                  <div className="wrap-top-cap">Top show</div>
                  <div className="wrap-top-title">{w.topShow.title}</div>
                  <div className="faint">{w.topShow.count} episodes</div>
                </TitleLink>
              )}
            </div>
          )}

          <div className="wrap-facts">
            {w.busiestMonth && <Fact k="Busiest month" v={w.busiestMonth.label} s={`${w.busiestMonth.count} watches`} />}
            {w.bestDay && <Fact k="Biggest day" v={w.bestDay.label} s={`${w.bestDay.count} in one day`} />}
            {w.longestStreak > 1 && <Fact k="Longest streak" v={`${w.longestStreak} days`} s="in a row" />}
            {w.topGenre && <Fact k="Top genre" v={w.topGenre} />}
            {w.people.filter((p) => p.count).map((p) => (
              <Fact key={p.id} k={`${p.name}'s average`} v={`${p.avg} / 10`} s={`${p.count} rated`} color={p.color} />
            ))}
          </div>

          <div className="wrap-foot">ReelBook · {year}</div>
        </div>
      )}
    </div>
  )
}

function Big({ v, l }) { return <div className="wrap-big"><div className="n">{v}</div><div className="cl">{l}</div></div> }
function Fact({ k, v, s, color }) {
  return <div className="wrap-fact"><div className="fk">{k}</div><div className="fv" style={color ? { color } : undefined}>{v}</div>{s && <div className="fs">{s}</div>}</div>
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function computeWrapped(diary, eps, year, profiles) {
  const ys = String(year)
  const inYear = (d) => d && String(d).slice(0, 4) === ys
  const dy = diary.filter((e) => inYear(e.watched_on))
  const ey = eps.filter((e) => inYear(e.watched_on))

  const movies = dy.filter((e) => e.titles?.media_type !== 'tv').length
  const episodes = ey.length
  let minutes = 0
  for (const e of dy) if (e.titles?.media_type !== 'tv') minutes += e.titles?.runtime || 115
  for (const e of ey) minutes += e.titles?.runtime || 40
  const hours = Math.round(minutes / 60)

  // shows = distinct TV titles with episode activity this year
  const showMap = new Map()
  for (const e of ey) { const id = e.titles?.id; if (!id) continue; if (!showMap.has(id)) showMap.set(id, { t: e.titles, count: 0 }); showMap.get(id).count++ }
  const shows = showMap.size
  const titles = movies + shows

  // top movie by rating, top show by episode count
  const ratedMovies = dy.filter((e) => e.titles?.media_type !== 'tv').map((e) => {
    const rs = (e.ratings || []).filter((r) => r.score != null)
    const avg = rs.length ? rs.reduce((a, b) => a + b.score, 0) / rs.length : null
    return { tmdb_id: e.titles?.tmdb_id, title: e.titles?.title, poster_path: e.titles?.poster_path, avg: avg == null ? null : +avg.toFixed(1) }
  })
  const topMovie = ratedMovies.filter((m) => m.avg != null).sort((a, b) => b.avg - a.avg)[0]
    || ratedMovies[0] || null
  const topShowEntry = [...showMap.values()].sort((a, b) => b.count - a.count)[0]
  const topShow = topShowEntry ? { tmdb_id: topShowEntry.t.tmdb_id, title: topShowEntry.t.title, poster_path: topShowEntry.t.poster_path, count: topShowEntry.count } : null

  // months + days (movies + episodes)
  const monthCount = Array(12).fill(0)
  const dayMap = new Map()
  const daySet = new Set()
  const addDay = (d) => { const k = String(d).slice(0, 10); dayMap.set(k, (dayMap.get(k) || 0) + 1); daySet.add(k); const m = +String(d).slice(5, 7) - 1; if (m >= 0) monthCount[m]++ }
  for (const e of dy) if (e.watched_on) addDay(e.watched_on)
  for (const e of ey) if (e.watched_on) addDay(e.watched_on)
  let bm = -1; monthCount.forEach((c, i) => { if (bm < 0 || c > monthCount[bm]) bm = i })
  const busiestMonth = monthCount[bm] > 0 ? { label: `${MONTHS[bm]} ${year}`, count: monthCount[bm] } : null
  let bestDay = null
  for (const [k, c] of dayMap) if (!bestDay || c > bestDay.count) bestDay = { label: fmtShort(k), count: c, key: k }

  // longest streak within the year
  const days = [...daySet].sort()
  let longest = days.length ? 1 : 0, run = days.length ? 1 : 0
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00').getTime()
    const cur = new Date(days[i] + 'T00:00:00').getTime()
    if (Math.round((cur - prev) / 864e5) === 1) { run++; if (run > longest) longest = run } else run = 1
  }

  // top genre
  const gcount = new Map()
  for (const e of [...dy, ...[...showMap.values()].map((s) => ({ titles: s.t }))]) {
    for (const g of (e.titles?.genre || '').split(',').map((x) => x.trim()).filter(Boolean)) gcount.set(g, (gcount.get(g) || 0) + 1)
  }
  const topGenre = [...gcount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const people = (profiles || []).map((p) => {
    const scores = dy.map((e) => (e.ratings || []).find((r) => r.profile_id === p.id && r.score != null)?.score).filter((x) => x != null)
    const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
    return { ...p, count: scores.length, avg }
  })

  return { total: dy.length + ey.length, titles, movies, shows, episodes, hours, activeDays: daySet.size, topMovie, topShow, busiestMonth, bestDay, longestStreak: longest, topGenre, people }
}

function fmtShort(k) {
  const d = new Date(k + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}`
}
