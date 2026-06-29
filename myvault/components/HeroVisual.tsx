import { IconChart, IconCheck, IconBolt } from '@/components/Icons';

/**
 * A layered, glassy reporting composition used as the hero graphic. Built from
 * markup and theme tokens, so it recolours with every theme and ships no image
 * asset. A main dashboard panel sits behind two floating accent cards for depth.
 */
export default function HeroVisual() {
  const bars = [38, 58, 44, 72, 52, 84, 66];

  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      {/* Ambient glow behind the stack */}
      <div className="blob blob-accent -right-8 -top-10 h-52 w-52" />
      <div className="blob blob-accent -bottom-10 -left-6 h-40 w-40 opacity-30" />

      {/* Main panel */}
      <div className="relative animate-float-slow rounded-2xl border border-border/80 bg-surface/80 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5">
        <div className="rounded-xl border border-border bg-surface">
          {/* Window bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-xs text-muted">monthly-close.xlsx</span>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {/* KPI tiles */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenue', value: '$4.82M', delta: '+12%' },
                { label: 'Margin', value: '38.4%', delta: '+2.1pt' },
                { label: 'Variance', value: '0.3%', delta: 'in band' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg border border-border bg-surface-alt p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-base font-bold sm:text-lg">
                    {kpi.value}
                  </p>
                  <p className="text-[10px] font-medium text-accent">
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-border bg-gradient-to-b from-surface-alt to-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <IconChart className="h-4 w-4 text-accent" /> Cash by month
                </span>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  FY26
                </span>
              </div>
              <div className="flex h-24 items-end gap-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-accent/30 to-accent"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: reconciled card (top-right) */}
      <div className="absolute -right-3 top-10 hidden animate-float rounded-xl border border-border bg-surface/90 px-3 py-2.5 shadow-xl shadow-black/20 backdrop-blur-xl sm:flex sm:items-center sm:gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <IconCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold leading-tight">Books reconciled</p>
          <p className="text-[10px] text-muted">GL · AP · AR · FA</p>
        </div>
      </div>

      {/* Floating: time-saved chip (bottom-left) */}
      <div className="absolute -bottom-4 left-2 hidden animate-float-slow items-center gap-2.5 rounded-xl border border-border bg-surface/90 px-3 py-2.5 shadow-xl shadow-black/20 backdrop-blur-xl sm:flex">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <IconBolt className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold leading-tight">Close cut to 3 days</p>
          <p className="text-[10px] text-muted">from 8, same team</p>
        </div>
      </div>
    </div>
  );
}
