import { createClient } from '@supabase/supabase-js'

// The Supabase URL + publishable (anon) key are safe to ship in client code:
// they are designed to be public, and Row Level Security protects the data.
// Env vars (VITE_SUPABASE_*) override these defaults when present.
const DEFAULT_URL = 'https://knarfokskbgtyrphibvm.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_9ndSHL2B9TE3ewaXsXScyg_zqo19EjD'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
