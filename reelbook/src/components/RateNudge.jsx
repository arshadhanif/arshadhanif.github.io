import { useEffect, useState } from 'react'
import { listDiary, setRating } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Poster, StarRating } from './ui'

// Surfaces watches you logged but never gave your own rating, with one-tap rating.
export default function RateNudge() {
  const { profile } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    listDiary({ limit: 200 }).then((rows) => {
      const mine = (rows || []).filter((e) =>
        e.created_by === profile.id && e.titles &&
        !(e.ratings || []).some((r) => r.profile_id === profile.id && r.score != null))
      setItems(mine.slice(0, 12))
    }).catch(() => {})
  }, [profile?.id])

  if (dismissed || !items.length) return null

  async function rate(e, score) {
    try {
      await setRating(e.id, profile.id, score)
      setItems((prev) => prev.filter((x) => x.id !== e.id))
      toast('Rated')
    } catch { toast('Could not save', 'err') }
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="spread">
        <strong>⭐ Rate what you watched</strong>
        <button className="btn sm ghost" onClick={() => setDismissed(true)}>Later</button>
      </div>
      <p className="faint" style={{ margin: '4px 0 10px' }}>You logged {items.length} title{items.length === 1 ? '' : 's'} without your rating.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((e) => (
          <div className="row" key={e.id} style={{ gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, flexShrink: 0 }}>
              <Poster title={e.titles.title} mediaType={e.titles.media_type} posterPath={e.titles.poster_path} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.titles.title}</strong>
              <StarRating value={null} onChange={(v) => v && rate(e, v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
