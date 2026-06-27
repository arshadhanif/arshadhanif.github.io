import { useEffect, useMemo, useState } from 'react'
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { getPref, setPref } from '../lib/prefs'
import { Spinner, Empty } from '../components/ui'

const SERVICES = ['Netflix', 'OSN+', 'Prime Video', 'Disney+', 'Apple TV+', 'Shahid VIP', 'StarzPlay', 'Max', 'Hulu', 'YouTube Premium', 'Spotify', 'Crunchyroll']
const CURRENCIES = ['AED', 'USD', 'GBP', 'EUR', 'PKR', 'INR', 'SAR']

export default function Subscriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState(getPref('currency', 'AED'))
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [cycle, setCycle] = useState('monthly')
  const [busy, setBusy] = useState(false)

  async function load() { setLoading(true); try { setSubs(await listSubscriptions()) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const monthly = (s) => (s.cycle === 'yearly' ? Number(s.cost) / 12 : Number(s.cost))
  const totals = useMemo(() => {
    const active = subs.filter((s) => s.active)
    const m = active.reduce((a, s) => a + monthly(s), 0)
    return { month: m, year: m * 12, count: active.length }
  }, [subs])

  async function add(e) {
    e.preventDefault()
    if (!name.trim() || !cost) return
    setBusy(true)
    try {
      await createSubscription({ name: name.trim(), cost, currency, cycle, ownerId: user.id })
      setName(''); setCost(''); setCycle('monthly')
      await load(); toast('Subscription added')
    } catch (e2) { toast(e2.message || 'Could not add', 'err') } finally { setBusy(false) }
  }
  async function toggle(s) { await updateSubscription(s.id, { active: !s.active }); load() }
  async function remove(s) { if (!confirm(`Remove ${s.name}?`)) return; await deleteSubscription(s.id); load() }
  function changeCurrency(c) { setCurrency(c); setPref('currency', c) }
  const fmt = (n) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-head">
        <h1>Subscriptions</h1>
        <select value={currency} onChange={(e) => changeCurrency(e.target.value)} style={{ width: 'auto' }}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <p className="sub">Track what you spend on streaming each month.</p>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <Stat v={fmt(totals.month)} l="Per month" />
        <Stat v={fmt(totals.year)} l="Per year" />
        <Stat v={totals.count} l="Active services" />
      </div>

      <form className="card" style={{ marginBottom: 18 }} onSubmit={add}>
        <strong>Add a subscription</strong>
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <input list="svc" value={name} onChange={(e) => setName(e.target.value)} placeholder="Service" style={{ flex: '2 1 140px' }} />
          <datalist id="svc">{SERVICES.map((s) => <option key={s} value={s} />)}</datalist>
          <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost" style={{ flex: '1 1 90px' }} />
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} style={{ flex: '1 1 110px' }}>
            <option value="monthly">/ month</option>
            <option value="yearly">/ year</option>
          </select>
          <button className="btn primary" disabled={busy || !name.trim() || !cost}>Add</button>
        </div>
      </form>

      {loading ? <Spinner /> : subs.length === 0 ? (
        <Empty icon="💳">No subscriptions yet. Add the services you pay for to see your monthly spend.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subs.map((s) => (
            <div className="card row" key={s.id} style={{ gap: 12, alignItems: 'center', opacity: s.active ? 1 : 0.55 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{s.name}</strong>
                <div className="faint" style={{ marginTop: 2 }}>{fmt(Number(s.cost))} / {s.cycle === 'yearly' ? 'year' : 'month'}{s.cycle === 'yearly' ? ` · ${fmt(monthly(s))}/mo` : ''}</div>
              </div>
              <button className="btn sm" onClick={() => toggle(s)}>{s.active ? 'Pause' : 'Resume'}</button>
              <button className="btn sm ghost" onClick={() => remove(s)} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ v, l }) {
  return <div className="stat"><div className="v">{v}</div><div className="l">{l}</div></div>
}
