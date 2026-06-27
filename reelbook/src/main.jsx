import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider } from './context/AppData'
import { Spinner } from './components/ui'
import Layout from './components/Layout'
import Login from './pages/Login'
import Discover from './pages/Discover'
import Watchlist from './pages/Watchlist'
import Diary from './pages/Diary'
import Lists from './pages/Lists'
import Import from './pages/Import'
import Groups from './pages/Groups'
import About from './pages/About'
import Insights from './pages/Insights'
import TitleDetail from './pages/TitleDetail'

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

// Register the service worker so ReelBook is installable on phones.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
            <Route path="about" element={<About />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
