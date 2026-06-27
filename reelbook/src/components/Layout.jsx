import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from './ui'

const TABS = [
  { to: '/', label: 'Discover', ico: '🔍', end: true },
  { to: '/watchlist', label: 'Watchlist', ico: '🔖' },
  { to: '/diary', label: 'Diary', ico: '📖' },
  { to: '/lists', label: 'Lists', ico: '📚' },
  { to: '/import', label: 'Import', ico: '⬆️' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">Reel<span>Book</span></NavLink>
        <nav className="nav-links">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>
          ))}
          <NavLink to="/about">About</NavLink>
        </nav>
        <div className="row">
          <NavLink to="/groups" title="Groups & profile">
            <div
              className="avatar"
              style={{ background: profile?.color || 'var(--accent-2)' }}
            >
              {initials(profile?.name || '?')}
            </div>
          </NavLink>
          <button className="btn sm" onClick={signOut} title="Sign out">⏻</button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
