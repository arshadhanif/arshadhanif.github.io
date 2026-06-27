import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider } from './context/AppData'
import { ToastProvider } from './context/Toast'
import { Spinner } from './components/ui'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Discover = lazy(() => import('./pages/Discover'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const Diary = lazy(() => import('./pages/Diary'))
const Lists = lazy(() => import('./pages/Lists'))
const Import = lazy(() => import('./pages/Import'))
const Groups = lazy(() => import('./pages/Groups'))
const About = lazy(() => import('./pages/About'))
const Insights = lazy(() => import('./pages/Insights'))
const TitleDetail = lazy(() => import('./pages/TitleDetail'))
const ForYou = lazy(() => import('./pages/ForYou'))
const Settings = lazy(() => import('./pages/Settings'))
const Landing = lazy(() => import('./pages/Landing'))
const Friends = lazy(() => import('./pages/Friends'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Browse = lazy(() => import('./pages/Browse'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const Wrapped = lazy(() => import('./pages/Wrapped'))
const Achievements = lazy(() => import('./pages/Achievements'))

// Register the service worker so ReelBook is installable on phones.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function Protected() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner label="Starting ReelBook…" />
  if (!session) return <Navigate to="/login" replace />
  return (
    <AppDataProvider>
      <Layout />
    </AppDataProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Spinner label="Loading…" />}>
            <Routes>
              <Route path="/welcome" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route element={<Protected />}>
                <Route index element={<Discover />} />
                <Route path="watchlist" element={<Watchlist />} />
                <Route path="diary" element={<Diary />} />
                <Route path="lists" element={<Lists />} />
                <Route path="title/:media/:id" element={<TitleDetail />} />
                <Route path="import" element={<Import />} />
                <Route path="groups" element={<Groups />} />
                <Route path="insights" element={<Insights />} />
                <Route path="foryou" element={<ForYou />} />
                <Route path="friends" element={<Friends />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="coming" element={<ComingSoon />} />
                <Route path="wrapped" element={<Wrapped />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="browse" element={<Browse />} />
                <Route path="settings" element={<Settings />} />
                <Route path="about" element={<About />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
