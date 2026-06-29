'use client';

import { useMemo, useState } from 'react';

function money(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function npv(rate: number, flows: number[]) {
  // flows[0] is the year-0 cash flow (usually the negative investment).
  return flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

// IRR by bisection over a sign change, robust enough for typical appraisals.
function irr(flows: number[]): number | null {
  let lo = -0.9;
  let hi = 1;
  let fLo = npv(lo, flows);
  let fHi = npv(hi, flows);
  // Expand the upper bound until we bracket a root or give up.
  let tries = 0;
  while (fLo * fHi > 0 && hi < 1000 && tries < 60) {
    hi *= 1.5;
    fHi = npv(hi, flows);
    tries++;
  }
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export default function NpvIrrCalculator() {
  const [rate, setRate] = useState('10');
  const [investment, setInvestment] = useState('100000');
  const [flows, setFlows] = useState<string[]>(['30000', '35000', '40000', '45000', '50000']);

  const r = (Number(rate) || 0) / 100;
  const inv = Number(investment) || 0;
  const series = useMemo(() => [-(inv), ...flows.map((f) => Number(f) || 0)], [inv, flows]);

  const npvValue = npv(r, series);
  const irrValue = irr(series);
  const totalIn = flows.reduce((a, f) => a + (Number(f) || 0), 0);
  const pi = inv > 0 ? (npvValue + inv) / inv : 0;

  // Payback: first year cumulative inflows cover the investment.
  let cumulative = 0;
  let payback: string = 'beyond term';
  for (let i = 0; i < flows.length; i++) {
    cumulative += Number(flows[i]) || 0;
    if (cumulative >= inv) {
      payback = `${i + 1} yr`;
      break;
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none';
  const labelClass = 'font-mono text-[11px] uppercase tracking-wider text-muted';

  function updateFlow(i: number, v: string) {
    setFlows((prev) => prev.map((f, idx) => (idx === i ? v : f)));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Discount rate (%)</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Initial investment (year 0)</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={investment} onChange={(e) => setInvestment(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Cash inflows by year</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFlows((p) => [...p, '0'])}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent"
            >
              + Year
            </button>
            <button
              type="button"
              onClick={() => setFlows((p) => (p.length > 1 ? p.slice(0, -1) : p))}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent"
            >
              − Year
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {flows.map((f, i) => (
            <div key={i}>
              <label className={labelClass}>Year {i + 1}</label>
              <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={f} onChange={(e) => updateFlow(i, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {[
          { l: 'NPV', v: money(npvValue), accent: npvValue >= 0 },
          { l: 'IRR', v: irrValue === null ? 'n/a' : `${(irrValue * 100).toFixed(1)}%`, accent: irrValue !== null && irrValue >= r },
          { l: 'PROFITABILITY INDEX', v: pi.toFixed(2), accent: pi >= 1 },
          { l: 'PAYBACK', v: payback, accent: true },
        ].map((k) => (
          <div key={k.l} className="bg-surface p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{k.l}</p>
            <p className={`mt-1 font-display text-xl font-bold sm:text-2xl ${k.accent ? 'text-accent' : ''}`}>{k.v}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        NPV discounts every cash flow back to today at your rate; a positive NPV
        means the project beats that hurdle. IRR is the rate where NPV is zero.
        Total inflows here: {money(totalIn)}. Estimates for appraisal only.
      </p>
    </div>
  );
}
