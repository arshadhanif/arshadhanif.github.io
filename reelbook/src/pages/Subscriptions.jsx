import { useEffect, useMemo, useState } from 'react'
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, listProfiles, listFriends } from '../lib/db'
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
// Telecom / fibre / app-store bundles, across the regions we use
const PROVIDERS = ['STC', 'Mobily', 'Zain', 'Salam', 'e& (Etisalat)', 'du', 'PTCL', 'Jazz', 'Zong', 'Ufone', 'Nayatel', 'StormFiber', 'Apple App Store', 'Google Play', 'Direct (app / website)', 'Gift card']
const OTHER = 'Other…'

// Billing cycles — including the free variants
const CYCLES = [
  ['monthly', 'Monthly'],
  ['yearly', 'Yearly'],
  ['trial', 'Free trial'],
  ['tier', 'Free tier'],
  ['bundle', 'Included in a bundle'],
]
const FREE_CYCLES = ['free', 'trial', 'tier', 'bundle']
const isFreeCycle = (c) => FREE_CYCLES.includes(c)
const FREE_BADGE = { trial: 'Free trial', tier: 'Free tier', bundle: 'Bundled', free: 'Free' }

export default function Subscriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [people, setPeople] = useState([])   // names: household members + friends
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState(null)
  const [display, setDisplay] = useState(getPref('currency', 'PKR')) // display/convert target, or 'ALL'
  const [filter, setFilter] = useState('all')                         // all | active | paused

  // add form
  const [service, setService] = useState('')
  const [serviceOther, setServiceOther] = useState('')
  const [cost, setCost] = useState('')
  const [cur, setCur] = useState(getPref('currency', 'PKR') === 'ALL' ? 'PKR' : getPref('currency', 'PKR'))
  const [cycle, setCycle] = useState('monthly')
  const [category, setCategory] = useState('')
  const [plan, setPlan] = useState('')
  const [provider, setProvider] = useState('')
  const [providerOther, setProviderOther] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [paidByOther, setPaidByOther] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const isFree = isFreeCycle(cycle)
  const name = (service === OTHER ? serviceOther : service).trim()
  const providerVal = (provider === OTHER ? providerOther : provider).trim()
  const paidByVal = (paidBy === OTHER ? paidByOther : paidBy).trim()

  async function load() { setLoading(true); try { setSubs(await listSubscriptions()) } finally { setLoading(false) } }
  useEffect(() => {
    load()
    getRates().then(setRates).catch(() => {})
    // Build the "Paid by" people list from the household + accepted friends
    Promise.all([listProfiles().catch(() => []), listFriends().catch(() => [])]).then(([profs, friends]) => {
      const names = [
        ...profs.map((p) => p.name).filter(Boolean),
        ...friends.filter((f) => f.status === 'accepted').map((f) => f.other_name).filter(Boolean),
      ]
      setPeople([...new Set(names)])
    })
  }, [])

  const monthlyNative = (s) => (isFreeCycle(s.cycle) ? 0 : s.cycle === 'yearly' ? Number(s.cost) / 12 : Number(s.cost))
  const monthlyIn = (s, target) => { const n = monthlyNative(s); if (!n) return 0; return convert(n, s.currency || 'USD', target, rates) }

  const totals = useMemo(() => {
    const active = subs.filter((s) => s.active)
    const free = active.filter((s) => isFreeCycle(s.cycle)).length
    if (display === 'ALL') {
      const byCur = {}
      for (const s of active) { const c = s.currency || 'USD'; byCur[c] = (byCur[c] || 0) + monthlyNative(s) }
      return { byCur, count: active.length, free }
    }
    let m = 0, missing = false
    for (const s of active) { const v = monthlyIn(s, display); if (v == null) missing = true; else m += v }
    return { month: m, year: m * 12, count: active.length, free, missing }
  }, [subs, display, rates])

  async function add(e) {
    e.preventDefault()
    if (!name || (!isFree && !cost)) return
    setBusy(true)
    try {
      await createSubscription({
        name, cost, currency: cur, cycle, note: note.trim(),
        category: category || null, plan: plan || null,
        provider: providerVal || null, paidBy: paidByVal || null,
        ownerId: user.id,
      })
      setService(''); setServiceOther(''); setCost(''); setCycle('monthly')
      setCategory(''); setPlan(''); setProvider(''); setProviderOther('')
      setPaidBy(''); setPaidByOther(''); setNote('')
      await load(); toast('Subscription added')
    } catch (e2) { toast(e2.message || 'Could not add', 'err') } finally { setBusy(false) }
  }
  async function toggle(s) { await updateSubscription(s.id, { active: !s.active }); load() }
  async function remove(s) { if (!confirm(`Remove ${s.name}?`)) return; await deleteSubscription(s.id); load() }
  function changeDisplay(c) { setDisplay(c); setPref('currency', c) }
  const fmt = (n, c) => `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`

  const view = subs.filter((s) => filter === 'all' || (filter === 'active' ? s.active : !s.active))
  const peopleOptions = [...new Set([...people, 'Shared', 'Family', 'Work'])]

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

        <Field label="Service">
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="" disabled>Choose a service…</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value={OTHER}>{OTHER}</option>
          </select>
          {service === OTHER && (
            <input value={serviceOther} onChange={(e) => setServiceOther(e.target.value)} autoFocus
              placeholder="Type the service name" style={{ marginTop: 8 }} />
          )}
        </Field>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Cost" flex="1 1 90px">
            <input type="number" min="0" step="0.01" value={isFree ? '' : cost} disabled={isFree}
              onChange={(e) => setCost(e.target.value)} placeholder={isFree ? 'Free' : '0.00'} />
          </Field>
          <Field label="Currency" flex="1 1 90px">
            <select value={cur} onChange={(e) => setCur(e.target.value)} disabled={isFree}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Billing" flex="1 1 150px">
            <select value={cycle} onChange={(e) => setCycle(e.target.value)}>
              {CYCLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Category" flex="1 1 150px">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category…</option>
              {CATEGORIES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Plan / tier" flex="1 1 130px">
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="">Select plan…</option>
              {PLANS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Field label="Provided / bundled via" flex="1 1 180px">
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="">Select provider…</option>
              {PROVIDERS.map((o) => <option key={o} value={o}>{o}</option>)}
              <option value={OTHER}>{OTHER}</option>
            </select>
            {provider === OTHER && (
              <input value={providerOther} onChange={(e) => setProviderOther(e.target.value)}
                placeholder="Type the provider" style={{ marginTop: 8 }} />
            )}
          </Field>
          <Field label="Paid by" flex="1 1 150px">
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              <option value="">Select who pays…</option>
              {peopleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              <option value={OTHER}>{OTHER}</option>
            </select>
            {paidBy === OTHER && (
              <input value={paidByOther} onChange={(e) => setPaidByOther(e.target.value)}
                placeholder="Type a name" style={{ marginTop: 8 }} />
            )}
          </Field>
        </div>

        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={isFree ? 'e.g. “trial ends 12-Jul” or “Muneeza’s account, I share it”' : 'Optional note'} />
        </Field>

        <button className="btn primary" style={{ marginTop: 12 }} disabled={busy || !name || (!isFree && !cost)}>Add</button>
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
            const free = isFreeCycle(s.cycle)
            const conv = display !== 'ALL' && c !== display && !free ? monthlyIn(s, display) : null
            return (
              <div className="card row" key={s.id} style={{ gap: 12, alignItems: 'center', opacity: s.active ? 1 : 0.55 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <strong>{s.name}</strong>
                    {free && <span className="chip" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>{FREE_BADGE[s.cycle] || 'Free'}</span>}
                    {s.plan && <span className="chip">{s.plan}</span>}
                    {s.category && <span className="chip">{s.category}</span>}
                    {s.provider && <span className="chip">via {s.provider}</span>}
                    {s.paid_by && <span className="chip">Paid by {s.paid_by}</span>}
                  </div>
                  <div className="faint" style={{ marginTop: 2 }}>
                    {free
                      ? (s.note || FREE_BADGE[s.cycle] || 'Free / included')
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

// Labelled field: a heading sits above the control so the dropdown's own
// placeholder never has to double as the label.
function Field({ label, children, flex }) {
  return (
    <label style={{ display: 'block', marginTop: 12, flex: flex || undefined, minWidth: 0 }}>
      <span className="faint" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  )
}

function Stat({ v, l, s }) {
  return <div className="stat"><div className="v" style={{ fontSize: 18 }}>{v}</div><div className="l">{l}</div>{s && <div className="s">{s}</div>}</div>
}
