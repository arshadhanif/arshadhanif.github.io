import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'reelbook.onboarded.v1'

export function needsOnboarding() {
  try { return !localStorage.getItem(KEY) } catch { return false }
}
function markDone() { try { localStorage.setItem(KEY, '1') } catch {} }

const STEPS = [
  { icon: '🎬', title: 'Welcome to ReelBook', body: 'Your private movie & TV diary, just for you and the people you watch with.' },
  { icon: '👥', title: 'Tag who watched', body: 'Every watch is logged to a group — “Just me”, “Us”, “Family”. Your lists and stats filter by group, so everyone’s history stays clear.' },
  { icon: '⭐', title: 'Rate it your way', body: 'Each person rates out of 10 separately, so you can see your own averages and exactly where your tastes agree or clash.' },
  { icon: '📺', title: 'Track every episode', body: 'Tick off episodes, get a heatmap of your year, “Coming Soon” for new releases, and push alerts when shows return.' },
]

export default function Onboarding({ onClose }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const s = STEPS[i]

  function finish(path) {
    markDone(); onClose()
    if (path) navigate(path)
  }

  return (
    <div className="onb-overlay" role="dialog" aria-modal="true">
      <div className="onb-card">
        <button className="onb-skip" onClick={() => finish()}>Skip</button>
        <div className="onb-icon">{s.icon}</div>
        <h2 className="onb-title">{s.title}</h2>
        <p className="onb-body">{s.body}</p>

        <div className="onb-dots">
          {STEPS.map((_, n) => <span key={n} className={n === i ? 'on' : ''} />)}
        </div>

        {last ? (
          <div className="onb-cta">
            <button className="btn primary block" onClick={() => finish('/import')}>Import my history</button>
            <button className="btn block" onClick={() => finish('/settings')}>Pick my favourites</button>
            <button className="btn ghost block" onClick={() => finish()}>Start exploring</button>
          </div>
        ) : (
          <div className="onb-cta">
            <button className="btn primary block" onClick={() => setI(i + 1)}>Next</button>
            {i > 0 && <button className="btn ghost block" onClick={() => setI(i - 1)}>Back</button>}
          </div>
        )}
      </div>
    </div>
  )
}
