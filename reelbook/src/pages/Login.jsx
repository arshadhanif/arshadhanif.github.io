import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const fn = mode === 'signin' ? signInWithPassword : signUpWithPassword
      const { error } = await fn(email, password)
      if (error) setMsg({ type: 'error', text: error.message })
      else if (mode === 'signup')
        setMsg({ type: 'ok', text: 'Account created. Check your email if confirmation is required, then sign in.' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="brand" style={{ fontSize: 34, textAlign: 'center', marginBottom: 6 }}>
          Reel<span>Book</span>
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 28 }}>
          Your shared movie &amp; TV diary
        </p>

        {msg && <div className={`banner ${msg.type === 'error' ? 'error' : ''}`}>{msg.text}</div>}

        <button className="btn block" onClick={() => signInWithGoogle()} style={{ marginBottom: 18 }}>
          <span style={{ fontWeight: 800 }}>G</span> Continue with Google
        </button>

        <div className="row" style={{ margin: '0 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span className="faint">or email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <input type="email" placeholder="Email" value={email} required
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <input type="password" placeholder="Password" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn primary block" disabled={busy}>
            {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="faint" style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'signin' ? "No account yet? " : 'Already have an account? '}
          <button className="btn sm" style={{ padding: '2px 6px' }}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null) }}>
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
