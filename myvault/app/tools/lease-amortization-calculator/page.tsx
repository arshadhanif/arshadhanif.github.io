import type { Metadata } from 'next';
import Link from 'next/link';
import AmortizationCalculator from '@/components/calculators/AmortizationCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Loan & Lease Amortization Calculator',
  description:
    'A free amortization calculator for loans and leases: monthly payment, total interest, and a payment schedule showing interest, principal and balance.',
  openGraph: {
    title: 'Loan & Lease Amortization Calculator',
    description:
      'Monthly payment, total interest and a full payment schedule for loans and leases.',
  },
};

export default function AmortizationCalculatorPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: 'Amortization Calculator' },
        ]}
      />

      <header className="mb-8 mt-5 border-b-2 border-foreground pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Loan &amp; Lease Amortization
        </h1>
        <p className="mt-4 text-lg text-muted">
          Enter an amount, rate and term to see the monthly payment, the total
          interest, and a payment schedule that splits each instalment into
          interest, principal and remaining balance.
        </p>
      </header>

      <AmortizationCalculator />

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Need the full schedule in Excel?
        </h2>
        <p className="mt-2 text-sm text-muted">
          The Excel hub has finance models and templates that build amortization
          and lease schedules you can drop into your own workbook.
        </p>
        <Link
          href="/excel"
          className="mt-4 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          Explore Excel templates
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
