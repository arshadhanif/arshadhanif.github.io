import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listTrackedShows } from '../lib/db'
import { initBaselines, buildNotifications, getUnread, syncNotifState } from '../lib/notify'
import { initials } from './ui'
import Onboarding, { needsOnboarding } from './Onboarding'
import QuickAdd from './QuickAdd'
import GlobalSearch from './GlobalSearch'
import { setTheme, setAccent, ACCENTS } from '../lib/theme'
import { getPref } from '../lib/prefs'
import {
  Compass, Sparkles, Bookmark, BookOpen, Library, BarChart3, Bell, Sun, Moon,
  CalendarDays, Gift, Award, CreditCard, SlidersHorizontal, Users, Settings, UserRound, Upload, Info, LogOut, HeartHandshake,
} from 'lucide-react'

const TABS = [
  { to: '/', label: 'Discover', Icon: Compass, end: true },
  { to: '/foryou', label: 'For You', Icon: Sparkles },
  { to: '/watchlist', label: 'Watchlist', Icon: Bookmark },
  { to: '/diary', label: 'Diary', Icon: BookOpen },
  { to: '/lists', label: 'Lists', Icon: Library },
  { to: '/insights', label: 'Insights', Icon: BarChart3 },
]

const MENU = [
  ['/coming', 'Coming soon', CalendarDays],
  ['/wrapped', 'Year in review', Gift],
  ['/achievements', 'Achievements', Award],
  ['/match', 'Taste match', HeartHandshake],
  ['/subscriptions', 'Subscriptions', CreditCard],
  ['/browse', 'Advanced browse', SlidersHorizontal],
  ['/friends', 'Friends', Users],
  ['/settings', 'Settings', Settings],
  ['/groups', 'Groups & profile', UserRound],
  ['/import', 'Import & history', Upload],
  ['/about', 'About', Info],
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(getUnread())
  const [showOnb, setShowOnb] = useState(needsOnboarding())
  const [theme, setThemeS] = useState(getPref('theme', 'dark') === 'light' ? 'light' : 'dark')
  const [accent, setAccentS] = useState(getPref('accent', 'gold'))
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Seed the badge from cached episode counts vs. what's been acknowledged.
  // Hydrate per-user state from the server first so the badge is consistent
  // across devices, then compute against locally-tracked shows.
  useEffect(() => {
    ;(async () => {
      await syncNotifState().catch(() => {})
      const tracked = await listTrackedShows().catch(() => [])
      const objs = tracked.map((s) => ({ id: s.title.id, watched: s.watched, aired: s.cachedTotal || null, next: null }))
      initBaselines(objs)
      buildNotifications(objs)
      setNotifCount(getUnread())
    })()
  }, [])

  // Re-read the badge whenever the route changes (e.g. after "Mark all read").
  useEffect(() => { setNotifCount(getUnread()) }, [location.pathname])

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [])

  const go = (path) => { setMenuOpen(false); navigate(path) }
  const toggleTheme = () => { const n = theme === 'light' ? 'dark' : 'light'; setThemeS(n); setTheme(n) }
  const pickAccent = (name) => { setAccentS(name); setAccent(name) }

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">Reel<span>Book</span></NavLink>
        <nav className="nav-links">
          {TABS.map((t) => <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>)}
        </nav>
        <div className="row" style={{ gap: 6 }}>
        <GlobalSearch />
        <button className="bell" onClick={toggleTheme} aria-label="Toggle light or dark" title="Toggle light / dark">
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <button className="bell" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <Bell size={19} />{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
        </button>
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
                <div className="faint" style={{ marginTop: 8, marginBottom: 6 }}>Accent colour</div>
                <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                  {Object.entries(ACCENTS).map(([name, c]) => (
                    <button key={name} onClick={() => pickAccent(name)} aria-label={name} title={name}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, padding: 0, border: accent === name ? '2px solid var(--text)' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
              {MENU.map(([path, label, Icon]) => (
                <button key={path} onClick={() => go(path)}><Icon size={17} /> {label}</button>
              ))}
              <button onClick={() => { setMenuOpen(false); signOut() }}><LogOut size={17} /> Sign out</button>
            </div>
          )}
        </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      {showOnb && <Onboarding onClose={() => setShowOnb(false)} />}
      <QuickAdd />

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <span className="ico"><t.Icon size={20} /></span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
