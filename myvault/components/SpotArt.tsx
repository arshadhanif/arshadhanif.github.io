/**
 * Small themed preview graphics shown at the top of the pillar cards. Pure SVG
 * on theme tokens, so they recolour with the active theme and need no assets.
 * Each fills its container; wrap in an aspect-ratio box.
 */
type ArtProps = { className?: string };

const wrap = (className?: string) =>
  `h-full w-full ${className ?? ''}`.trim();

/* Oracle Fusion reporting: stacked report cards with a chart. */
export function ReportArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 180" className={wrap(className)} aria-hidden="true">
      <defs>
        <linearGradient id="ra-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--surface-alt))" />
          <stop offset="1" stopColor="rgb(var(--surface))" />
        </linearGradient>
        <linearGradient id="ra-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgb(var(--accent) / 0.35)" />
          <stop offset="1" stopColor="rgb(var(--accent))" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#ra-bg)" />
      {/* back card */}
      <rect x="28" y="26" width="180" height="120" rx="10"
        fill="rgb(var(--surface))" stroke="rgb(var(--border))" />
      {/* front card */}
      <rect x="60" y="46" width="200" height="118" rx="10"
        fill="rgb(var(--surface))" stroke="rgb(var(--border))" />
      <rect x="74" y="60" width="70" height="8" rx="4" fill="rgb(var(--muted) / 0.5)" />
      <rect x="74" y="76" width="120" height="6" rx="3" fill="rgb(var(--border))" />
      {/* mini chart */}
      <g>
        {[20, 38, 28, 52, 40].map((h, i) => (
          <rect key={i} x={76 + i * 22} y={132 - h} width="14" height={h}
            rx="3" fill="url(#ra-bar)" />
        ))}
      </g>
      <line x1="74" y1="132" x2="246" y2="132" stroke="rgb(var(--border))" />
    </svg>
  );
}

/* Excel for finance: spreadsheet grid with a highlighted cell and formula bar. */
export function ExcelArt({ className }: ArtProps) {
  const cols = [70, 124, 178, 232];
  const rows = [70, 96, 122];
  return (
    <svg viewBox="0 0 320 180" className={wrap(className)} aria-hidden="true">
      <defs>
        <linearGradient id="xa-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--surface-alt))" />
          <stop offset="1" stopColor="rgb(var(--surface))" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#xa-bg)" />
      {/* formula bar */}
      <rect x="44" y="30" width="232" height="20" rx="6"
        fill="rgb(var(--surface))" stroke="rgb(var(--border))" />
      <rect x="52" y="37" width="10" height="6" rx="2" fill="rgb(var(--accent))" />
      <rect x="70" y="37" width="120" height="6" rx="3" fill="rgb(var(--muted) / 0.5)" />
      {/* grid */}
      <rect x="44" y="60" width="232" height="96" rx="8"
        fill="rgb(var(--surface))" stroke="rgb(var(--border))" />
      {cols.slice(1).map((x) => (
        <line key={`c${x}`} x1={x} y1="60" x2={x} y2="156" stroke="rgb(var(--border))" />
      ))}
      {rows.map((y) => (
        <line key={`r${y}`} x1="44" y1={y} x2="276" y2={y} stroke="rgb(var(--border))" />
      ))}
      {/* header row tint */}
      <rect x="44" y="60" width="232" height="10" fill="rgb(var(--accent) / 0.1)" />
      {/* highlighted cell */}
      <rect x="124" y="96" width="54" height="26" fill="rgb(var(--accent) / 0.16)"
        stroke="rgb(var(--accent))" strokeWidth="1.5" />
    </svg>
  );
}

/* Month-end close: checklist with ticks and a progress ring. */
export function CloseArt({ className }: ArtProps) {
  const items = [70, 96, 122];
  return (
    <svg viewBox="0 0 320 180" className={wrap(className)} aria-hidden="true">
      <defs>
        <linearGradient id="ca-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--surface-alt))" />
          <stop offset="1" stopColor="rgb(var(--surface))" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#ca-bg)" />
      {/* checklist card */}
      <rect x="36" y="36" width="170" height="108" rx="10"
        fill="rgb(var(--surface))" stroke="rgb(var(--border))" />
      {items.map((y, i) => (
        <g key={y}>
          <rect x="50" y={y - 9} width="18" height="18" rx="5"
            fill={i < 2 ? 'rgb(var(--accent))' : 'rgb(var(--surface-alt))'}
            stroke="rgb(var(--border))" />
          {i < 2 && (
            <path d={`M${54} ${y} l3 3 l6 -7`} fill="none"
              stroke="rgb(var(--background))" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          )}
          <rect x="80" y={y - 4} width={i < 2 ? 96 : 70} height="7" rx="3"
            fill={i < 2 ? 'rgb(var(--muted) / 0.45)' : 'rgb(var(--border))'} />
        </g>
      ))}
      {/* progress ring */}
      <circle cx="248" cy="90" r="34" fill="none"
        stroke="rgb(var(--border))" strokeWidth="10" />
      <circle cx="248" cy="90" r="34" fill="none"
        stroke="rgb(var(--accent))" strokeWidth="10" strokeLinecap="round"
        strokeDasharray="214" strokeDashoffset="64"
        transform="rotate(-90 248 90)" />
      <text x="248" y="95" textAnchor="middle"
        fill="rgb(var(--foreground))" fontSize="18" fontWeight="700"
        fontFamily="var(--font-display)">70%</text>
    </svg>
  );
}
