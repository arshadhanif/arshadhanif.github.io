import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PosterWall from '../components/PosterWall'

const FEATURES = [
  { icon: '👥', color: '#ff6b9d', title: 'Tag who watched', body: 'Every watch is logged to a group: “Just us”, “Family”, “The crew”. Your lists are filtered views, never duplicates.' },
  { icon: '⭐', color: '#e8a838', title: 'Two ratings, one title', body: 'Each of you rates out of 10. See your averages and exactly where your tastes collide.' },
  { icon: '📺', color: '#5b9aff', title: 'Track every episode', body: 'Tick off episodes with dates, pick up where you left off, and never lose your place in a series.' },
  { icon: '✨', color: '#b46bff', title: 'What to watch tonight', body: 'Smart picks from your highest-rated history, plus a one-tap shuffle from your watchlist.' },
  { icon: '🎬', color: '#42d4d4', title: 'Rich title pages', body: 'Trailers, cast, “where to watch”, and a link straight to IMDb, powered by TMDB.' },
  { icon: '📊', color: '#4ecb71', title: 'Your year in data', body: 'Averages, agreement, trends over time, top genres and decades. Your shared taste, visualised.' },
]

export default function Landing() {
  const { session } = useAuth()
  if (session) return <Navigate to="/" replace />

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand" style={{ fontSize: 22 }}>Reel<span>Book</span></div>
        <Link className="btn sm primary" to="/login">Sign in</Link>
      </header>

      <section className="landing-hero">
        <PosterWall veil="hero" />
        <div className="landing-hero-grad" />
        <div className="landing-hero-inner">
          <h1>The movie &amp; TV diary<br />you keep <span>together</span>.</h1>
          <p>ReelBook blends the best of Letterboxd, TV&nbsp;Time and Simkl, and adds the two things they miss:
            <strong> who watched it</strong> and <strong>how you each rated it</strong>.</p>
          <div className="row" style={{ gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn primary" to="/login">Get started, it’s free</Link>
            <a className="btn" href="#features">See features</a>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features">
        {FEATURES.map((f) => (
          <div className="card landing-feature hoverable" key={f.title}>
            <div className="lf-icon" style={{ background: `${f.color}22`, color: f.color, boxShadow: `0 6px 18px -8px ${f.color}` }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p className="muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-cta">
        <h2>Start your shared diary tonight.</h2>
        <Link className="btn primary" to="/login">Create your account</Link>
      </section>

      <footer className="landing-footer">
        <div className="brand">Reel<span>Book</span></div>
        <p className="faint">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </footer>
    </div>
  )
}
