import type { Metadata } from 'next';
import Link from 'next/link';
import ExcelFormulaGenerator from '@/components/ExcelFormulaGenerator';
import NewsletterSignup from '@/components/NewsletterSignup';
import Breadcrumbs from '@/components/Breadcrumbs';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Excel Formula Generator for Finance',
  description:
    'A free tool that builds the Excel formulas finance teams use most: XLOOKUP, SUMIFS, EOMONTH, IFERROR and more. Pick a task, fill in the blanks, copy the formula.',
  openGraph: {
    title: 'Excel Formula Generator for Finance',
    description:
      'Build the Excel formulas finance teams use most. Pick a task, fill in the blanks, copy the formula.',
  },
};

export default function ExcelFormulaGeneratorPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: 'Excel Formula Generator' },
        ]}
      />

      <header className="mb-8 mt-5 border-b-2 border-foreground pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Excel Formula Generator for Finance
        </h1>
        <p className="mt-4 text-lg text-muted">
          Pick what you are trying to do, fill in your cells and ranges, and copy
          a ready-to-use formula. Built around the functions finance and ERP
          people reach for every day.
        </p>
      </header>

      <ExcelFormulaGenerator />

      <div className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Want the templates, not just the formulas?</h2>
        <p className="mt-2 text-sm text-muted">
          The Excel hub has ready-made finance templates and courses built on
          these exact techniques.
        </p>
        <Link
          href="/excel"
          className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Explore Excel on {SITE_NAME}
        </Link>
      </div>

      <div className="mt-10">
        <NewsletterSignup
          heading="Get more Excel tips"
          subheading="Join the newsletter for practical Excel and finance techniques, plus the free starter kit."
        />
      </div>
    </div>
  );
}
