'use client';

import { useState } from 'react';

const FIELDS = [
  { key: 'currentAssets', label: 'Current assets' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'currentLiabilities', label: 'Current liabilities' },
  { key: 'totalDebt', label: 'Total debt' },
  { key: 'equity', label: 'Total equity' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'cogs', label: 'Cost of goods sold' },
  { key: 'netIncome', label: 'Net income' },
] as const;

type Key = (typeof FIELDS)[number]['key'];

const DEFAULTS: Record<Key, string> = {
  currentAssets: '500000',
  inventory: '120000',
  currentLiabilities: '300000',
  totalDebt: '400000',
  equity: '800000',
  revenue: '1200000',
  cogs: '720000',
  netIncome: '180000',
};

function ratio(n: number, d: number, suffix = 'x') {
  if (!d) return 'n/a';
  return `${(n / d).toFixed(2)}${suffix}`;
}
function pct(n: number, d: number) {
  if (!d) return 'n/a';
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function RatioCalculator() {
  const [v, setV] = useState<Record<Key, string>>(DEFAULTS);
  const num = (k: Key) => Number(v[k]) || 0;

  const results = [
    { l: 'Current ratio', v: ratio(num('currentAssets'), num('currentLiabilities')), hint: 'Liquidity: aim above 1.0' },
    { l: 'Quick ratio', v: ratio(num('currentAssets') - num('inventory'), num('currentLiabilities')), hint: 'Liquidity excl. inventory' },
    { l: 'Debt to equity', v: ratio(num('totalDebt'), num('equity')), hint: 'Leverage' },
    { l: 'Gross margin', v: pct(num('revenue') - num('cogs'), num('revenue')), hint: 'Revenue minus COGS' },
    { l: 'Net margin', v: pct(num('netIncome'), num('revenue')), hint: 'Profit per revenue' },
    { l: 'Return on equity', v: pct(num('netIncome'), num('equity')), hint: 'Profit per equity' },
  ];

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none';
  const labelClass = 'font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Inputs</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input
                className={`mt-1.5 ${inputClass}`}
                inputMode="numeric"
                value={v[f.key]}
                onChange={(e) => setV((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Ratios</h2>
        <div className="mt-5 divide-y divide-border border-y-2 border-foreground">
          {results.map((r) => (
            <div key={r.l} className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-medium">{r.l}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{r.hint}</p>
              </div>
              <span className="font-display text-2xl font-bold text-accent">{r.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">
          Benchmarks vary by industry. Use these as a quick read, not a verdict.
        </p>
      </div>
    </div>
  );
}
