import { useEffect, useMemo, useState } from 'react'
import { listDiary, listEpisodeDiary, listAllSeasonRatings } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Spinner, Empty, GroupChips, Poster, TitleLink, DualScore, Modal } from '../components/ui'
import { formatWatched, fmtDate } from '../lib/dates'
import { getPref, setPref } from '../lib/prefs'

export default function Insights() {
  const { profiles, groups } = useAppData()
  const [entries, setEntries] = useState([])
  const [eps, setEps] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [mediaType, setMediaType] = useState('all')
  const [decade, setDecade] = useState('all')
  const [drill, setDrill] = useState(null)     // { title, entries }
  const [epDrill, setEpDrill] = useState(null)  // { title, eps }
  const [seasonR, setSeasonR] = useState([])

  useEffect(() => {
    Promise.all([listDiary({ limit: 20000 }), listEpisodeDiary({ limit: 100000 })])
      .then(([d, e]) => { setEntries(d); setEps(e) })
      .finally(() => setLoading(false))
    listAllSeasonRatings().then(setSeasonR).catch(() => {})
  }, [])

  // Best & worst rated seasons (averaged across whoever rated each season).
  const seasons = useMemo(() => {
    const m = new Map()
    for (const r of seasonR) {
      const t = r.titles; if (!t) continue
      const k = `${t.id}-${r.season_number}`
      if (!m.has(k)) m.set(k, { t, season: r.season_number, scores: [] })
      m.get(k).scores.push(r.score)
    }
    const arr = [...m.values()].map((x) => ({ ...x, avg: +(x.scores.reduce((a, b) => a + b, 0) / x.scores.length).toFixed(1) }))
    arr.sort((a, b) => b.avg - a.avg)
    return arr
  }, [seasonR])

  // Episodes respond to the same group + decade filters as the rest of the page
  // so every card refreshes together (media type is moot: episodes are all TV).
  const epData = useMemo(() => eps.filter((e) => {
    if (groupId && e.group_id !== groupId) return false
    if (decade !== 'all') { const y = e.titles?.year; if (!y || Math.floor(y / 10) * 10 !== Number(decade)) return false }
    return true
  }), [eps, groupId, decade])
  const es = useMemo(() => computeEpisodes(epData), [epData])

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
  const streaks = useMemo(() => computeStreaks(data, epData), [data, epData])
  const groupCompare = useMemo(() => computeGroupCompare(entries, eps, groups), [entries, eps, groups])

  // Yearly goals (personal, unaffected by filters; targets stored locally).
  const year = new Date().getFullYear()
  const ys = String(year)
  const yearMovies = entries.filter((e) => e.titles?.media_type !== 'tv' && String(e.watched_on || '').slice(0, 4) === ys).length
  const yearEps = eps.filter((e) => String(e.watched_on || '').slice(0, 4) === ys).length
  const [goalFilms, setGoalFilms] = useState(getPref('goalFilms', 50))
  const [goalEps, setGoalEps] = useState(getPref('goalEps', 100))

  // Lifetime watch-time (all watches + episodes, unaffected by filters).
  const lifeMin = entries.filter((e) => e.titles?.media_type !== 'tv').reduce((a, e) => a + (e.titles?.runtime || 115) * (1 + (e.rewatch_count || 0)), 0)
    + eps.reduce((a, e) => a + (e.titles?.runtime || 40) * (1 + (e.rewatch_count || 0)), 0)
  const lifeHours = Math.round(lifeMin / 60)
  const lifeDays = (lifeMin / 1440).toFixed(1)

  // Decade challenge: which decades you've watched a title from.
  const decadeChallenge = useMemo(() => {
    const covered = new Set(entries.map((e) => e.titles?.year).filter(Boolean).map((y) => Math.floor(y / 10) * 10))
    const nowDec = Math.floor(year / 10) * 10
    const all = []
    for (let d = 1950; d <= nowDec; d += 10) all.push({ d, on: covered.has(d) })
    return { all, done: all.filter((x) => x.on).length }
  }, [entries, year])

  if (loading) return <div className="page"><Spinner label="Crunching your numbers…" /></div>

  return (
    <div className="page">
      <h1>Insights</h1>

      {lifeHours > 0 && (
        <div className="lifetime-banner">
          You’ve spent <strong>{lifeHours.toLocaleString()} hours</strong> watching, about <strong>{lifeDays} days</strong> of your life on screen. 🍿
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="spread" style={{ marginBottom: 12 }}><strong>🎯 {year} goals</strong></div>
        <div className="goal-grid">
          <GoalBar label="Films" current={yearMovies} target={goalFilms}
            onSet={(v) => { setGoalFilms(v); setPref('goalFilms', v) }} />
          <GoalBar label="Episodes" current={yearEps} target={goalEps}
            onSet={(v) => { setGoalEps(v); setPref('goalEps', v) }} />
        </div>
      </div>

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

      {data.length === 0 && es.total === 0 ? (
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
            {s.people.filter((p) => p.count > 0).map((p) => (
              <Stat key={p.id} v={p.avg ?? 'N/A'} l={`${p.name}'s avg`} s={`${p.count} rated · tap`} color={p.color}
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

          {seasons.length > 0 && (
            <Section title="🏆 Best & worst seasons">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
                <div className="card">
                  <strong style={{ color: 'var(--green)' }}>Top rated seasons</strong>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {seasons.slice(0, 5).map((x) => <SeasonRow key={`${x.t.id}-${x.season}`} x={x} />)}
                  </div>
                </div>
                {seasons.length > 5 && (
                  <div className="card">
                    <strong style={{ color: 'var(--pink)' }}>Lowest rated seasons</strong>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...seasons].slice(-5).reverse().map((x) => <SeasonRow key={`${x.t.id}-${x.season}`} x={x} />)}
                    </div>
                  </div>
                )}
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

          {mediaType !== 'movie' && es.total > 0 && (
            <Section title="📺 Episode activity">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 14 }}>
                <Stat v={es.total} l="Episodes watched" />
                <Stat v={es.hours} l="Hours of TV" s="approx" />
                <Stat v={es.showCount} l="Shows" />
                <Stat v={es.busiest ? es.busiest.count : 0} l="Best day" s={es.busiest ? fmtDate(es.busiest.day) : 'episodes in a day'} />
              </div>

              {es.months.some((m) => m.count > 0) && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="faint" style={{ marginBottom: 8 }}>Episodes per month (last 12)</div>
                  <div className="cols">
                    {es.months.map((m) => (
                      <button className="col" key={m.key} title={`${m.label}: ${m.count}`}
                        onClick={() => m.eps.length && setEpDrill({ title: `Episodes in ${m.fullLabel}`, eps: m.eps })}>
                        <div className="fill" style={{ height: `${es.monthMax ? (m.count / es.monthMax) * 100 : 0}%` }} />
                        <span className="cl">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Section title="Most-watched shows">
                <div className="card"><Bars items={es.topShows} accent="var(--accent)"
                  onPick={({ entries }) => setEpDrill({ title: entries[0]?.titles?.title || 'Show', eps: entries })} /></div>
              </Section>

              <YearHeatmap days={es.heatmap} year={es.hmYear} onPick={(day, list) => list.length && setEpDrill({ title: `Episodes on ${fmtDate(day)}`, eps: list })} />
            </Section>
          )}

          {streaks && (
            <Section title="🔥 Watch streaks">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))' }}>
                <Stat v={streaks.current} l="Current streak" s={streaks.current ? 'days in a row' : 'watch today to start one'} color={streaks.current ? 'var(--green)' : undefined} />
                <Stat v={streaks.longest} l="Longest streak" s={streaks.longestStart ? `${fmtDate(streaks.longestStart)} → ${fmtDate(streaks.longestEnd)}` : 'days in a row'} />
                <Stat v={streaks.totalDays} l="Active days" s="days with a watch" />
                <Stat v={streaks.thisMonth} l="Active this month" s="days so far" />
              </div>
            </Section>
          )}

          {groupCompare.length > 1 && (
            <Section title="👥 Compare groups">
              <div className="goal-grid">
                {groupCompare.map((gc) => (
                  <div className="card" key={gc.g.id} style={{ borderTop: `3px solid ${gc.g.color}` }}>
                    <strong style={{ color: gc.g.color }}>{gc.g.name}</strong>
                    <div className="cmp-row"><span>Watches</span><b>{gc.total}</b></div>
                    <div className="cmp-row"><span>Movies / TV</span><b>{gc.movies} / {gc.tv}</b></div>
                    <div className="cmp-row"><span>Episodes</span><b>{gc.episodes}</b></div>
                    <div className="cmp-row"><span>Avg rating</span><b>{gc.avg != null ? `★ ${gc.avg}` : 'N/A'}</b></div>
                    <div className="cmp-row"><span>Top genre</span><b>{gc.topGenre || 'N/A'}</b></div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title={`🕰️ Decade challenge · ${decadeChallenge.done}/${decadeChallenge.all.length}`}>
            <div className="card">
              <div className="faint" style={{ marginBottom: 10 }}>Watch a title from every decade.</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {decadeChallenge.all.map(({ d, on }) => (
                  <span key={d} className={`decade-chip ${on ? 'on' : ''}`}>{on ? '✓ ' : ''}{d}s</span>
                ))}
              </div>
            </div>
          </Section>

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

      {epDrill && (
        <Modal title={epDrill.title} onClose={() => setEpDrill(null)}>
          <div className="faint" style={{ marginBottom: 12 }}>{epDrill.eps.length} episode{epDrill.eps.length === 1 ? '' : 's'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {epDrill.eps.slice(0, 200).map((e) => (
              <TitleLink className="card row" key={e.id} tmdbId={e.titles?.tmdb_id} media="tv" style={{ gap: 12, alignItems: 'center' }}>
                <div style={{ width: 38, flexShrink: 0 }}>
                  <Poster title={e.titles?.title} mediaType="tv" posterPath={e.titles?.poster_path} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{e.titles?.title} <span className="faint">S{e.season_number}·E{e.episode_number}</span></strong>
                  <div className="faint">{e.watched_on ? fmtDate(e.watched_on) : 'Date not set'}{e.groups && <> · <span style={{ color: e.groups.color }}>{e.groups.name}</span></>}</div>
                </div>
                {e.rating != null && <span className="score" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>★ {e.rating}</span>}
              </TitleLink>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

// GitHub-style watch calendar for the most recent 12 months of episode activity.
function YearHeatmap({ days, year, onPick }) {
  if (!days || !days.size) return null
  const max = Math.max(1, ...days.values())
  // Build a grid of weeks (columns) x 7 weekdays for the last 53 weeks.
  const end = new Date()
  const start = new Date(end); start.setDate(start.getDate() - 7 * 52 - end.getDay())
  const cells = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    cells.push({ key, count: days.get(key)?.length || 0, list: days.get(key) || [] })
  }
  const lvl = (c) => c === 0 ? 0 : c >= max * 0.75 ? 4 : c >= max * 0.5 ? 3 : c >= max * 0.25 ? 2 : 1
  return (
    <div className="card" style={{ marginTop: 14, overflowX: 'auto' }}>
      <div className="faint" style={{ marginBottom: 8 }}>Watch calendar · last 12 months</div>
      <div className="heat">
        {cells.map((c) => (
          <button key={c.key} className={`heat-cell l${lvl(c.count)}`} title={`${fmtDate(c.key)}: ${c.count} episode${c.count === 1 ? '' : 's'}`}
            onClick={() => onPick(c.key, c.list)} />
        ))}
      </div>
    </div>
  )
}

function GoalBar({ label, current, target, onSet }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const done = target > 0 && current >= target
  return (
    <div className="goal">
      <div className="spread" style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span className="faint">
          {current} / <input className="goal-input" type="number" min="0" value={target}
            onChange={(e) => onSet(Math.max(0, Number(e.target.value) || 0))} /> {done && '✓'}
        </span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: done ? 'var(--green)' : 'var(--accent)' }} /></div>
      <div className="faint" style={{ marginTop: 5, fontSize: 12 }}>
        {done ? `Goal smashed! ${current - target} over` : target > 0 ? `${pct}% · ${target - current} to go` : 'Set a target'}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return <div style={{ marginTop: 26 }}><div className="section-head"><h2>{title}</h2></div>{children}</div>
}

function SeasonRow({ x }) {
  const color = x.avg >= 8 ? 'var(--green)' : x.avg >= 6 ? 'var(--accent)' : 'var(--pink)'
  return (
    <TitleLink className="row" tmdbId={x.t.tmdb_id} media={x.t.media_type} style={{ gap: 10, alignItems: 'center' }}>
      <div style={{ width: 34, flexShrink: 0 }}>
        <Poster title={x.t.title} mediaType={x.t.media_type} posterPath={x.t.poster_path} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.t.title}</div>
        <div className="faint" style={{ fontSize: 12 }}>Season {x.season}</div>
      </div>
      <span className="score" style={{ borderColor: color, color, flexShrink: 0 }}>{x.avg}</span>
    </TitleLink>
  )
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

// Per-group comparison: watches, episodes, avg rating and top genre for each group.
function computeGroupCompare(entries, eps, groups) {
  return (groups || []).map((g) => {
    const ge = entries.filter((e) => e.group_id === g.id)
    const episodes = eps.filter((e) => e.group_id === g.id).length
    const scores = ge.flatMap((e) => (e.ratings || []).map((r) => r.score)).filter((s) => s != null)
    const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
    const gc = {}
    for (const e of ge) for (const gn of (e.titles?.genre || '').split(',').map((x) => x.trim()).filter(Boolean)) gc[gn] = (gc[gn] || 0) + 1
    const topGenre = Object.entries(gc).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    return {
      g, total: ge.length, episodes, avg, topGenre,
      movies: ge.filter((e) => e.titles?.media_type !== 'tv').length,
      tv: ge.filter((e) => e.titles?.media_type === 'tv').length,
    }
  }).filter((x) => x.total > 0 || x.episodes > 0)
}

// Streaks across ANY watch activity (movies + episodes), one tick per calendar day.
function computeStreaks(diary, eps) {
  const days = new Set()
  for (const e of diary) if (e.watched_on) days.add(String(e.watched_on).slice(0, 10))
  for (const e of eps) if (e.watched_on) days.add(String(e.watched_on).slice(0, 10))
  if (!days.size) return null
  const DAY = 864e5
  const at = (k) => new Date(k + 'T00:00:00').getTime()      // local midnight
  const localKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const sorted = [...days].sort()

  let longest = 1, run = 1, longestEnd = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (Math.round((at(sorted[i]) - at(sorted[i - 1])) / DAY) === 1) {
      run++; if (run > longest) { longest = run; longestEnd = sorted[i] }
    } else run = 1
  }
  const longestStart = localKey(at(longestEnd) - (longest - 1) * DAY)

  // Current streak: walk back from today (allow it to still count if today is blank but yesterday isn't).
  const todayKey = localKey(Date.now())
  let cur = 0, cursor = days.has(todayKey) ? at(todayKey) : at(todayKey) - DAY
  while (days.has(localKey(cursor))) { cur++; cursor -= DAY }

  const ymNow = todayKey.slice(0, 7)
  const thisMonth = [...days].filter((d) => d.slice(0, 7) === ymNow).length

  return { longest, longestStart, longestEnd, current: cur, totalDays: days.size, thisMonth }
}

function computeEpisodes(eps) {
  const now = new Date()
  let minutes = 0
  for (const e of eps) minutes += (e.titles?.runtime || 40) * (1 + (e.rewatch_count || 0))
  const hours = Math.round(minutes / 60)

  // last 12 months
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      fullLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), count: 0, eps: [] })
  }
  const mIndex = Object.fromEntries(months.map((m, i) => [m.key, i]))

  const byShow = new Map()        // title_id -> { entries }
  const byDay = new Map()         // yyyy-mm-dd -> [eps]
  for (const e of eps) {
    const tid = e.titles?.id
    if (tid) { if (!byShow.has(tid)) byShow.set(tid, []); byShow.get(tid).push(e) }
    if (e.watched_on) {
      const mk = String(e.watched_on).slice(0, 7)
      if (mk in mIndex) { months[mIndex[mk]].count++; months[mIndex[mk]].eps.push(e) }
      const dk = String(e.watched_on).slice(0, 10)
      if (!byDay.has(dk)) byDay.set(dk, []); byDay.get(dk).push(e)
    }
  }
  const monthMax = Math.max(0, ...months.map((m) => m.count))

  const topShows = [...byShow.values()].map((list) => ({ label: list[0]?.titles?.title || 'N/A', value: list.length, entries: list }))
    .sort((a, b) => b.value - a.value).slice(0, 8)

  let busiest = null
  for (const [day, list] of byDay) if (!busiest || list.length > busiest.count) busiest = { day, count: list.length }

  return { total: eps.length, hours, showCount: byShow.size, months, monthMax, topShows, heatmap: byDay, hmYear: now.getFullYear(), busiest }
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
    else { movies++; minutes += (t?.runtime || 115) * (1 + (e.rewatch_count || 0)) }
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
    const mode = scores.length ? counts.indexOf(Math.max(...counts)) + 1 : 'N/A'
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
