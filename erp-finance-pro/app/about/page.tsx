import type { Metadata } from 'next';
import Link from 'next/link';
import { AUTHOR, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Arshad Hanif, Oracle Fusion consultant, ACCA, and finance professional. The story and credentials behind ERP Finance Pro.',
  openGraph: {
    title: 'About',
    description:
      'Arshad Hanif, Oracle Fusion consultant, ACCA, and finance professional behind ERP Finance Pro.',
  },
};

const TRUST_SIGNALS = [
  { stat: '13+', label: 'Clients served' },
  { stat: 'PwC', label: 'Professional network' },
  { stat: 'ACCA', label: 'Qualified' },
  { stat: 'Oracle', label: 'Certified' },
];

const CREDENTIALS = [
  'Oracle Fusion Financials certified consultant',
  'ACCA-qualified finance professional',
  'Part of the PwC professional network',
  'Delivered ERP outcomes for 13+ clients across industries',
  'Hands-on across the full implementation lifecycle, fit-gap to go-live',
];

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          About {SITE_NAME}
        </h1>
        <p className="mt-4 text-lg text-muted">
          {SITE_NAME} exists to give ERP and finance professionals a shortcut to
          great work, the templates, knowledge, and guidance that usually take
          years to accumulate.
        </p>
      </header>

      {/* Trust signals */}
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TRUST_SIGNALS.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border bg-surface p-5 text-center"
          >
            <div className="text-2xl font-extrabold text-accent">{t.stat}</div>
            <div className="mt-1 text-xs text-muted">{t.label}</div>
          </div>
        ))}
      </div>

      <section className="prose-article">
        <h2>Meet {AUTHOR.name}</h2>
        <p>
          I&apos;m {AUTHOR.name}, an {AUTHOR.title} and finance professional. Over
          the years I&apos;ve helped 13+ clients implement, configure, and get
          real value out of their ERP and finance systems, most of it centred on
          Oracle Fusion Financials.
        </p>
        <p>
          My background blends formal finance training (ACCA) with deep technical
          ERP expertise (Oracle certified), shaped by working within the PwC
          professional network. That combination, understanding both the numbers
          and the systems behind them, is what {SITE_NAME} is built on.
        </p>

        <h2>What you&apos;ll find here</h2>
        <p>
          Practical, no-fluff resources: ready-to-use templates and report packs,
          implementation document kits, courses, and articles covering Oracle
          Fusion, Excel, ERP strategy, tools, and career growth.
        </p>
      </section>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">Credentials</h2>
      <ul className="mt-5 space-y-3">
        {CREDENTIALS.map((c) => (
          <li key={c} className="flex items-start gap-3 text-muted">
            <span className="mt-1 text-accent" aria-hidden="true">
              ✓
            </span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl border border-border bg-surface p-7 text-center">
        <h2 className="text-xl font-semibold">Want to work together?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          From advisory calls to full Oracle Fusion engagements, see how I can
          help.
        </p>
        <Link
          href="/services"
          className="mt-5 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          View services
        </Link>
      </div>
    </div>
  );
}
