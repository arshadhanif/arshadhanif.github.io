'use client';

import { useState } from 'react';

type Method = 'straight' | 'reducing';

interface Row {
  year: number;
  depreciation: number;
  accumulated: number;
  bookValue: number;
}

function money(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function DepreciationCalculator() {
  const [cost, setCost] = useState('100000');
  const [salvage, setSalvage] = useState('10000');
  const [life, setLife] = useState('5');
  const [method, setMethod] = useState<Method>('straight');
  const [rate, setRate] = useState('40');

  const c = Math.max(0, Number(cost) || 0);
  const s = Math.max(0, Number(salvage) || 0);
  const n = Math.max(1, Math.round(Number(life) || 1));
  const r = Math.min(100, Math.max(0, Number(rate) || 0)) / 100;

  const rows: Row[] = [];
  let book = c;
  let accumulated = 0;

  for (let year = 1; year <= n; year++) {
    let dep: number;
    if (method === 'straight') {
      dep = (c - s) / n;
    } else {
      dep = book * r;
      // Do not depreciate below salvage value.
      if (book - dep < s) dep = Math.max(0, book - s);
    }
    accumulated += dep;
    book = c - accumulated;
    rows.push({ year, depreciation: dep, accumulated, bookValue: book });
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none';
  const labelClass =
    'font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Asset cost</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Salvage value</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={salvage} onChange={(e) => setSalvage(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Useful life (years)</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={life} onChange={(e) => setLife(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Method</label>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('straight')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                method === 'straight' ? 'border-accent bg-accent text-background' : 'border-border hover:border-accent'
              }`}
            >
              Straight line
            </button>
            <button
              type="button"
              onClick={() => setMethod('reducing')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                method === 'reducing' ? 'border-accent bg-accent text-background' : 'border-border hover:border-accent'
              }`}
            >
              Reducing balance
            </button>
          </div>
        </div>
        {method === 'reducing' && (
          <div>
            <label className={labelClass}>Declining rate (% per year)</label>
            <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
        )}
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 pr-4">Year</th>
              <th className="py-2 pr-4 text-right">Depreciation</th>
              <th className="py-2 pr-4 text-right">Accumulated</th>
              <th className="py-2 text-right">Book value</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((row) => (
              <tr key={row.year} className="border-b border-border">
                <td className="py-2 pr-4">{row.year}</td>
                <td className="py-2 pr-4 text-right">{money(row.depreciation)}</td>
                <td className="py-2 pr-4 text-right">{money(row.accumulated)}</td>
                <td className="py-2 text-right">{money(row.bookValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-xs text-muted">
        Estimates only, for planning. Confirm method, rate and conventions
        against your accounting policy and local tax rules.
      </p>
    </div>
  );
}
