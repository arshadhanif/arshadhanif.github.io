import type { Metadata } from 'next';
import Link from 'next/link';
import RatioCalculator from '@/components/calculators/RatioCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Financial Ratio Calculator',
  description:
    'A free financial ratio calculator: current ratio, quick ratio, debt to equity, gross margin, net margin and return on equity from a few balance sheet and P&L inputs.',
  openGraph: {
    title: 'Financial Ratio Calculator',
    description:
      'Liquidity, leverage and profitability ratios from a few balance sheet and P&L inputs.',
  },
};

export default function RatioCalculatorPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: 'Financial Ratio Calculator' },
        ]}
      />

      <header className="mb-8 mt-5 border-b-2 border-foreground pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Financial Ratio Calculator
        </h1>
        <p className="mt-4 text-lg text-muted">
          Drop in a few figures from the balance sheet and income statement to
          get the liquidity, leverage and profitability ratios analysts and
          lenders look at first.
        </p>
      </header>

      <RatioCalculator />

      <div className="mt-10">
        <NewsletterSignup
          heading="Get more finance tools"
          subheading={`Join the ${SITE_NAME} newsletter for new tools, templates and practical guides, plus the free starter kit.`}
        />
      </div>
    </div>
  );
}
