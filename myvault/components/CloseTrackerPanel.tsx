/**
 * A stylised mock of the Period Close Accelerator's Master Close Tracker.
 * Pure CSS (no images), built on theme tokens so it adapts to every theme.
 * Used in the homepage hero and as the product preview on the flagship page.
 */

const KPIS = [
  { l: 'MODULES', v: '12', d: 'in scope' },
  { l: 'COMPLETE', v: '100%', d: '+ on time' },
  { l: 'CLOSE', v: '3.0d', d: '-5.0d' },
];

const ROWS: { name: string; status: string; width: string; tone: 'done' | 'progress' | 'out' }[] = [
  { name: 'General Ledger', status: 'Complete', width: '100%', tone: 'done' },
  { name: 'Payables', status: 'Complete', width: '100%', tone: 'done' },
  { name: 'Receivables', status: '92%', width: '92%', tone: 'progress' },
  { name: 'Lease Accounting', status: 'Out of scope', width: '0%', tone: 'out' },
];

export default function CloseTrackerPanel({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-2xl border border-border bg-surface ${className}`}
    >
      {/* Browser chrome bar */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f0857a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f2c14e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#5bbf8a]" />
        <span className="ml-2 font-mono text-xs text-muted">
          master-close-tracker.xlsx
        </span>
        <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-accent">
          FY26
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3">
        {KPIS.map((k, i) => (
          <div
            key={k.l}
            className={`px-5 py-4 ${i < 2 ? 'border-r border-border' : ''} border-b border-border`}
          >
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted">{k.l}</p>
            <p className="mt-1 font-display text-2xl font-bold">{k.v}</p>
            <p className="font-mono text-[11px] font-semibold text-accent">{k.d}</p>
          </div>
        ))}
      </div>

      {/* Module rows */}
      <div className="space-y-4 px-5 py-5">
        {ROWS.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between">
              <span
                className={`text-[13px] font-semibold ${
                  r.tone === 'out' ? 'text-muted/70' : ''
                }`}
              >
                {r.name}
              </span>
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${
                  r.tone === 'done'
                    ? 'text-accent'
                    : r.tone === 'progress'
                      ? 'text-[#c98f2e]'
                      : 'text-muted/70'
                }`}
              >
                {r.status}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/50 to-accent"
                style={{ width: r.width }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
          12 / 12 MODULES IN SCOPE
        </span>
        <span className="rounded-full bg-accent px-3.5 py-1 font-mono text-[11px] font-extrabold tracking-[0.08em] text-background">
          CLOSED
        </span>
      </div>
    </div>
  );
}
