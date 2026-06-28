import { useEffect, useMemo, useState } from 'react'
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { getPref, setPref } from '../lib/prefs'
import { getRates, convert } from '../lib/fx'
import { Spinner, Empty } from '../components/ui'

// Lists of values for the add form
const SERVICES = ['Netflix', 'OSN+', 'Prime Video', 'Disney+', 'Apple TV+', 'Shahid VIP', 'StarzPlay', 'Max', 'Hulu', 'YouTube Premium', 'Spotify', 'Crunchyroll']
const CURRENCIES = ['PKR', 'SAR', 'AED', 'USD', 'GBP', 'EUR', 'INR', 'QAR']
const CATEGORIES = ['Video streaming', 'Music', 'Sports', 'News & reading', 'Cloud & storage', 'Gaming', 'Other']
const PLANS = ['Basic', 'Standard', 'Premium', 'Family', 'Mobile', 'Ad-supported', '4K Ultra HD', 'Annual', 'Other']
const PAID_BY = ['Me', 'Partner', 'Shared', 'Family', 'Work']
const OTHER = 'Other…'

export default function Subscriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState(null)
  const [display, setDisplay] = useState(getPref('currency', 'PKR')) // display/convert target, or 'ALL'
  const [filter, setFilter] = useState('all')                         // all | active | paused

  // add form
  const [service, setService] = useState('')      // dropdown value (a known service or OTHER)
  const [customName, setCustomName] = useState('') // typed when service === OTHER
  const [cost, setCost] = useState('')
  const [cur, setCur] = useState(getPref('currency', 'PKR') === 'ALL' ? 'PKR' : getPref('currency', 'PKR'))
  const [cycle, setCycle] = useState('monthly')
  const [category, setCategory] = useState('')
  const [plan, setPlan] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const isFree = cycle === 'free'
  const name = (service === OTHER ? customName : service).trim()

  async function load() { setLoading(true); try { setSubs(await listSubscriptions()) } finally { setLoading(false) } }
  useEffect(() => { load(); getRates().then(setRates).catch(() => {}) }, [])

  // monthly amount in the subscription's own currency
  const monthlyNative = (s) => (s.cycle === 'free' ? 0 : s.cycle === 'yearly' ? Number(s.cost) / 12 : Number(s.cost))
  // monthly amount converted into the chosen display currency (null if not convertible)
  const monthlyIn = (s, target) => {
    const n = monthlyNative(s)
    if (!n) return 0
    return convert(n, s.currency || 'USD', target, rates)
  }

  const totals = useMemo(() => {
    const active = subs.filter((s) => s.active)
    if (display === 'ALL') {
      const byCur = {}
      for (const s of active) { const c = s.currency || 'USD'; byCur[c] = (byCur[c] || 0) + monthlyNative(s) }
      return { byCur, count: active.length, free: active.filter((s) => s.cycle === 'free').length }
    }
    let m = 0, missing = false
    for (const s of active) { const v = monthlyIn(s, display); if (v == null) missing = true; else m += v }
    return { month: m, year: m * 12, count: active.length, free: active.filter((s) => s.cycle === 'free').length, missing }
  }, [subs, display, rates])

  async function add(e) {
    e.preventDefault()
    if (!name || (!isFree && !cost)) return
    setBusy(true)
    try {
      await createSubscription({
        name, cost, currency: cur, cycle, note: note.trim(),
        category: category || null, plan: plan || null, paidBy: paidBy || null,
        ownerId: user.id,
      })
      setService(''); setCustomName(''); setCost(''); setCycle('monthly')
      setCategory(''); setPlan(''); setPaidBy(''); setNote('')
      await load(); toast('Subscription added')
    } catch (e2) { toast(e2.message || 'Could not add', 'err') } finally { setBusy(false) }
  }
  async function toggle(s) { await updateSubscription(s.id, { active: !s.active }); load() }
  async function remove(s) { if (!confirm(`Remove ${s.name}?`)) return; await deleteSubscription(s.id); load() }
  function changeDisplay(c) { setDisplay(c); setPref('currency', c) }
  const fmt = (n, c) => `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`

  const view = subs.filter((s) => filter === 'all' || (filter === 'active' ? s.active : !s.active))

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-head">
        <h1>Subscriptions</h1>
        <select value={display} onChange={(e) => changeDisplay(e.target.value)} style={{ width: 'auto' }}>
          <option value="ALL">All currencies</option>
          {CURRENCIES.map((c) => <option key={c} value={c}>Show in {c}</option>)}
        </select>
      </div>
      <p className="sub">Track what you spend on streaming, in any currency. Free trials and bundled services welcome.</p>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        {display === 'ALL' ? (
          <Stat v={Object.keys(totals.byCur).length ? Object.entries(totals.byCur).map(([c, m]) => fmt(m, c)).join(' · ') : '—'} l="Per month" s="each in its own currency" />
        ) : (
          <Stat v={fmt(totals.month, display)} l="Per month" s={totals.missing ? 'some rates unavailable' : undefined} />
        )}
        {display === 'ALL'
          ? <Stat v={Object.keys(totals.byCur).length ? Object.entries(totals.byCur).map(([c, m]) => fmt(m * 12, c)).join(' · ') : '—'} l="Per year" />
          : <Stat v={fmt(totals.year, display)} l="Per year" />}
        <Stat v={totals.count} l="Active services" s={totals.free ? `${totals.free} free/included` : undefined} />
      </div>

      <form className="card" style={{ marginBottom: 18 }} onSubmit={add}>
        <strong>Add a subscription</strong>

        {/* Service — a real dropdown (List of Values), with an "Other…" escape hatch */}
        <Field label="Service">
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="" disabled>Choose a service…</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value={OTHER}>{OTHER}</option>
          </select>
        </Field>
        {service === OTHER && (
          <input value={customName} onChange={(e) => setCustomName(e.target.value)} autoFocus
            placeholder="Type the service name" style={{ marginTop: 8 }} />
        )}

        <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input type="number" min="0" step="0.01" value={isFree ? '' : cost} disabled={isFree}
            onChange={(e) => setCost(e.target.value)} placeholder={isFree ? 'Free' : 'Cost'} style={{ flex: '1 1 80px' }} />
          <select value={cur} onChange={(e) => setCur(e.target.value)} disabled={isFree} style={{ flex: '1 1 90px' }}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} style={{ flex: '1 1 130px' }}>
            <option value="monthly">/ month</option>
            <option value="yearly">/ year</option>
            <option value="free">Free / included</option>
          </select>
        </div>

        {/* More fields, each a List of Values */}
        <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <LovSelect value={category} onChange={setCategory} placeholder="Category" options={CATEGORIES} style={{ flex: '1 1 150px' }} />
          <LovSelect value={plan} onChange={setPlan} placeholder="Plan / tier" options={PLANS} style={{ flex: '1 1 130px' }} />
          <LovSelect value={paidBy} onChange={setPaidBy} placeholder="Paid by" options={PAID_BY} style={{ flex: '1 1 120px' }} />
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} style={{ marginTop: 8 }}
          placeholder={isFree ? 'Note, e.g. “via Zain fiber” or “trial ends Jan”' : 'Note (optional)'} />
        <button className="btn primary" style={{ marginTop: 10 }} disabled={busy || !name || (!isFree && !cost)}>Add</button>
      </form>

      {subs.length > 0 && (
        <div className="seg" style={{ marginBottom: 14 }}>
          {[['all', 'All'], ['active', 'Active'], ['paused', 'Paused']].map(([v, l]) => (
            <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : subs.length === 0 ? (
        <Empty icon="💳">No subscriptions yet. Add what you pay for, plus free trials and bundled services.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.map((s) => {
            const c = s.currency || 'USD'
            const conv = display !== 'ALL' && c !== display && s.cycle !== 'free' ? monthlyIn(s, display) : null
            return (
              <div className="card row" key={s.id} style={{ gap: 12, alignItems: 'center', opacity: s.active ? 1 : 0.55 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <strong>{s.name}</strong>
                    {s.cycle === 'free' && <span className="chip" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>Free</span>}
                    {s.plan && <span className="chip">{s.plan}</span>}
                    {s.category && <span className="chip">{s.category}</span>}
                    {s.paid_by && <span className="chip">Paid by {s.paid_by}</span>}
                  </div>
                  <div className="faint" style={{ marginTop: 2 }}>
                    {s.cycle === 'free'
                      ? (s.note || 'Free / included')
                      : <>
                          {fmt(Number(s.cost), c)} / {s.cycle === 'yearly' ? 'year' : 'month'}
                          {conv != null && <> · ≈ {fmt(monthlyIn(s, display), display)}/mo</>}
                          {s.note ? ` · ${s.note}` : ''}
                        </>}
                  </div>
                </div>
                <button className="btn sm" onClick={() => toggle(s)}>{s.active ? 'Pause' : 'Resume'}</button>
                <button className="btn sm ghost" onClick={() => remove(s)} title="Remove">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {display !== 'ALL' && rates && (
        <div className="faint" style={{ marginTop: 12, fontSize: 12 }}>Converted to {display} at today’s rates.</div>
      )}
    </div>
  )
}

// A labelled dropdown that shows a placeholder option until a value is picked.
function LovSelect({ value, onChange, placeholder, options, style }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginTop: 12 }}>
      <span className="faint" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  )
}

function Stat({ v, l, s }) {
  return <div className="stat"><div className="v" style={{ fontSize: 18 }}>{v}</div><div className="l">{l}</div>{s && <div className="s">{s}</div>}</div>
}
