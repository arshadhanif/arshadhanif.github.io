import type { Metadata } from 'next';
import Link from 'next/link';
import { SOLUTIONS } from '@/lib/solutions';
import PageHeader from '@/components/PageHeader';
import { IconArrowRight } from '@/components/Icons';

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
      <PageHeader
        eyebrow="The index"
        title="Solutions"
        intro="Start with what you are trying to do. Each hub pulls together the articles, tools and templates for that job in one place."
      />

      <div className="border-y-2 border-foreground">
        {SOLUTIONS.map((s, idx) => (
          <Link
            key={s.slug}
            href={`/solutions/${s.slug}`}
            className={`group grid gap-4 py-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 ${
              idx > 0 ? 'border-t border-border' : ''
            }`}
          >
            <span className="font-display text-4xl font-bold text-accent sm:text-6xl">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight transition-colors group-hover:text-accent sm:text-4xl">
                {s.title}
              </h2>
              <p className="mt-2 max-w-2xl text-base text-muted sm:text-lg">
                {s.intro}
              </p>
            </div>
            <IconArrowRight className="hidden h-7 w-7 transition-transform group-hover:translate-x-2 md:block" />
          </Link>
        ))}
      </div>
    </div>
  );
}
