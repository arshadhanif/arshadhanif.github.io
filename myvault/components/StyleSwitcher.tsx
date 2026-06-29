import Link from 'next/link';

const STYLES = [
  { href: '/', label: 'Clean premium', note: 'Notion / Vercel · live' },
  { href: '/preview/stripe', label: 'Vivid SaaS', note: 'Stripe / Linear' },
  { href: '/preview/editorial', label: 'Bold editorial', note: 'Magazine' },
  { href: '/preview/dashboard', label: 'Finance terminal', note: 'Fintech' },
];

/**
 * Sticky bar shown on the style preview pages so the homepage can be compared
 * in each aesthetic. `active` is the href of the current page.
 */
export default function StyleSwitcher({ active }: { active: string }) {
  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container-page flex items-center gap-3 overflow-x-auto py-3">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
          Style preview
        </span>
        <div className="flex gap-2">
          {STYLES.map((s) => {
            const isActive = s.href === active;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-accent bg-accent text-background'
                    : 'border-border text-foreground/80 hover:border-accent hover:text-accent'
                }`}
              >
                {s.label}
                <span
                  className={`ml-2 hidden text-xs sm:inline ${
                    isActive ? 'text-background/70' : 'text-muted'
                  }`}
                >
                  {s.note}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
