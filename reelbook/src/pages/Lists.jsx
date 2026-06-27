import { useEffect, useState } from 'react'
import { listDiary, listWatchlist } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, DualScore } from '../components/ui'

export default function Lists() {
  const { groups, profiles } = useAppData()
  const [groupId, setGroupId] = useState(null)
  const [view, setView] = useState('group') // 'group' | 'disagree'
  const [watchlist, setWatchlist] = useState([])
  const [diary, setDiary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([listWatchlist(groupId), listDiary({ groupId })]).then(([w, d]) => {
      if (!alive) return
      setWatchlist(w); setDiary(d); setLoading(false)
    })
    return () => { alive = false }
  }, [groupId])

  // Disagreements: watches where 2+ people rated and the spread is >= 3.
  const disagreements = diary
    .map((e) => {
      const scores = (e.ratings || []).filter((r) => r.score != null)
      if (scores.length < 2) return null
      const vals = scores.map((s) => s.score)
      const spread = Math.max(...vals) - Math.min(...vals)
      return spread >= 3 ? { entry: e, spread } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.spread - a.spread)

  return (
    <div className="page">
      <h1>Lists</h1>

      <div className="scroll-x" style={{ marginBottom: 12 }}>
        <button className={`chip ${view === 'group' ? 'active' : ''}`}
          style={view === 'group' ? { background: 'var(--text)', borderColor: 'var(--text)' } : undefined}
          onClick={() => setView('group')}>By group</button>
        <button className={`chip ${view === 'disagree' ? 'active' : ''}`}
          style={view === 'disagree' ? { background: 'var(--pink)', borderColor: 'var(--pink)', color: '#0d0f14' } : undefined}
          onClick={() => setView('disagree')}>🥊 Where we disagree</button>
      </div>

      {view === 'group' && (
        <GroupChips groups={groups} value={groupId} onChange={setGroupId} />
      )}

      {loading ? <Spinner /> : view === 'group' ? (
        <>
          <Section title="Want to watch" count={watchlist.length}>
            {watchlist.length === 0 ? <Empty>Empty</Empty> : (
              <div className="grid">
                {watchlist.map((it) => (
                  <PosterTile key={it.id} t={it.titles} group={it.groups} />
                ))}
              </div>
            )}
          </Section>
          <Section title="Watched" count={diary.length}>
            {diary.length === 0 ? <Empty>Nothing watched yet</Empty> : (
              <div className="grid">
                {diary.map((e) => (
                  <PosterTile key={e.id} t={e.titles} group={e.groups}
                    footer={<DualScore profiles={profiles} ratings={e.ratings} />} />
                ))}
              </div>
            )}
          </Section>
        </>
      ) : (
        <Section title="Biggest rating gaps" count={disagreements.length}>
          {disagreements.length === 0 ? (
            <Empty>No disagreements yet — rate the same titles to see where your tastes diverge.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {disagreements.map(({ entry, spread }) => (
                <div key={entry.id} className="card row" style={{ gap: 12 }}>
                  <div style={{ width: 48, flexShrink: 0 }}>
                    <Poster title={entry.titles?.title} mediaType={entry.titles?.media_type} posterPath={entry.titles?.poster_path} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{entry.titles?.title}</strong>
                    <div style={{ marginTop: 6 }}><DualScore profiles={profiles} ratings={entry.ratings} /></div>
                  </div>
                  <span className="score" style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }}>Δ {spread}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>{title}</h2>
        <span className="faint">{count}</span>
      </div>
      {children}
    </div>
  )
}

function PosterTile({ t, group, footer }) {
  return (
    <div>
      <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
      <div className="tile-title">{t?.title}</div>
      <div className="tile-sub">
        {t?.year || '—'}
        {group && <> · <span style={{ color: group.color }}>{group.name}</span></>}
      </div>
      {footer && <div style={{ marginTop: 4 }}>{footer}</div>}
    </div>
  )
}
