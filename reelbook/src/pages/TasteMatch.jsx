import { useEffect, useMemo, useState } from 'react'
import { listDiary, listWatchlist, listAllSeasonRatings } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, TitleLink, initials } from '../components/ui'

const keyOf = (e) => `${e.titles?.media_type}-${e.titles?.tmdb_id}`

export default function TasteMatch() {
  const { profiles } = useAppData()
  const [entries, setEntries] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [seasonR, setSeasonR] = useState([])
  const [loading, setLoading] = useState(true)
  // Diary ratings carry profile_id, not a name, so resolve names from profiles.
  const nameOf = (pid) => profiles.find((p) => p.id === pid)?.name || 'Someone'

  useEffect(() => {
    Promise.all([listDiary({ limit: 2000 }), listWatchlist()])
      .then(([d, w]) => { setEntries(d); setWatchlist(w) })
      .finally(() => setLoading(false))
    listAllSeasonRatings().then(setSeasonR).catch(() => {})
  }, [])

  // Season-level clashes: same season rated by 2+ people with a 3+ gap.
  const seasonClashes = useMemo(() => {
    const m = new Map()
    for (const r of seasonR) {
      const t = r.titles; if (!t) continue
      const k = `${t.id}-${r.season_number}`
      if (!m.has(k)) m.set(k, { t, season: r.season_number, scores: [] })
      m.get(k).scores.push({ name: r.profiles?.name, score: r.score })
    }
    return [...m.values()]
      .filter((x) => x.scores.length >= 2)
      .map((x) => { const v = x.scores.map((s) => s.score); return { ...x, gap: Math.max(...v) - Math.min(...v) } })
      .filter((x) => x.gap >= 3)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8)
  }, [seasonR])

  const data = useMemo(() => {
    // entries where at least two people rated
    const both = []
    for (const e of entries) {
      const rs = (e.ratings || []).filter((r) => r.score != null)
      if (rs.length < 2) continue
      const vals = rs.map((r) => r.score)
      both.push({ e, rs, gap: Math.max(...vals) - Math.min(...vals), min: Math.min(...vals) })
    }
    const matchPct = both.length ? Math.round((both.filter((b) => b.gap <= 1).length / both.length) * 100) : null
    const avgGap = both.length ? +(both.reduce((a, b) => a + b.gap, 0) / both.length).toFixed(1) : null

    // per-person average (the tougher critic rates lower)
    const byName = {}
    for (const e of entries) for (const r of e.ratings || []) {
      if (r.score == null) continue
      const nm = nameOf(r.profile_id)
      ;(byName[nm] = byName[nm] || []).push(r.score)
    }
    const critics = Object.entries(byName).map(([name, arr]) => ({ name, avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1), n: arr.length }))
      .sort((a, b) => a.avg - b.avg)

    // shared loves: everyone who rated gave 8+
    const lovesSeen = new Set()
    const sharedLoves = both.filter((b) => b.min >= 8).map((b) => b.e).filter((e) => { const k = keyOf(e); if (lovesSeen.has(k)) return false; lovesSeen.add(k); return true })

    // biggest clashes
    const clashes = both.filter((b) => b.gap >= 3).sort((a, b) => b.gap - a.gap).slice(0, 8)

    // watch-together: shared watchlist (dedup)
    const wseen = new Set()
    const together = watchlist.filter((w) => w.titles && !wseen.has(`${w.titles.media_type}-${w.titles.tmdb_id}`) && wseen.add(`${w.titles.media_type}-${w.titles.tmdb_id}`))

    return { both, matchPct, avgGap, critics, sharedLoves, clashes, together, count: both.length }
  }, [entries, watchlist, profiles])

  if (loading) return <div className="page"><Spinner label="Comparing your tastes…" /></div>

  const names = (profiles || []).map((p) => p.name).filter(Boolean)
  const headline = names.length >= 2 ? names.slice(0, 2).join(' & ') : (names[0] || 'You')

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <h1>Taste Match</h1>
      <p className="sub">How {headline}’s tastes line up, based on titles you’ve both rated.</p>

      {data.count === 0 ? (
        <Empty icon="❤️">Rate some of the same titles and your match score, shared loves and clashes will show up here.</Empty>
      ) : (
        <>
          <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
            <MatchRing pct={data.matchPct} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {(profiles || []).map((p) => (
                  <span key={p.id} className="row" style={{ gap: 6 }}>
                    <span className="avatar" style={{ width: 26, height: 26, fontSize: 11, background: p.color || 'var(--accent-2)' }}>{initials(p.name)}</span>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </span>
                ))}
              </div>
              <div className="faint">You’ve both rated <strong>{data.count}</strong> title{data.count === 1 ? '' : 's'} · average rating gap <strong>{data.avgGap}</strong></div>
              {data.critics.length >= 2 && (
                <div className="faint" style={{ marginTop: 6 }}>
                  🧊 Tougher critic: <strong>{data.critics[0].name}</strong> (avg {data.critics[0].avg}) ·
                  😊 Easier to please: <strong>{data.critics[data.critics.length - 1].name}</strong> (avg {data.critics[data.critics.length - 1].avg})
                </div>
              )}
            </div>
          </div>

          {data.sharedLoves.length > 0 && (
            <Section title="💞 You both loved">
              <Rail entries={data.sharedLoves} />
            </Section>
          )}

          {data.together.length > 0 && (
            <Section title="🍿 To watch together">
              <Rail entries={data.together.map((w) => ({ titles: w.titles }))} />
            </Section>
          )}

          {data.clashes.length > 0 && (
            <Section title="🥊 Where you clash most">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.clashes.map(({ e, rs, gap }) => (
                  <TitleLink key={keyOf(e)} className="card row" tmdbId={e.titles.tmdb_id} media={e.titles.media_type} style={{ gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 42, flexShrink: 0 }}>
                      <Poster title={e.titles.title} mediaType={e.titles.media_type} posterPath={e.titles.poster_path} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{e.titles.title}</strong>
                      <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        {rs.map((r, idx) => <span key={idx} className="faint">{nameOf(r.profile_id)}: <strong style={{ color: 'var(--text)' }}>{r.score}</strong></span>)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, color: 'var(--pink)', fontWeight: 800 }}>{gap} apart</div>
                  </TitleLink>
                ))}
              </div>
            </Section>
          )}

          {seasonClashes.length > 0 && (
            <Section title="📺 Season clashes">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {seasonClashes.map((x) => (
                  <TitleLink key={`${x.t.id}-${x.season}`} className="card row" tmdbId={x.t.tmdb_id} media={x.t.media_type} style={{ gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 42, flexShrink: 0 }}>
                      <Poster title={x.t.title} mediaType={x.t.media_type} posterPath={x.t.poster_path} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{x.t.title} <span className="faint">· Season {x.season}</span></strong>
                      <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        {x.scores.map((s, idx) => <span key={idx} className="faint">{s.name}: <strong style={{ color: 'var(--text)' }}>{s.score}</strong></span>)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, color: 'var(--pink)', fontWeight: 800 }}>{x.gap} apart</div>
                  </TitleLink>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function MatchRing({ pct }) {
  const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--pink)'
  return (
    <div style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
      background: `conic-gradient(${color} ${pct * 3.6}deg, var(--bg-elev-2) 0)` }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-elev)', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{pct}%</div>
          <div className="faint" style={{ fontSize: 11 }}>match</div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, extra }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="section-head"><h2 style={{ fontSize: 18 }}>{title}</h2>{extra}</div>
      {children}
    </div>
  )
}

function Rail({ entries }) {
  return (
    <div className="scroll-x rail">
      {entries.map((e, i) => (
        <TitleLink className="tile rail-item" key={`${keyOf(e)}-${i}`} tmdbId={e.titles.tmdb_id} media={e.titles.media_type}>
          <Poster title={e.titles.title} mediaType={e.titles.media_type} posterPath={e.titles.poster_path} />
          <div className="tile-title">{e.titles.title}</div>
        </TitleLink>
      ))}
    </div>
  )
}
