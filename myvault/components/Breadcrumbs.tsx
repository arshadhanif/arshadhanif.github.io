import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Editorial breadcrumb trail in monospace, matching the data treatment used
 * across the site. The last crumb is the current page (no link).
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wider text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'text-foreground' : ''}>{item.label}</span>
              )}
              {!last && <span aria-hidden="true" className="text-border">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
