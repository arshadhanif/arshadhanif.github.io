import { useEffect, useMemo, useState } from 'react'
import { listDiary } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Spinner, Empty, GroupChips, Poster } from '../components/ui'

export default function Insights() {
  const { profiles, groups } = useAppData()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)

  useEffect(() => {
    listDiary({ limit: 2000 }).then((d) => { setEntries(d); setLoading(false) })
  }, [])

  const data = useMemo(
    () => (groupId ? entries.filter((e) => e.group_id === groupId) : entries),
    [entries, groupId]
  )

  const stats = useMemo(() => computeStats(data, profiles, groups), [data, profiles, groups])

  if (loading) return <div className="page"><Spinner label="Crunching your numbers…" /></div>

  return (
    <div className="page">
      <h1>Insights</h1>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {data.length === 0 ? (
        <Empty icon="📊">No watches logged yet{groupId ? ' for this group' : ''}. Mark a few things watched and your stats appear here.</Empty>
      ) : (
        <>
          {/* headline numbers */}
          <div className="stat-grid" style={{ marginBottom: 26 }}>
            <Stat v={stats.total} l="Watches logged" />
            <Stat v={stats.movies} l="Movies" />
            <Stat v={stats.tv} l="TV shows" />
            {stats.episodes > 0 && <Stat v={stats.episodes} l="Episodes" />}
            {stats.people.map((p) => (
              <Stat key={p.id} v={p.avg ?? '—'} l={`${p.name}'s avg`} s={`${p.count} rated`} color={p.color} />
            ))}
          </div>

          {/* how each person rates */}
          {stats.people.some((p) => p.count > 0) && (
            <Section title="How you each rate">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
                {stats.people.filter((p) => p.count > 0).map((p) => (
                  <div className="card" key={p.id}>
                    <div className="spread" style={{ marginBottom: 12 }}>
                      <strong style={{ color: p.color }}>{p.name}</strong>
                      <span className="score" style={{ borderColor: p.color, color: p.color }}>avg {p.avg}</span>
                    </div>
                    <Distribution dist={p.dist} color={p.color} />
                    <div className="faint" style={{ marginTop: 8 }}>
                      {p.count} ratings · most given: {p.mode}/10
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* agreement between the two of you */}
          {stats.agreement && (
            <Section title="🥊 Where you agree & disagree">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 14 }}>
                <Stat v={stats.agreement.avgGap} l="Avg rating gap" s="lower = closer taste" />
                <Stat v={`${stats.agreement.agreePct}%`} l="You agree" s="within 1 point" color="var(--green)" />
                <Stat v={stats.agreement.disagreeCount} l="Big disagreements" s="3+ points apart" color="var(--pink)" />
              </div>
              {stats.agreement.top.length > 0 && (
                <div className="card">
                  <div className="faint" style={{ marginBottom: 10 }}>Biggest splits</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.agreement.top.map((t) => (
                      <div className="spread" key={t.id}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                        <span className="dual">
                          {t.scores.map((s) => (
                            <span className="score" key={s.id} style={{ borderColor: s.color, color: s.color }}>
                              {initials2(s.name)} {s.score}
                            </span>
                          ))}
                          <span className="score" style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }}>Δ{t.gap}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* watches over time */}
          {stats.months.some((m) => m.count > 0) && (
            <Section title="Watches over time">
              <div className="card">
                <div className="cols">
                  {stats.months.map((m) => (
                    <div className="col" key={m.key} title={`${m.label}: ${m.count}`}>
                      <div className="fill" style={{ height: `${stats.monthMax ? (m.count / stats.monthMax) * 100 : 0}%` }} />
                      <span className="cl">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* by group */}
          {!groupId && stats.byGroup.length > 1 && (
            <Section title="By group">
              <div className="card"><BarChart items={stats.byGroup} /></div>
            </Section>
          )}

          {/* genres + decades side by side */}
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))' }}>
            {stats.genres.length > 0 && (
              <Section title="Top genres">
                <div className="card"><BarChart items={stats.genres} /></div>
              </Section>
            )}
            {stats.decades.length > 0 && (
              <Section title="By decade">
                <div className="card"><BarChart items={stats.decades} accent="var(--accent-2)" /></div>
              </Section>
            )}
          </div>

          {/* highest rated */}
          {stats.topRated.length > 0 && (
            <Section title="Highest rated">
              <div className="grid">
                {stats.topRated.map((t) => (
                  <div key={t.id}>
                    <Poster title={t.title} mediaType={t.media_type} posterPath={t.poster_path} />
                    <div className="tile-title">{t.title}</div>
                    <div className="tile-sub" style={{ color: 'var(--accent)' }}>★ {t.avg} avg</div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

/* ---------- pieces ---------- */
function Section({ title, children }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div className="section-head"><h2>{title}</h2></div>
      {children}
    </div>
  )
}
function Stat({ v, l, s, color }) {
  return (
    <div className="stat">
      <div className="v" style={color ? { color } : undefined}>{v}</div>
      <div className="l">{l}</div>
      {s && <div className="s">{s}</div>}
    </div>
  )
}
function BarChart({ items, accent }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="bars">
      {items.map((i) => (
        <div className="bar-row" key={i.label}>
          <span className="bar-label">{i.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(i.value / max) * 100}%`, background: i.color || accent || 'var(--accent)' }} />
          </div>
          <span className="bar-val">{i.value}</span>
        </div>
      ))}
    </div>
  )
}
function Distribution({ dist, color }) {
  const max = Math.max(1, ...dist)
  return (
    <div className="dist">
      {dist.map((c, i) => (
        <div key={i} className="d" title={`${i + 1}/10: ${c}`}
          style={{ height: `${(c / max) * 100}%`, background: c ? color : 'var(--bg-elev-2)' }} />
      ))}
    </div>
  )
}
function initials2(name = '') {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

/* ---------- stats engine ---------- */
function computeStats(entries, profiles, groups) {
  const total = entries.length
  let movies = 0, tv = 0, episodes = 0
  for (const e of entries) {
    if (e.titles?.media_type === 'tv') { tv++; episodes += e.episodes_watched || 0 }
    else movies++
  }

  // per-person
  const people = profiles.map((p) => {
    const scores = entries.flatMap((e) => (e.ratings || []).filter((r) => r.profile_id === p.id).map((r) => r.score))
    const dist = Array(10).fill(0)
    scores.forEach((s) => { if (s >= 1 && s <= 10) dist[s - 1]++ })
    const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
    const mode = scores.length ? dist.indexOf(Math.max(...dist)) + 1 : '—'
    return { ...p, count: scores.length, avg, dist, mode }
  })

  // agreement (entries where 2+ people rated)
  const both = entries
    .map((e) => {
      const rs = (e.ratings || []).filter((r) => r.score != null)
      if (rs.length < 2) return null
      const withNames = rs.map((r) => {
        const pr = profiles.find((p) => p.id === r.profile_id)
        return { id: r.profile_id, score: r.score, name: pr?.name || '?', color: pr?.color || '#888' }
      })
      const vals = rs.map((r) => r.score)
      const gap = Math.max(...vals) - Math.min(...vals)
      return { id: e.id, title: e.titles?.title || '—', gap, scores: withNames }
    })
    .filter(Boolean)
  let agreement = null
  if (both.length) {
    const avgGap = +(both.reduce((a, b) => a + b.gap, 0) / both.length).toFixed(1)
    const agreePct = Math.round((both.filter((b) => b.gap <= 1).length / both.length) * 100)
    const disagreeCount = both.filter((b) => b.gap >= 3).length
    const top = [...both].sort((a, b) => b.gap - a.gap).slice(0, 5)
    agreement = { avgGap, agreePct, disagreeCount, top }
  }

  // months (last 12)
  const monthKeys = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      count: 0,
    })
  }
  const mIndex = Object.fromEntries(monthKeys.map((m, i) => [m.key, i]))
  for (const e of entries) {
    if (!e.watched_on) continue
    const key = String(e.watched_on).slice(0, 7)
    if (key in mIndex) monthKeys[mIndex[key]].count++
  }
  const monthMax = Math.max(0, ...monthKeys.map((m) => m.count))

  // by group
  const groupCounts = {}
  for (const e of entries) if (e.group_id) groupCounts[e.group_id] = (groupCounts[e.group_id] || 0) + 1
  const byGroup = groups
    .map((g) => ({ label: g.name, value: groupCounts[g.id] || 0, color: g.color }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)

  // genres
  const genreCounts = {}
  for (const e of entries) {
    const g = e.titles?.genre
    if (!g) continue
    g.split(',').map((s) => s.trim()).filter(Boolean).forEach((name) => {
      genreCounts[name] = (genreCounts[name] || 0) + 1
    })
  }
  const genres = Object.entries(genreCounts).map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8)

  // decades
  const decadeCounts = {}
  for (const e of entries) {
    const y = e.titles?.year
    if (!y) continue
    const dec = Math.floor(y / 10) * 10
    decadeCounts[dec] = (decadeCounts[dec] || 0) + 1
  }
  const decades = Object.entries(decadeCounts).map(([d, value]) => ({ label: `${d}s`, value }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label))

  // top rated (avg of available ratings)
  const topRated = entries
    .map((e) => {
      const rs = (e.ratings || []).filter((r) => r.score != null)
      if (!rs.length) return null
      const avg = +(rs.reduce((a, b) => a + b.score, 0) / rs.length).toFixed(1)
      return { id: e.id, title: e.titles?.title, media_type: e.titles?.media_type, poster_path: e.titles?.poster_path, avg }
    })
    .filter(Boolean)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6)

  return { total, movies, tv, episodes, people, agreement, months: monthKeys, monthMax, byGroup, genres, decades, topRated }
}
