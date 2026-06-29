import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Free Tools',
  description:
    'Free browser-based tools for finance and ERP professionals, starting with an Excel formula generator.',
  openGraph: {
    title: 'Free Tools',
    description: 'Free browser-based tools for finance and ERP professionals.',
  },
};

const TOOLS = [
  {
    href: '/tools/excel-formula-generator',
    title: 'Excel Formula Generator',
    description:
      'Build the Excel formulas finance teams use most. Pick a task, fill in the blanks, copy the formula.',
    tag: 'Excel',
  },
  {
    href: '/tools/depreciation-calculator',
    title: 'Depreciation Calculator',
    description:
      'Straight line or reducing balance, with a full year-by-year schedule of depreciation and book value.',
    tag: 'Fixed Assets',
  },
  {
    href: '/tools/lease-amortization-calculator',
    title: 'Loan & Lease Amortization',
    description:
      'Monthly payment, total interest and a payment schedule for loans and leases.',
    tag: 'Finance',
  },
  {
    href: '/tools/financial-ratio-calculator',
    title: 'Financial Ratio Calculator',
    description:
      'Liquidity, leverage and profitability ratios from a few balance sheet and P&L inputs.',
    tag: 'Analysis',
  },
  {
    href: '/tools/npv-irr-calculator',
    title: 'NPV & IRR Calculator',
    description:
      'Appraise a project: net present value, internal rate of return, profitability index and payback.',
    tag: 'Appraisal',
  },
];

export default function ToolsPage() {
  return (
    <div className="container-page py-16">
      <PageHeader
        eyebrow="Run in your browser"
        title="Free Tools"
        intro="Quick, free tools to make finance and ERP work easier. No sign-up, no installs, they run right in your browser. More on the way."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/50"
          >
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {tool.tag}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold tracking-tight group-hover:text-accent">
              {tool.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {tool.description}
            </p>
            <span className="mt-4 text-sm font-medium text-accent">Open tool →</span>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Have an idea for a tool that would help your work? Tell {SITE_NAME} on the{' '}
        <Link href="/about" className="text-accent underline underline-offset-4">
          about page
        </Link>
        .
      </p>
    </div>
  );
}
