import type { Heading } from '@/lib/toc';

/**
 * Compact "on this page" box rendered at the top of long articles. Static
 * anchor links to the h2/h3 ids that the MDX renderer assigns.
 */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav
      aria-label="On this page"
      className="my-8 rounded-2xl border border-border bg-surface p-5"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        On this page
      </p>
      <ol className="mt-3 space-y-1.5">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${h.id}`}
              className="text-sm text-foreground/75 transition-colors hover:text-accent"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
