import type { Metadata } from 'next';
import Link from 'next/link';
import { SOLUTIONS } from '@/lib/solutions';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'Focused hubs for the things finance and ERP teams work on most: Oracle Fusion reporting, Excel for finance, and the month-end close.',
  openGraph: {
    title: 'Solutions',
    description:
      'Focused hubs for Oracle Fusion reporting, Excel for finance, and the month-end close.',
  },
};

export default function SolutionsPage() {
  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Solutions
        </h1>
        <p className="mt-4 text-lg text-muted">
          Start with what you are trying to do. Each hub pulls together the
          articles, tools and templates for that job in one place.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {SOLUTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/solutions/${s.slug}`}
            className="group card-hover flex h-full flex-col rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-semibold group-hover:text-accent">
              {s.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {s.intro}
            </p>
            <span className="mt-4 text-sm font-medium text-accent">Explore →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
