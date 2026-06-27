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
          const aired = status.aired_episodes ?? status.number_of_episodes ?? s.cachedTotal
          // Cache the AIRED count so "caught up" is judged correctly everywhere.
          if (aired && aired !== s.cachedTotal) setTitleTotalEpisodes(s.title.id, aired).catch(() => {})
          return {
            title: s.title,
            unwatched: Math.max(0, aired - s.watched),
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

  const catchUp = items.filter((i) => i.unwatched > 0).sort((a, b) => b.unwatched - a.unwatched)
  const upcoming = items.filter((i) => i.next?.air_date)

  const nothing = catchUp.length === 0 && upcoming.length === 0

  return (
    <div className="page">
      <h1>Notifications</h1>
      <p className="sub">New episodes and catch-ups for the shows you’re tracking.</p>

      {nothing ? (
        <Empty icon="🔔">You’re all caught up! Track a show’s episodes and new releases will show up here.</Empty>
      ) : (
        <>
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
