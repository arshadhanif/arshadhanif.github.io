import { useEffect, useState } from 'react'
import { listTrackedShows, setTitleTotalEpisodes } from '../lib/db'
import { getTvStatus } from '../lib/tmdb'
import { Poster, Spinner, Empty, TitleLink } from '../components/ui'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const shows = (await listTrackedShows()).slice(0, 40)
      const results = await Promise.allSettled(
        shows.map(async (s) => {
          const status = await getTvStatus(s.title.tmdb_id)
          const currentTotal = status.number_of_episodes ?? s.cachedTotal
          if (currentTotal && currentTotal !== s.cachedTotal) {
            setTitleTotalEpisodes(s.title.id, currentTotal).catch(() => {})
          }
          return {
            title: s.title,
            unwatched: Math.max(0, currentTotal - s.watched),
            newlyAired: Math.max(0, currentTotal - s.cachedTotal),
            next: status.next_episode,
          }
        })
      )
      if (!alive) return
      setItems(results.filter((r) => r.status === 'fulfilled').map((r) => r.value))
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  if (loading) return <div className="page"><Spinner label="Checking for new episodes…" /></div>

  const fresh = items.filter((i) => i.newlyAired > 0)
  const catchUp = items.filter((i) => i.unwatched > 0)
  const upcoming = items.filter((i) => i.next?.air_date)

  const nothing = fresh.length === 0 && catchUp.length === 0 && upcoming.length === 0

  return (
    <div className="page">
      <h1>Notifications</h1>
      <p className="sub">New episodes and catch-ups for the shows you’re tracking.</p>

      {nothing ? (
        <Empty icon="🔔">You’re all caught up! Track a show’s episodes and new releases will show up here.</Empty>
      ) : (
        <>
          {fresh.length > 0 && (
            <Section title="🆕 New episodes aired">
              {fresh.map((i) => (
                <Row key={i.title.id} t={i.title} primary={`${i.newlyAired} new episode${i.newlyAired > 1 ? 's' : ''} since you last checked`} />
              ))}
            </Section>
          )}
          {catchUp.length > 0 && (
            <Section title="Catch up">
              {catchUp.map((i) => (
                <Row key={i.title.id} t={i.title} primary={`${i.unwatched} episode${i.unwatched > 1 ? 's' : ''} to watch`} />
              ))}
            </Section>
          )}
          {upcoming.length > 0 && (
            <Section title="Coming up">
              {upcoming.map((i) => (
                <Row key={i.title.id} t={i.title}
                  primary={`Next: S${i.next.season}·E${i.next.episode} on ${fmt(i.next.air_date)}`} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="section-head"><h2>{title}</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}
function Row({ t, primary }) {
  return (
    <TitleLink className="card row" tmdbId={t.tmdb_id} media="tv" style={{ gap: 12, alignItems: 'center' }}>
      <div style={{ width: 46, flexShrink: 0 }}>
        <Poster title={t.title} mediaType="tv" posterPath={t.poster_path} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{t.title}</strong>
        <div className="faint" style={{ marginTop: 3 }}>{primary}</div>
      </div>
      <span className="faint">›</span>
    </TitleLink>
  )
}
function fmt(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
