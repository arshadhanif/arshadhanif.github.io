import { IconChart, IconArrowRight, IconCheck } from '@/components/Icons';

/**
 * A hand-built faux reporting dashboard used as the hero graphic. Pure markup
 * and theme tokens, so it recolours with every theme and needs no image asset.
 */
export default function HeroVisual() {
  const bars = [42, 65, 38, 80, 54, 72, 48];

  return (
    <div className="relative">
      {/* Glow behind the panel */}
      <div className="blob blob-accent -right-10 -top-10 h-48 w-48" />
      <div className="blob blob-accent -bottom-12 -left-6 h-40 w-40 opacity-30" />

      <div className="relative animate-float rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30">
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
          <span className="ml-3 text-xs text-muted">monthly-close.xlsx</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            <IconCheck className="h-3 w-3" /> Reconciled
          </span>
        </div>

        <div className="space-y-5 p-5">
          {/* KPI tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Revenue', value: '$4.82M', delta: '+12%' },
              { label: 'Margin', value: '38.4%', delta: '+2.1pt' },
              { label: 'Variance', value: '0.3%', delta: 'within' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border border-border bg-surface-alt p-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  {kpi.label}
                </p>
                <p className="mt-1 text-lg font-bold">{kpi.value}</p>
                <p className="text-[11px] font-medium text-accent">{kpi.delta}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-border bg-surface-alt p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <IconChart className="h-4 w-4 text-accent" /> Cash by month
              </span>
              <span className="text-xs text-muted">FY26</span>
            </div>
            <div className="flex h-24 items-end gap-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Table rows */}
          <div className="space-y-2">
            {[
              ['GL · Trial balance', 'Tied out'],
              ['AP · Accruals', 'Posted'],
              ['FA · Depreciation', 'Run'],
            ].map(([row, status]) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <IconArrowRight className="h-3.5 w-3.5 text-accent" />
                  {row}
                </span>
                <span className="text-xs font-medium text-muted">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
