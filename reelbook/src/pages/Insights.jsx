import { useEffect, useState } from 'react'
import { listDiary } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Spinner } from '../components/ui'

// Insights is intentionally a light preview for now — full version is deferred (built last).
export default function Insights() {
  const { profiles } = useAppData()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDiary({ limit: 1000 }).then((d) => { setEntries(d); setLoading(false) })
  }, [])

  if (loading) return <div className="page"><Spinner /></div>

  const totalWatches = entries.length
  const perPerson = profiles.map((p) => {
    const scores = entries.flatMap((e) => (e.ratings || []).filter((r) => r.profile_id === p.id).map((r) => r.score))
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'
    return { ...p, count: scores.length, avg }
  })

  return (
    <div className="page">
      <h1>Insights <span className="faint" style={{ fontSize: 14 }}>· preview</span></h1>
      <div className="banner">Full Insights (trends, decades, genre breakdowns) is the last thing we’ll build. Here’s a quick taste.</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))' }}>
        <Stat label="Total watches" value={totalWatches} />
        {perPerson.map((p) => (
          <Stat key={p.id} label={`${p.name}'s avg`} value={p.avg} sub={`${p.count} rated`} color={p.color} />
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
      <div className="faint">{label}</div>
      {sub && <div className="faint" style={{ fontSize: 11 }}>{sub}</div>}
    </div>
  )
}
