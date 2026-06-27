import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { listGroups, listProfiles } from '../lib/db'
import { useAuth } from './AuthContext'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [g, p] = await Promise.all([listGroups(), listProfiles()])
      setGroups(g)
      setProfiles(p)
    } catch (e) {
      console.error('AppData reload', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) reload()
  }, [user, reload])

  return (
    <AppDataContext.Provider value={{ groups, profiles, loading, reload }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
