import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from './ui'

const TABS = [
  { to: '/', label: 'Discover', ico: '🔍', end: true },
  { to: '/foryou', label: 'For You', ico: '✨' },
  { to: '/watchlist', label: 'Watchlist', ico: '🔖' },
  { to: '/diary', label: 'Diary', ico: '📖' },
  { to: '/lists', label: 'Lists', ico: '📚' },
  { to: '/insights', label: 'Insights', ico: '📊' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [])

  const go = (path) => { setMenuOpen(false); navigate(path) }

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">Reel<span>Book</span></NavLink>
        <nav className="nav-links">
          {TABS.map((t) => <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>)}
        </nav>
        <div className="menu-wrap" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <div className="avatar" style={{ background: profile?.color || 'var(--accent-2)' }}>
              {initials(profile?.name || '?')}
            </div>
          </button>
          {menuOpen && (
            <div className="menu">
              <div className="who">
                <div style={{ fontWeight: 700 }}>{profile?.name || 'You'}</div>
                <div className="faint">Signed in</div>
              </div>
              <button onClick={() => go('/friends')}>🤝 Friends</button>
              <button onClick={() => go('/settings')}>⚙️ Settings</button>
              <button onClick={() => go('/groups')}>👥 Groups &amp; profile</button>
              <button onClick={() => go('/import')}>⬆️ Import history</button>
              <button onClick={() => go('/about')}>ℹ️ About</button>
              <button onClick={() => { setMenuOpen(false); signOut() }}>⏻ Sign out</button>
            </div>
          )}
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
