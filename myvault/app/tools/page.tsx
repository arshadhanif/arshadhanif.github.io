import type { Metadata } from 'next';
import Link from 'next/link';
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
];

export default function ToolsPage() {
  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Free Tools
        </h1>
        <p className="mt-4 text-lg text-muted">
          Quick, free tools to make finance and ERP work easier. No sign-up, no
          installs, they run right in your browser. More on the way.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {tool.tag}
            </span>
            <h2 className="mt-3 text-lg font-semibold group-hover:text-accent">
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
