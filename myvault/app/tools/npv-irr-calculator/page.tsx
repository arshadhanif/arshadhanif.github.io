import type { Metadata } from 'next';
import Link from 'next/link';
import NpvIrrCalculator from '@/components/calculators/NpvIrrCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'NPV & IRR Calculator',
  description:
    'A free NPV and IRR calculator for investment appraisal: enter a discount rate, an initial investment and yearly cash flows to get net present value, internal rate of return, profitability index and payback.',
  openGraph: {
    title: 'NPV & IRR Calculator',
    description:
      'Net present value, internal rate of return, profitability index and payback for any project.',
  },
};

export default function NpvIrrCalculatorPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: 'NPV & IRR Calculator' },
        ]}
      />

      <header className="mb-8 mt-5 border-b-2 border-foreground pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          NPV &amp; IRR Calculator
        </h1>
        <p className="mt-4 text-lg text-muted">
          Appraise a project or investment in seconds. Enter a discount rate, the
          upfront investment and the cash flows it throws off, and get the net
          present value, internal rate of return, profitability index and
          payback period.
        </p>
      </header>

      <NpvIrrCalculator />

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Build the full model in Excel
        </h2>
        <p className="mt-2 text-sm text-muted">
          The Excel hub has financial models that take this further with
          scenarios, sensitivity tables and a three-statement build.
        </p>
        <Link
          href="/excel"
          className="mt-4 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          Explore Excel models
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
