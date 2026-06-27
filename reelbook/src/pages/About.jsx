import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="page">
      <h1>About ReelBook</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ marginTop: 0 }} className="muted">
          ReelBook is a private movie &amp; TV diary for Arshad &amp; Muneeza. Every watch is tagged with a
          <strong> group</strong> (who watched it), and each title can be rated out of 10 separately by each person —
          so you can see your per-person averages and where your tastes disagree.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Credits</h2>
        <p className="muted" style={{ marginBottom: 8 }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <a className="btn sm" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          themoviedb.org ↗
        </a>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginTop: 0 }}>More</h2>
        <p className="muted" style={{ marginBottom: 8 }}>
          Insights (per-person averages, trends, decade breakdowns) are coming soon.
        </p>
        <Link className="btn sm" to="/insights">Preview Insights →</Link>
      </div>
    </div>
  )
}
