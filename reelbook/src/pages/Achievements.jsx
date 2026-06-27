import { useEffect, useMemo, useState } from 'react'
import { listDiary, listEpisodeDiary } from '../lib/db'
import { Spinner, Empty } from '../components/ui'

export default function Achievements() {
  const [diary, setDiary] = useState([])
  const [eps, setEps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listDiary({ limit: 100000 }), listEpisodeDiary({ limit: 100000 })])
      .then(([d, e]) => { setDiary(d); setEps(e) })
      .finally(() => setLoading(false))
  }, [])

  const groups = useMemo(() => computeBadges(diary, eps), [diary, eps])

  if (loading) return <div className="page"><Spinner label="Polishing your trophies…" /></div>

  const all = groups.flatMap((g) => g.badges)
  const earned = all.filter((b) => b.earned).length

  return (
    <div className="page">
      <div className="page-head">
        <h1>Achievements</h1>
        <span className="faint">{earned} of {all.length} unlocked</span>
      </div>
      <div className="progress-track" style={{ marginBottom: 6 }}>
        <div className="progress-fill" style={{ width: `${all.length ? (earned / all.length) * 100 : 0}%` }} />
      </div>

      {all.length === 0 ? (
        <Empty icon="🏅">Start logging watches and ratings to earn your first badge.</Empty>
      ) : (
        groups.map((g) => (
          <div key={g.title} style={{ marginTop: 24 }}>
            <div className="section-head"><h2>{g.title}</h2></div>
            <div className="badge-grid">
              {g.badges.map((b) => (
                <div key={b.id} className={`badge ${b.earned ? 'earned' : ''}`}>
                  <div className="badge-ico">{b.icon}</div>
                  <div className="badge-name">{b.name}</div>
                  <div className="badge-desc">{b.desc}</div>
                  {b.earned ? (
                    <div className="badge-done">✓ Unlocked</div>
                  ) : (
                    <>
                      <div className="progress-track" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(100, (b.value / b.target) * 100)}%` }} />
                      </div>
                      <div className="badge-prog">{Math.min(b.value, b.target)} / {b.target}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function computeBadges(diary, eps) {
  const movies = diary.filter((e) => e.titles?.media_type !== 'tv').length
  const episodes = eps.length
  const showIds = new Set(eps.map((e) => e.titles?.id).filter(Boolean))
  const titleIds = new Set([...showIds])
  for (const e of diary) if (e.titles?.id) titleIds.add(e.titles.id)
  const titles = titleIds.size

  const ratingsGiven = diary.filter((e) => (e.ratings || []).some((r) => r.score != null)).length
  const rewatches = diary.filter((e) => e.is_rewatch).length
  const tagsUsed = new Set(diary.flatMap((e) => e.tags || [])).size
  const genres = new Set(diary.flatMap((e) => (e.titles?.genre || '').split(',').map((g) => g.trim()).filter(Boolean))
    .concat(eps.flatMap((e) => (e.titles?.genre || '').split(',').map((g) => g.trim()).filter(Boolean)))).size
  const decades = new Set([...diary, ...eps].map((e) => e.titles?.year).filter(Boolean).map((y) => Math.floor(y / 10) * 10)).size
  const services = new Set(diary.map((e) => e.service).filter(Boolean)).size

  // day-level activity (movies + episodes)
  const dayMap = new Map(); const months = new Set()
  const add = (d) => { const k = String(d).slice(0, 10); dayMap.set(k, (dayMap.get(k) || 0) + 1); months.add(k.slice(0, 7)) }
  for (const e of diary) if (e.watched_on) add(e.watched_on)
  for (const e of eps) if (e.watched_on) add(e.watched_on)
  const biggestDay = Math.max(0, ...dayMap.values())
  const activeMonths = months.size

  // longest streak
  const days = [...dayMap.keys()].sort()
  let longest = days.length ? 1 : 0, run = days.length ? 1 : 0
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00').getTime()
    const cur = new Date(days[i] + 'T00:00:00').getTime()
    if (Math.round((cur - prev) / 864e5) === 1) { run++; if (run > longest) longest = run } else run = 1
  }

  const B = (id, icon, name, desc, value, target) => ({ id, icon, name, desc, value, target, earned: value >= target })

  return [
    {
      title: 'Volume', badges: [
        B('mv10', '🎬', 'Matinee', 'Watch 10 movies', movies, 10),
        B('mv50', '🍿', 'Cinephile', 'Watch 50 movies', movies, 50),
        B('mv100', '🎞️', 'Film buff', 'Watch 100 movies', movies, 100),
        B('ep50', '📺', 'Binger', 'Watch 50 episodes', episodes, 50),
        B('ep100', '📺', 'Couch expert', 'Watch 100 episodes', episodes, 100),
        B('ep500', '🛰️', 'Marathoner', 'Watch 500 episodes', episodes, 500),
        B('ti50', '🗂️', 'Collector', 'Log 50 titles', titles, 50),
        B('ti250', '🗄️', 'Archivist', 'Log 250 titles', titles, 250),
      ],
    },
    {
      title: 'Streaks & marathons', badges: [
        B('st3', '🔥', 'Warmed up', '3-day watch streak', longest, 3),
        B('st7', '🔥', 'On a roll', '7-day watch streak', longest, 7),
        B('st14', '🔥', 'Devoted', '14-day watch streak', longest, 14),
        B('st30', '🌋', 'Unstoppable', '30-day watch streak', longest, 30),
        B('bd5', '🛋️', 'Lazy Sunday', '5 episodes in one day', biggestDay, 5),
        B('bd10', '🏃', 'Marathon', '10 episodes in one day', biggestDay, 10),
      ],
    },
    {
      title: 'Taste', badges: [
        B('ra25', '⭐', 'Critic', 'Rate 25 titles', ratingsGiven, 25),
        B('ra100', '🌟', 'Tough crowd', 'Rate 100 titles', ratingsGiven, 100),
        B('ge5', '🎭', 'Explorer', 'Watch 5 different genres', genres, 5),
        B('ge10', '🧭', 'Omnivore', 'Watch 10 different genres', genres, 10),
        B('de5', '🕰️', 'Time traveller', 'Watch titles from 5 decades', decades, 5),
      ],
    },
    {
      title: 'Habits', badges: [
        B('rw1', '↻', 'Second helping', 'Log your first rewatch', rewatches, 1),
        B('rw10', '🔁', 'Comfort viewer', 'Log 10 rewatches', rewatches, 10),
        B('tg1', '🏷️', 'Organiser', 'Use your first tag', tagsUsed, 1),
        B('tg10', '🗃️', 'Curator', 'Use 10 different tags', tagsUsed, 10),
        B('mo6', '📆', 'Regular', 'Watch across 6 months', activeMonths, 6),
        B('mo12', '🗓️', 'Year-rounder', 'Watch across 12 months', activeMonths, 12),
        B('sv5', '📡', 'Channel surfer', 'Watch on 5 services', services, 5),
      ],
    },
  ]
}
