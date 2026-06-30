import Link from 'next/link';
import { IconArrowRight } from '@/components/Icons';

const LINKS = [
  { href: '/blog', label: 'Articles', note: 'Field notes on Oracle Fusion, Excel and ERP' },
  { href: '/store', label: 'Store', note: 'Templates, report packs and courses' },
  { href: '/tools', label: 'Free tools', note: 'Calculators and the formula generator' },
  { href: '/glossary', label: 'Glossary', note: 'Oracle Fusion and finance terms' },
];

export default function NotFound() {
  return (
    <div className="container-page py-20 sm:py-28">
      <p className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent">
        Error 404
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-7xl">
        Page not found
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        The page you are looking for does not exist or may have moved. Here are
        the places people head to most, or try a search.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Back home <IconArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/search" className="btn-ghost">
          Search the site
        </Link>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="group bg-surface p-6 transition-colors hover:bg-surface-alt">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold tracking-tight group-hover:text-accent">
                {l.label}
              </span>
              <IconArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </div>
            <p className="mt-1 text-sm text-muted">{l.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
