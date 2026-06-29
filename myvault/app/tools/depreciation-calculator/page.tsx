import type { Metadata } from 'next';
import Link from 'next/link';
import DepreciationCalculator from '@/components/calculators/DepreciationCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Depreciation Calculator',
  description:
    'A free depreciation calculator for finance teams: straight line and reducing balance, with a full year-by-year schedule of depreciation, accumulated depreciation and book value.',
  openGraph: {
    title: 'Depreciation Calculator',
    description:
      'Straight line and reducing balance depreciation with a full year-by-year schedule.',
  },
};

export default function DepreciationCalculatorPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: 'Depreciation Calculator' },
        ]}
      />

      <header className="mb-8 mt-5 border-b-2 border-foreground pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Depreciation Calculator
        </h1>
        <p className="mt-4 text-lg text-muted">
          Work out depreciation the way finance and ERP teams need it: pick
          straight line or reducing balance and get a clean year-by-year
          schedule of depreciation, accumulated depreciation and book value.
        </p>
      </header>

      <DepreciationCalculator />

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Setting Fixed Assets up in Oracle Fusion?
        </h2>
        <p className="mt-2 text-sm text-muted">
          The reporting hub covers the corporate book, depreciation methods and
          the queries to tie assets back to the GL.
        </p>
        <Link
          href="/solutions/oracle-fusion-reporting"
          className="mt-4 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          See Oracle Fusion reporting
        </Link>
      </div>

      <div className="mt-10">
        <NewsletterSignup
          heading="Get more finance tools"
          subheading={`Join the ${SITE_NAME} newsletter for new tools, templates and practical guides, plus the free starter kit.`}
        />
      </div>
    </div>
  );
}
