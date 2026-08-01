import { useEffect, useMemo, useState } from 'react'
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, listProfiles, listFriends } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { getPref, setPref } from '../lib/prefs'
import { getRates, convert } from '../lib/fx'
import { todayLocal, fmtDate } from '../lib/dates'
import { catColor } from '../lib/categories'
import { Spinner, Empty, Modal, Combobox } from '../components/ui'

const SERVICES = ['Netflix', 'OSN+', 'Prime Video', 'Disney+', 'Apple TV+', 'Shahid VIP', 'StarzPlay', 'Max', 'Hulu', 'YouTube Premium', 'Spotify', 'Crunchyroll']
const CURRENCIES = ['PKR', 'SAR', 'AED', 'USD', 'GBP', 'EUR', 'INR', 'QAR']
const CATEGORIES = ['Video streaming', 'Music', 'Gaming', 'Sports', 'News & reading', 'Cloud & storage', 'AI & software', 'Internet & phone', 'Shopping & memberships', 'Fitness & health', 'Education', 'Other']
const PLANS = ['Basic', 'Standard', 'Premium', 'Family', 'Mobile', 'Ad-supported', '4K Ultra HD', 'Annual', 'Other']
const PROVIDERS = ['STC', 'Mobily', 'Zain', 'Salam', 'e& (Etisalat)', 'du', 'PTCL', 'Jazz', 'Zong', 'Ufone', 'Nayatel', 'StormFiber', 'Apple App Store', 'Google Play', 'Direct (app / website)', 'Gift card']
const PAYMENT_METHODS = ['Visa', 'Mastercard', 'mada', 'American Express', 'Apple Pay', 'Google Pay', 'PayPal', 'STC Pay', 'Bank transfer', 'Cash']
const OTHER = 'Other…'

const CYCLES = [['monthly', 'Monthly'], ['yearly', 'Yearly'], ['trial', 'Free trial'], ['tier', 'Free tier'], ['bundle', 'Included in a bundle']]
const FREE_CYCLES = ['free', 'trial', 'tier', 'bundle']
const isFreeCycle = (c) => FREE_CYCLES.includes(c)
const FREE_BADGE = { trial: 'Free trial', tier: 'Free tier', bundle: 'Bundled', free: 'Free' }
const dateLabel = (c) => c === 'trial' ? 'Trial ends' : (c === 'monthly' || c === 'yearly') ? 'Renews' : 'Review'

function splitOther(value, options) {
  if (!value) return ['', '']
  if (options.includes(value)) return [value, '']
  return [OTHER, value]
}
const pad = (n) => String(n).padStart(2, '0')
function nextOccurrence(dateStr, cycle, autoRenew) {
  if (!dateStr) return null
  const ds = String(dateStr).slice(0, 10)
  if ((cycle === 'monthly' || cycle === 'yearly') && autoRenew !== false) {
    const today = new Date(todayLocal() + 'T00:00:00')
    let d = new Date(ds + 'T00:00:00'), g = 0
    while (d < today && g++ < 600) { if (cycle === 'monthly') d.setMonth(d.getMonth() + 1); else d.setFullYear(d.getFullYear() + 1) }
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return ds
}
function daysUntil(dateStr) {
  if (!dateStr) return null
  const a = new Date(todayLocal() + 'T00:00:00'), b = new Date(String(dateStr).slice(0, 10) + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
function countdownText(d) {
  if (d == null) return ''
  if (d < 0) return `${-d} day${d === -1 ? '' : 's'} ago`
  if (d === 0) return 'today'; if (d === 1) return 'tomorrow'
  return `in ${d} days`
}
const urgencyColor = (d) => d == null ? 'var(--muted)' : d <= 2 ? '#ef4444' : d <= 7 ? '#f5b50a' : 'var(--muted)'

export default function Subscriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState(null)
  const [display, setDisplay] = useState(getPref('currency', 'PKR'))
  const [period, setPeriod] = useState(getPref('subPeriod', 'mo'))   // mo | yr
  const [filter, setFilter] = useState('all')
  const [fPayer, setFPayer] = useState('')
  const [fProvider, setFProvider] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [sort, setSort] = useState('added')
  const [editing, setEditing] = useState(null)   // sub id
  const [adding, setAdding] = useState(false)

  const defCur = getPref('currency', 'PKR') === 'ALL' ? 'PKR' : getPref('currency', 'PKR')
  const insCur = display === 'ALL' ? defCur : display
  const perMul = period === 'yr' ? 12 : 1
  const perSuffix = period === 'yr' ? '/yr' : '/mo'

  async function load() { setLoading(true); try { setSubs(await listSubscriptions()) } finally { setLoading(false) } }
  useEffect(() => {
    load()
    getRates().then(setRates).catch(() => {})
    Promise.all([listProfiles().catch(() => []), listFriends().catch(() => [])]).then(([profs, friends]) => {
      setPeople([...new Set([
        ...profs.map((p) => p.name).filter(Boolean),
        ...friends.filter((f) => f.status === 'accepted').map((f) => f.other_name).filter(Boolean),
      ])])
    })
  }, [])

  const monthlyNative = (s) => (isFreeCycle(s.cycle) ? 0 : s.cycle === 'yearly' ? Number(s.cost) / 12 : Number(s.cost))
  const monthlyIn = (s, target) => { const n = monthlyNative(s); if (!n) return 0; return convert(n, s.currency || 'USD', target, rates) || 0 }
  const fmt = (n, c) => `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`
  const effDate = (s) => nextOccurrence(s.renews_on, s.cycle, s.auto_renew)

  const totals = useMemo(() => {
    const active = subs.filter((s) => s.active)
    const free = active.filter((s) => isFreeCycle(s.cycle)).length
    if (display === 'ALL') {
      const byCur = {}
      for (const s of active) { const c = s.currency || 'USD'; byCur[c] = (byCur[c] || 0) + monthlyNative(s) }
      return { byCur, count: active.length, free }
    }
    let m = 0
    for (const s of active) m += monthlyIn(s, display)
    return { month: m, count: active.length, free }
  }, [subs, display, rates])

  const insights = useMemo(() => {
    const active = subs.filter((s) => s.active)
    const paid = active.filter((s) => !isFreeCycle(s.cycle))
    const byKind = { trial: 0, tier: 0, bundle: 0, free: 0 }
    for (const s of active) if (isFreeCycle(s.cycle)) byKind[s.cycle === 'free' ? 'free' : s.cycle]++
    const byCat = {}, byPayer = {}
    for (const s of paid) {
      const m = monthlyIn(s, insCur)
      byCat[s.category || 'Uncategorised'] = (byCat[s.category || 'Uncategorised'] || 0) + m
      byPayer[s.paid_by || 'Unassigned'] = (byPayer[s.paid_by || 'Unassigned'] || 0) + m
    }
    let projected = 0, projCount = 0
    for (const s of active.filter((s) => s.cycle === 'trial' && s.price_after_trial)) {
      projected += convert(Number(s.price_after_trial), s.currency || 'USD', insCur, rates) || 0; projCount++
    }
    const up = []
    for (const s of active) {
      const nd = effDate(s); const d = daysUntil(nd)
      if (d != null && d <= 30 && d >= -7) up.push({ id: s.id, name: s.name, date: nd, d, label: dateLabel(s.cycle).toLowerCase() })
      const cd = daysUntil(s.contract_end)
      if (cd != null && cd <= 60 && cd >= 0) up.push({ id: s.id + '-c', name: s.name, date: s.contract_end, d: cd, label: 'contract ends' })
    }
    up.sort((a, b) => a.d - b.d)
    const needsAttention = active.filter((s) => !s.paid_by || (['trial', 'monthly', 'yearly'].includes(s.cycle) && !s.renews_on)).length
    return { paidCount: paid.length, freeCount: active.length - paid.length, byKind, byCat, byPayer, upcoming: up, needsAttention, projected, projCount, monthNow: totals.month || 0 }
  }, [subs, rates, insCur, totals])

  const peopleOptions = [...new Set([...people, 'Shared', 'Family', 'Work'])]
  const payerOpts = [...new Set(subs.map((s) => s.paid_by).filter(Boolean))]
  const providerOpts = [...new Set(subs.map((s) => s.provider).filter(Boolean))]
  const categoryOpts = [...new Set(subs.map((s) => s.category).filter(Boolean))]
  const subsById = useMemo(() => Object.fromEntries(subs.map((s) => [s.id, s])), [subs])
  const childrenOf = useMemo(() => {
    const m = {}
    for (const s of subs) if (s.parent_id) (m[s.parent_id] = m[s.parent_id] || []).push(s)
    return m
  }, [subs])

  async function addNew(values) { await createSubscription({ ...values, ownerId: user.id }); setAdding(false); await load(); toast('Subscription added') }
  async function saveEdit(id, values) {
    const free = isFreeCycle(values.cycle)
    await updateSubscription(id, {
      name: values.name, cost: free ? 0 : Number(values.cost) || 0, currency: values.currency, cycle: values.cycle,
      category: values.category || null, plan: values.plan || null, provider: values.provider || null, paid_by: values.paidBy || null,
      renews_on: values.renewsOn || null, reminded_for: null, auto_renew: values.autoRenew !== false,
      price_after_trial: values.priceAfterTrial ? Number(values.priceAfterTrial) : null,
      contract_end: values.contractEnd || null, term_months: values.termMonths ? Number(values.termMonths) : null,
      payment_method: values.paymentMethod || null, parent_id: values.parentId || null, note: values.note || null,
    })
    setEditing(null); await load(); toast('Saved')
  }
  async function toggle(s) { await updateSubscription(s.id, { active: !s.active }); load() }
  async function remove(s) { if (!confirm(`Remove ${s.name}?`)) return; await deleteSubscription(s.id); load() }
  function changeDisplay(c) { setDisplay(c); setPref('currency', c) }
  function changePeriod(p) { setPeriod(p); setPref('subPeriod', p) }

  // top-level = no parent (orphans whose parent is gone are treated top-level)
  const topLevel = subs.filter((s) => !s.parent_id || !subsById[s.parent_id])
  const view = topLevel.filter((s) =>
    (filter === 'all' || (filter === 'active' ? s.active : !s.active)) &&
    (!fPayer || s.paid_by === fPayer) && (!fProvider || s.provider === fProvider) && (!fCategory || s.category === fCategory))
  const sorted = [...view].sort((a, b) => {
    if (sort === 'cost') return monthlyIn(b, insCur) - monthlyIn(a, insCur)
    if (sort === 'renewal') { const da = daysUntil(effDate(a)), db = daysUntil(effDate(b)); if (da == null) return 1; if (db == null) return -1; return da - db }
    return new Date(a.created_at) - new Date(b.created_at)
  })

  const editSub = editing ? subsById[editing] : null
  const parentChoices = subs.map((s) => ({ id: s.id, name: s.name }))

  function priceLine(s) {
    const c = s.currency || 'USD'
    if (isFreeCycle(s.cycle)) {
      if (s.cycle === 'trial' && s.price_after_trial) return <span>then <strong>{fmt(Number(s.price_after_trial), c)}</strong>/mo</span>
      return <span className="faint">{FREE_BADGE[s.cycle] || 'Free'}</span>
    }
    const conv = display !== 'ALL' && c !== display ? monthlyIn(s, display) * perMul : null
    return <span><strong>{fmt(Number(s.cost), c)}</strong> /{s.cycle === 'yearly' ? 'yr' : 'mo'}{conv != null && <span className="faint"> · ≈ {fmt(conv, display)}{perSuffix}</span>}</span>
  }

  // Compact one-line row for a bundled child (and its own children, indented).
  function NestedItem({ s, depth = 0 }) {
    const kids = childrenOf[s.id] || []
    return (
      <div style={{ marginLeft: depth ? 14 : 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border)' }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => setEditing(s.id)}>
            <span style={{ fontWeight: 600 }}>{s.name}</span>
            {s.plan && <span className="faint" style={{ fontSize: 12 }}> · {s.plan}</span>}
          </span>
          <span className="row" style={{ gap: 6, flexShrink: 0 }}>
            {isFreeCycle(s.cycle) && <span className="chip" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>{FREE_BADGE[s.cycle] || 'Free'}</span>}
            <button className="btn sm ghost" onClick={() => setEditing(s.id)} title="Edit">✎</button>
            <button className="btn sm ghost" onClick={() => remove(s)} title="Remove">✕</button>
          </span>
        </div>
        {kids.map((k) => <NestedItem key={k.id} s={k} depth={depth + 1} />)}
      </div>
    )
  }

  function Card({ s }) {
    const free = isFreeCycle(s.cycle)
    const nd = effDate(s); const d = daysUntil(nd); const cd = daysUntil(s.contract_end)
    const kids = childrenOf[s.id] || []
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: s.active ? 1 : 0.5 }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <strong style={{ fontSize: 16 }}>{s.name}</strong>
          {free && <span className="chip" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>{FREE_BADGE[s.cycle]}</span>}
        </div>
        <div style={{ fontSize: 14 }}>{priceLine(s)}</div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {s.plan && <span className="chip">{s.plan}</span>}
          {s.category && <span className="chip" style={{ color: catColor(s.category), borderColor: catColor(s.category) }}>{s.category}</span>}
          {s.provider && <span className="chip">via {s.provider}</span>}
          {s.paid_by && <span className="chip">{s.paid_by}</span>}
          {s.payment_method && <span className="chip">{s.payment_method}</span>}
          {!free && s.auto_renew === false && <span className="chip">No auto-renew</span>}
        </div>
        {nd && <div style={{ fontSize: 12, color: urgencyColor(d) }}>{dateLabel(s.cycle)} {fmtDate(nd)} · {countdownText(d)}</div>}
        {s.contract_end && <div style={{ fontSize: 12, color: cd != null && cd <= 30 ? '#f5b50a' : 'var(--muted)' }}>📄 Contract ends {fmtDate(s.contract_end)}{cd != null && cd >= 0 ? ` · ${countdownText(cd)}` : ''}</div>}
        {s.note && <div className="faint" style={{ fontSize: 12 }}>{s.note}</div>}

        {kids.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <span className="faint" style={{ fontSize: 11 }}>Includes</span>
            {kids.map((k) => <NestedItem key={k.id} s={k} />)}
          </div>
        )}

        <div className="row" style={{ gap: 6, marginTop: 6 }}>
          <button className="btn sm" onClick={() => setEditing(s.id)}>Edit</button>
          <button className="btn sm" onClick={() => toggle(s)}>{s.active ? 'Pause' : 'Resume'}</button>
          <button className="btn sm ghost" onClick={() => remove(s)} title="Remove">✕</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 1040 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Subscriptions</h1>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="seg">
            {[['mo', 'Monthly'], ['yr', 'Yearly']].map(([v, l]) => (
              <button key={v} className={period === v ? 'on' : ''} onClick={() => changePeriod(v)}>{l}</button>
            ))}
          </div>
          <select value={display} onChange={(e) => changeDisplay(e.target.value)} style={{ width: 'auto' }}>
            <option value="ALL">All currencies</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>Show in {c}</option>)}
          </select>
          <button className="btn primary" onClick={() => setAdding(true)}>+ Add</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', margin: '16px 0' }}>
        {display === 'ALL' ? (
          <Stat v={Object.keys(totals.byCur).length ? Object.entries(totals.byCur).map(([c, m]) => fmt(m * perMul, c)).join(' · ') : 'n/a'} l={`Per ${period === 'yr' ? 'year' : 'month'}`} s="each in its own currency" />
        ) : (
          <Stat v={fmt((totals.month || 0) * perMul, display)} l={`Per ${period === 'yr' ? 'year' : 'month'}`} s={`≈ ${fmt((totals.month || 0) * (period === 'yr' ? 1 : 12), display)}/${period === 'yr' ? 'mo' : 'yr'}`} />
        )}
        <Stat v={totals.count} l="Active services" s={totals.free ? `${totals.free} free/included` : undefined} />
        {insights.projCount > 0 && <Stat v={`+${fmt(insights.projected * perMul, insCur)}`} l={`If ${insights.projCount} trial${insights.projCount > 1 ? 's' : ''} convert`} s={`new ≈ ${fmt((insights.monthNow + insights.projected) * perMul, insCur)}${perSuffix}`} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 16 }}>
        {insights.upcoming.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(245,181,10,0.4)' }}>
            <strong>⏰ Coming up</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {insights.upcoming.map((u) => (
                <div key={u.id} className="row" style={{ gap: 8, justifyContent: 'space-between' }}>
                  <span>{u.name} <span className="faint">· {u.label} {fmtDate(u.date)}</span></span>
                  <span style={{ color: urgencyColor(u.d), fontWeight: 600, whiteSpace: 'nowrap' }}>{countdownText(u.d)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {insights.paidCount + insights.freeCount > 0 && (
          <details className="card" open>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Insights & breakdown</summary>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="faint">{insights.paidCount} paid · {insights.freeCount} free
                {insights.freeCount > 0 && <> ({[['trial', 'trial'], ['tier', 'free tier'], ['bundle', 'bundled']].filter(([k]) => insights.byKind[k]).map(([k, l]) => `${insights.byKind[k]} ${l}`).join(', ')})</>}</div>
              <Breakdown title={`Spend by category (${insCur}${perSuffix})`} map={insights.byCat} mul={perMul} fmt={(n) => fmt(n, insCur)} barColor={catColor} />
              <Breakdown title={`Who pays (${insCur}${perSuffix})`} map={insights.byPayer} mul={perMul} fmt={(n) => fmt(n, insCur)} />
            </div>
          </details>
        )}
      </div>

      {insights.needsAttention > 0 && (
        <div className="faint" style={{ marginBottom: 12, fontSize: 13 }}>⚠️ {insights.needsAttention} subscription{insights.needsAttention > 1 ? 's' : ''} missing a payer or a renewal/trial date. Open one to add it.</div>
      )}

      {subs.length > 0 && (
        <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="seg">
            {[['all', 'All'], ['active', 'Active'], ['paused', 'Paused']].map(([v, l]) => (
              <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <FilterSelect value={fPayer} onChange={setFPayer} all="Any payer" options={payerOpts} />
          <FilterSelect value={fProvider} onChange={setFProvider} all="Any provider" options={providerOpts} />
          <FilterSelect value={fCategory} onChange={setFCategory} all="Any category" options={categoryOpts} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
            <option value="added">Sort: Added</option>
            <option value="renewal">Sort: Next renewal</option>
            <option value="cost">Sort: Cost (high → low)</option>
          </select>
        </div>
      )}

      {loading ? <Spinner /> : subs.length === 0 ? (
        <Empty icon="💳">No subscriptions yet. Tap <strong>+ Add</strong> to track what you pay for, plus free trials and bundled services.</Empty>
      ) : sorted.length === 0 ? (
        <Empty icon="🔍">No subscriptions match these filters.</Empty>
      ) : (
        <div style={{ columnWidth: '280px', columnGap: '12px' }}>
          {sorted.map((s) => (
            <div key={s.id} style={{ breakInside: 'avoid', WebkitColumnBreakInside: 'avoid', marginBottom: 12 }}>
              <Card s={s} />
            </div>
          ))}
        </div>
      )}

      {display !== 'ALL' && rates && <div className="faint" style={{ marginTop: 12, fontSize: 12 }}>Converted to {display} at today’s rates.</div>}

      {adding && (
        <Modal title="Add a subscription" onClose={() => setAdding(false)}>
          <SubForm people={peopleOptions} parents={parentChoices} defaultCur={defCur} submitLabel="Add" onSubmit={addNew} onCancel={() => setAdding(false)} />
        </Modal>
      )}
      {editSub && (
        <Modal title={`Edit ${editSub.name}`} onClose={() => setEditing(null)}>
          <SubForm
            people={peopleOptions}
            parents={parentChoices.filter((p) => p.id !== editSub.id)}
            defaultCur={editSub.currency || defCur}
            initial={{
              name: editSub.name, cost: isFreeCycle(editSub.cycle) ? '' : String(editSub.cost ?? ''),
              currency: editSub.currency || defCur, cycle: editSub.cycle || 'monthly',
              category: editSub.category || '', plan: editSub.plan || '', provider: editSub.provider || '', paidBy: editSub.paid_by || '',
              renewsOn: editSub.renews_on ? String(editSub.renews_on).slice(0, 10) : '', autoRenew: editSub.auto_renew !== false,
              priceAfterTrial: editSub.price_after_trial ? String(editSub.price_after_trial) : '',
              contractEnd: editSub.contract_end ? String(editSub.contract_end).slice(0, 10) : '', termMonths: editSub.term_months ? String(editSub.term_months) : '',
              paymentMethod: editSub.payment_method || '', parentId: editSub.parent_id || '', note: editSub.note || '',
            }}
            submitLabel="Save" onSubmit={(v) => saveEdit(editSub.id, v)} onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function SubForm({ initial, people, parents = [], defaultCur, submitLabel, onSubmit, onCancel }) {
  const init = initial || {}
  const [provSel, provOtherInit] = splitOther(init.provider || '', PROVIDERS)
  const [paidSel, paidOtherInit] = splitOther(init.paidBy || '', people)
  const [paySel, payOtherInit] = splitOther(init.paymentMethod || '', PAYMENT_METHODS)

  // Service is a free-type combobox (type anything; SERVICES are just suggestions),
  // so we keep the raw name rather than a select value + "Other" split.
  const [service, setService] = useState(init.name || '')
  const [cost, setCost] = useState(init.cost || '')
  const [cur, setCur] = useState(init.currency || defaultCur)
  const [cycle, setCycle] = useState(init.cycle || 'monthly')
  const [category, setCategory] = useState(init.category || '')
  const [plan, setPlan] = useState(init.plan || '')
  const [provider, setProvider] = useState(provSel)
  const [providerOther, setProviderOther] = useState(provOtherInit)
  const [paidBy, setPaidBy] = useState(paidSel)
  const [paidByOther, setPaidByOther] = useState(paidOtherInit)
  const [renewsOn, setRenewsOn] = useState(init.renewsOn || '')
  const [autoRenew, setAutoRenew] = useState(init.autoRenew !== false)
  const [priceAfterTrial, setPriceAfterTrial] = useState(init.priceAfterTrial || '')
  const [contractEnd, setContractEnd] = useState(init.contractEnd || '')
  const [termMonths, setTermMonths] = useState(init.termMonths || '')
  const [payMethod, setPayMethod] = useState(paySel)
  const [payMethodOther, setPayMethodOther] = useState(payOtherInit)
  const [parentId, setParentId] = useState(init.parentId || '')
  const [note, setNote] = useState(init.note || '')
  const [moreOpen, setMoreOpen] = useState(!!(init.contractEnd || init.termMonths || init.parentId))
  const [busy, setBusy] = useState(false)

  const isFree = isFreeCycle(cycle)
  const isTrial = cycle === 'trial'
  const isRecurring = cycle === 'monthly' || cycle === 'yearly'
  const name = service.trim()
  const providerVal = (provider === OTHER ? providerOther : provider).trim()
  const paidByVal = (paidBy === OTHER ? paidByOther : paidBy).trim()
  const payMethodVal = (payMethod === OTHER ? payMethodOther : payMethod).trim()

  async function submit(e) {
    e.preventDefault()
    if (!name || (!isFree && !cost)) return
    setBusy(true)
    try {
      await onSubmit({
        name, cost, currency: cur, cycle, category, plan, provider: providerVal, paidBy: paidByVal,
        renewsOn, autoRenew, priceAfterTrial: isTrial ? priceAfterTrial : '', contractEnd, termMonths,
        paymentMethod: payMethodVal, parentId, note: note.trim(),
      })
    } catch (e2) { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <Field label="Service">
        <Combobox value={service} onChange={setService} options={SERVICES} placeholder="Type a service, e.g. Netflix" />
      </Field>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Cost" flex="1 1 90px">
          <input type="number" min="0" step="0.01" value={isFree ? '' : cost} disabled={isFree} onChange={(e) => setCost(e.target.value)} placeholder={isFree ? 'Free' : '0.00'} />
        </Field>
        <Field label="Currency" flex="1 1 90px">
          <select value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </Field>
        <Field label="Billing" flex="1 1 150px">
          <select value={cycle} onChange={(e) => setCycle(e.target.value)}>{CYCLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
      </div>

      {isTrial && (
        <Field label="Price after trial (optional)">
          <input type="number" min="0" step="0.01" value={priceAfterTrial} onChange={(e) => setPriceAfterTrial(e.target.value)} placeholder={`What it'll cost in ${cur} after the trial`} />
        </Field>
      )}

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Category" flex="1 1 150px">
          <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Select category…</option>{CATEGORIES.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </Field>
        <Field label="Plan / tier" flex="1 1 130px">
          <select value={plan} onChange={(e) => setPlan(e.target.value)}><option value="">Select plan…</option>{PLANS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </Field>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Field label="Provided / bundled via" flex="1 1 180px">
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="">Select provider…</option>{PROVIDERS.map((o) => <option key={o} value={o}>{o}</option>)}<option value={OTHER}>{OTHER}</option>
          </select>
          {provider === OTHER && <input value={providerOther} onChange={(e) => setProviderOther(e.target.value)} placeholder="Type the provider" style={{ marginTop: 8 }} />}
        </Field>
        <Field label="Paid by" flex="1 1 150px">
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Select who pays…</option>{people.map((o) => <option key={o} value={o}>{o}</option>)}<option value={OTHER}>{OTHER}</option>
          </select>
          {paidBy === OTHER && <input value={paidByOther} onChange={(e) => setPaidByOther(e.target.value)} placeholder="Type a name" style={{ marginTop: 8 }} />}
        </Field>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label={isTrial ? 'Trial ends on' : 'Renews / ends on (optional)'} flex="1 1 160px">
          <input type="date" value={renewsOn} onChange={(e) => setRenewsOn(e.target.value)} />
        </Field>
        <Field label="Payment method" flex="1 1 150px">
          <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            <option value="">Select method…</option>{PAYMENT_METHODS.map((o) => <option key={o} value={o}>{o}</option>)}<option value={OTHER}>{OTHER}</option>
          </select>
          {payMethod === OTHER && <input value={payMethodOther} onChange={(e) => setPayMethodOther(e.target.value)} placeholder="e.g. Visa …4321" style={{ marginTop: 8 }} />}
        </Field>
      </div>

      {isRecurring && (
        <label className="row" style={{ gap: 8, marginTop: 12, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} style={{ width: 'auto' }} />
          <span className="faint">Auto-renews (date rolls forward automatically)</span>
        </label>
      )}

      <button type="button" className="btn sm ghost" style={{ marginTop: 12 }} onClick={() => setMoreOpen((o) => !o)}>{moreOpen ? '− Bundle & contract' : '+ Bundle & contract'}</button>
      {moreOpen && (
        <>
          {parents.length > 0 && (
            <Field label="Part of / bundled under (optional)">
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Not bundled</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Field label="Contract ends on" flex="1 1 160px"><input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} /></Field>
            <Field label="Min. term (months)" flex="1 1 120px"><input type="number" min="0" step="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="e.g. 18" /></Field>
          </div>
        </>
      )}

      <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isFree ? 'e.g. “Muneeza’s account, I share it”' : 'Optional note'} /></Field>

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn primary" disabled={busy || !name || (!isFree && !cost)}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

function Breakdown({ title, map, fmt, mul = 1, barColor }) {
  const entries = Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  if (!entries.length) return <div><div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>{title}</div><div className="faint">Nothing paid yet.</div></div>
  const max = entries[0][1]
  return (
    <div>
      <div className="faint" style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
              <span className="row" style={{ gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: barColor ? barColor(k) : 'var(--green)', flexShrink: 0 }} />{k}</span>
              <span style={{ fontWeight: 600 }}>{fmt(v * mul)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: barColor ? barColor(k) : 'var(--green)', opacity: 0.9, width: `${Math.max(8, (v / max) * 100)}%`, marginTop: 2 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, all, options }) {
  if (!options.length) return null
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 'auto' }}><option value="">{all}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
}

function Field({ label, children, flex }) {
  return (
    <label style={{ display: 'block', marginTop: 12, flex: flex || undefined, minWidth: 0 }}>
      <span className="faint" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  )
}

function Stat({ v, l, s }) {
  return <div className="stat"><div className="v" style={{ fontSize: 20 }}>{v}</div><div className="l">{l}</div>{s && <div className="s">{s}</div>}</div>
}
