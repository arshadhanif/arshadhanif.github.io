import { useEffect, useMemo, useState } from 'react'
import { listDiary } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Spinner, Empty, GroupChips, Poster, TitleLink, DualScore, Modal } from '../components/ui'
import { formatWatched } from '../lib/dates'

export default function Insights() {
  const { profiles, groups } = useAppData()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [mediaType, setMediaType] = useState('all')
  const [decade, setDecade] = useState('all')
  const [drill, setDrill] = useState(null) // { title, entries }

  useEffect(() => {
    listDiary({ limit: 4000 }).then(setEntries).finally(() => setLoading(false))
  }, [])

  const decades = useMemo(() => {
    const set = new Set()
    entries.forEach((e) => { const y = e.titles?.year; if (y) set.add(Math.floor(y / 10) * 10) })
    return [...set].sort((a, b) => b - a)
  }, [entries])

  const data = useMemo(() => entries.filter((e) => {
    if (groupId && e.group_id !== groupId) return false
    if (mediaType !== 'all' && e.titles?.media_type !== mediaType) return false
    if (decade !== 'all') { const y = e.titles?.year; if (!y || Math.floor(y / 10) * 10 !== Number(decade)) return false }
    return true
  }), [entries, groupId, mediaType, decade])

  const s = useMemo(() => compute(data, profiles, groups), [data, profiles, groups])

  if (loading) return <div className="page"><Spinner label="Crunching your numbers…" /></div>

  return (
    <div className="page">
      <h1>Insights</h1>

      {/* filter bar */}
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div className="seg">
          {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={mediaType === v ? 'on' : ''} onClick={() => setMediaType(v)}>{l}</button>
          ))}
        </div>
        {decades.length > 0 && (
          <select value={decade} onChange={(e) => setDecade(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All decades</option>
            {decades.map((d) => <option key={d} value={d}>{d}s</option>)}
          </select>
        )}
      </div>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {data.length === 0 ? (
        <Empty icon="📊">No watches match these filters yet.</Empty>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 26 }}>
            <Stat v={s.total} l="Watches" />
            <Stat v={s.hours} l="Hours watched" s="approx" />
            <Stat v={s.movies} l="Movies" />
            <Stat v={s.tv} l="TV shows" />
            {s.episodes > 0 && <Stat v={s.episodes} l="Episodes" />}
            <Stat v={s.thisYear} l={`Watched in ${s.year}`} />
            {s.people.map((p) => (
              <Stat key={p.id} v={p.avg ?? '—'} l={`${p.name}'s avg`} s={`${p.count} rated · tap`} color={p.color}
                onClick={p.count ? () => setDrill({ title: `${p.name}'s ratings`, entries: p.entries }) : undefined} />
            ))}
          </div>

          {s.people.some((p) => p.count > 0) && (
            <Section title="How you each rate">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
                {s.people.filter((p) => p.count > 0).map((p) => (
                  <div className="card" key={p.id}>
                    <div className="spread" style={{ marginBottom: 12 }}>
                      <strong style={{ color: p.color }}>{p.name}</strong>
                      <span className="score" style={{ borderColor: p.color, color: p.color }}>avg {p.avg}</span>
                    </div>
                    <Distribution dist={p.dist} color={p.color} onPick={(score, ents) => setDrill({ title: `${p.name} rated ${score}/10`, entries: ents })} />
                    <div className="faint" style={{ marginTop: 8 }}>{p.count} ratings · most given: {p.mode}/10</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.agreement && (
            <Section title="🥊 Where you agree & disagree">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 14 }}>
                <Stat v={s.agreement.avgGap} l="Avg rating gap" s="lower = closer" />
                <Stat v={`${s.agreement.agreePct}%`} l="You agree" s="within 1 point" color="var(--green)" />
                <Stat v={s.agreement.disagreeCount} l="Big splits" s="3+ apart · tap" color="var(--pink)"
                  onClick={s.agreement.disagreeCount ? () => setDrill({ title: 'Biggest disagreements', entries: s.agreement.topEntries }) : undefined} />
              </div>
            </Section>
          )}

          {s.months.some((m) => m.count > 0) && (
            <Section title="Watches over time">
              <div className="card">
                <div className="cols">
                  {s.months.map((m) => (
                    <button className="col" key={m.key} title={`${m.label}: ${m.count}`}
                      onClick={() => m.entries.length && setDrill({ title: `Watched in ${m.fullLabel}`, entries: m.entries })}>
                      <div className="fill" style={{ height: `${s.monthMax ? (m.count / s.monthMax) * 100 : 0}%` }} />
                      <span className="cl">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))' }}>
            {s.genres.length > 0 && <Section title="Top genres"><div className="card"><Bars items={s.genres} onPick={setDrill} /></div></Section>}
            {s.services.length > 0 && <Section title="By streaming service"><div className="card"><Bars items={s.services} accent="var(--accent-2)" onPick={setDrill} /></div></Section>}
            {s.wheres.length > 0 && <Section title="Where you watch"><div className="card"><Bars items={s.wheres} accent="var(--purple)" onPick={setDrill} /></div></Section>}
            {s.decadesBars.length > 0 && <Section title="By decade"><div className="card"><Bars items={s.decadesBars} accent="var(--green)" onPick={setDrill} /></div></Section>}
            {!groupId && s.byGroup.length > 1 && <Section title="By group"><div className="card"><Bars items={s.byGroup} onPick={setDrill} /></div></Section>}
          </div>

          {s.topRated.length > 0 && (
            <Section title="Highest rated">
              <div className="grid">
                {s.topRated.map((t) => (
                  <TitleLink className="tile" key={t.id} tmdbId={t.tmdb_id} media={t.media_type}>
                    <Poster title={t.title} mediaType={t.media_type} posterPath={t.poster_path} />
                    <div className="tile-title">{t.title}</div>
                    <div className="tile-sub" style={{ color: 'var(--accent)' }}>★ {t.avg} avg</div>
                  </TitleLink>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {drill && (
        <Modal title={drill.title} onClose={() => setDrill(null)}>
          <div className="faint" style={{ marginBottom: 12 }}>{drill.entries.length} title{drill.entries.length === 1 ? '' : 's'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drill.entries.map((e) => (
              <TitleLink className="card row" key={e.id} tmdbId={e.titles?.tmdb_id} media={e.titles?.media_type} style={{ gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, flexShrink: 0 }}>
                  <Poster title={e.titles?.title} mediaType={e.titles?.media_type} posterPath={e.titles?.poster_path} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{e.titles?.title}</strong>
                  <div className="faint">{formatWatched(e.watched_on, e.date_precision)}</div>
                </div>
                <DualScore profiles={profiles} ratings={e.ratings} />
              </TitleLink>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return <div style={{ marginTop: 26 }}><div className="section-head"><h2>{title}</h2></div>{children}</div>
}
function Stat({ v, l, s, color, onClick }) {
  return (
    <div className={`stat ${onClick ? 'clickable' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="v" style={color ? { color } : undefined}>{v}</div>
      <div className="l">{l}</div>
      {s && <div className="s">{s}</div>}
    </div>
  )
}
function Bars({ items, accent, onPick }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="bars">
      {items.map((i) => (
        <button className="bar-row bar-click" key={i.label} onClick={() => onPick({ title: i.label, entries: i.entries })}>
          <span className="bar-label">{i.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(i.value / max) * 100}%`, background: i.color || accent || 'var(--accent)' }} /></div>
          <span className="bar-val">{i.value}</span>
        </button>
      ))}
    </div>
  )
}
function Distribution({ dist, color, onPick }) {
  const max = Math.max(1, ...dist.map((d) => d.count))
  return (
    <div className="dist">
      {dist.map((d, i) => (
        <button key={i} className="d" title={`${i + 1}/10: ${d.count}`}
          onClick={() => d.count && onPick(i + 1, d.entries)}
          style={{ height: `${(d.count / max) * 100}%`, background: d.count ? color : 'var(--bg-elev-2)' }} />
      ))}
    </div>
  )
}

function avgOfEntry(e) {
  const rs = (e.ratings || []).filter((r) => r.score != null)
  return rs.length ? rs.reduce((a, b) => a + b.score, 0) / rs.length : null
}

function compute(entries, profiles, groups) {
  const now = new Date()
  const year = now.getFullYear()
  let movies = 0, tv = 0, episodes = 0, minutes = 0, thisYear = 0
  for (const e of entries) {
    const t = e.titles
    if (t?.media_type === 'tv') { tv++; episodes += e.episodes_watched || 0; minutes += (e.episodes_watched || 0) * (t?.runtime || 40) }
    else { movies++; minutes += t?.runtime || 115 }
    if (e.watched_on && new Date(e.watched_on).getFullYear() === year) thisYear++
  }
  const hours = Math.round(minutes / 60)

  const people = profiles.map((p) => {
    const dist = Array.from({ length: 10 }, () => ({ count: 0, entries: [] }))
    const rated = []
    for (const e of entries) {
      const r = (e.ratings || []).find((x) => x.profile_id === p.id && x.score != null)
      if (r) { rated.push(e); if (r.score >= 1 && r.score <= 10) { dist[r.score - 1].count++; dist[r.score - 1].entries.push(e) } }
    }
    const scores = rated.map((e) => (e.ratings.find((x) => x.profile_id === p.id) || {}).score).filter((x) => x != null)
    const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
    const counts = dist.map((d) => d.count)
    const mode = scores.length ? counts.indexOf(Math.max(...counts)) + 1 : '—'
    return { ...p, count: scores.length, avg, dist, mode, entries: rated.sort((a, b) => (avgOfEntry(b) || 0) - (avgOfEntry(a) || 0)) }
  })

  const both = entries.map((e) => {
    const rs = (e.ratings || []).filter((r) => r.score != null)
    if (rs.length < 2) return null
    const vals = rs.map((r) => r.score)
    return { e, gap: Math.max(...vals) - Math.min(...vals) }
  }).filter(Boolean)
  let agreement = null
  if (both.length) {
    const avgGap = +(both.reduce((a, b) => a + b.gap, 0) / both.length).toFixed(1)
    const agreePct = Math.round((both.filter((b) => b.gap <= 1).length / both.length) * 100)
    const big = both.filter((b) => b.gap >= 3).sort((a, b) => b.gap - a.gap)
    agreement = { avgGap, agreePct, disagreeCount: big.length, topEntries: big.map((b) => b.e) }
  }

  // months (last 12)
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString(undefined, { month: 'short' }), fullLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), count: 0, entries: [] })
  }
  const mIndex = Object.fromEntries(months.map((m, i) => [m.key, i]))
  for (const e of entries) { if (!e.watched_on) continue; const k = String(e.watched_on).slice(0, 7); if (k in mIndex) { months[mIndex[k]].count++; months[mIndex[k]].entries.push(e) } }
  const monthMax = Math.max(0, ...months.map((m) => m.count))

  const bucket = (keyFn) => {
    const m = new Map()
    for (const e of entries) { for (const k of keyFn(e)) { if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(e) } }
    return m
  }
  const toBars = (m, limit) => [...m.entries()].map(([label, ents]) => ({ label, value: ents.length, entries: ents }))
    .sort((a, b) => b.value - a.value).slice(0, limit || 99)

  const genres = toBars(bucket((e) => (e.titles?.genre || '').split(',').map((x) => x.trim())), 8)
  const services = toBars(bucket((e) => [e.service]), 10)
  const wheres = toBars(bucket((e) => [e.where_watched]), 10)
  const decadeMap = bucket((e) => { const y = e.titles?.year; return y ? [`${Math.floor(y / 10) * 10}s`] : [] })
  const decadesBars = [...decadeMap.entries()].map(([label, ents]) => ({ label, value: ents.length, entries: ents })).sort((a, b) => parseInt(a.label) - parseInt(b.label))
  const groupMap = bucket((e) => [e.group_id])
  const byGroup = groups.map((g) => ({ label: g.name, value: (groupMap.get(g.id) || []).length, entries: groupMap.get(g.id) || [], color: g.color })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value)

  const topRated = entries.map((e) => { const a = avgOfEntry(e); return a == null ? null : { id: e.id, tmdb_id: e.titles?.tmdb_id, title: e.titles?.title, media_type: e.titles?.media_type, poster_path: e.titles?.poster_path, avg: +a.toFixed(1) } })
    .filter(Boolean).sort((a, b) => b.avg - a.avg).slice(0, 6)

  return { total: entries.length, movies, tv, episodes, hours, thisYear, year, people, agreement, months, monthMax, genres, services, wheres, decadesBars, byGroup, topRated }
}
