'use client';

import { useState } from 'react';

function money(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AmortizationCalculator() {
  const [principal, setPrincipal] = useState('50000');
  const [annualRate, setAnnualRate] = useState('8');
  const [months, setMonths] = useState('36');

  const p = Math.max(0, Number(principal) || 0);
  const i = (Math.max(0, Number(annualRate) || 0) / 100) / 12;
  const n = Math.max(1, Math.round(Number(months) || 1));

  const payment = i === 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n));
  const totalPaid = payment * n;
  const totalInterest = totalPaid - p;

  // First and last three rows of the schedule.
  const schedule: { m: number; interest: number; principal: number; balance: number }[] = [];
  let balance = p;
  for (let m = 1; m <= n; m++) {
    const interest = balance * i;
    const principalPart = payment - interest;
    balance = Math.max(0, balance - principalPart);
    schedule.push({ m, interest, principal: principalPart, balance });
  }
  const preview =
    schedule.length > 6
      ? [...schedule.slice(0, 3), null, ...schedule.slice(-3)]
      : schedule;

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none';
  const labelClass = 'font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Amount</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Annual rate (%)</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Term (months)</label>
          <input className={`mt-1.5 ${inputClass}`} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {[
          { l: 'MONTHLY PAYMENT', v: money(payment) },
          { l: 'TOTAL INTEREST', v: money(totalInterest) },
          { l: 'TOTAL PAID', v: money(totalPaid) },
        ].map((k) => (
          <div key={k.l} className="bg-surface p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{k.l}</p>
            <p className="mt-1 font-display text-xl font-bold sm:text-2xl">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4 text-right">Interest</th>
              <th className="py-2 pr-4 text-right">Principal</th>
              <th className="py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {preview.map((row, idx) =>
              row === null ? (
                <tr key={`gap-${idx}`} className="border-b border-border">
                  <td className="py-2 text-center text-muted" colSpan={4}>···</td>
                </tr>
              ) : (
                <tr key={row.m} className="border-b border-border">
                  <td className="py-2 pr-4">{row.m}</td>
                  <td className="py-2 pr-4 text-right">{money(row.interest)}</td>
                  <td className="py-2 pr-4 text-right">{money(row.principal)}</td>
                  <td className="py-2 text-right">{money(row.balance)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-xs text-muted">
        Assumes a fixed rate and equal monthly payments. For leases, check the
        treatment under IFRS 16 or ASC 842 with your accounting policy.
      </p>
    </div>
  );
}
