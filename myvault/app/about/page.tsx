import type { Metadata } from 'next';
import Link from 'next/link';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What MyVault is, who it is for, and the person behind it. A resource hub for ERP and finance professionals.',
  openGraph: {
    title: 'About',
    description:
      'What MyVault is, who it is for, and the person behind it.',
  },
};

const TRUST_SIGNALS = [
  { stat: '13+', label: 'Clients served' },
  { stat: 'PwC', label: 'Professional network' },
  { stat: 'ACCA', label: 'Qualified' },
  { stat: 'Oracle', label: 'Certified' },
];

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          About {SITE_NAME}
        </h1>
        <p className="mt-4 text-lg text-muted">
          {SITE_NAME} is a resource hub for ERP and finance professionals. It is
          the place to find templates, report packs and straight answers on
          Oracle Fusion, Excel and running a finance function.
        </p>
      </header>

      <section className="prose-article">
        <h2>Why {SITE_NAME} exists</h2>
        <p>
          Most finance and ERP people rebuild the same things over and over. The
          same close checklist. The same reporting layout. The same project
          documents. The knowledge is out there, but it is scattered, generic, or
          locked inside expensive consulting engagements.
        </p>
        <p>
          {SITE_NAME} pulls that work into one place. The goal is simple: give you
          the templates, guides and tools that would otherwise take years to
          collect, so you can get a result this week instead of next quarter.
        </p>

        <h2>Who it is for</h2>
        <p>
          Finance professionals, ERP consultants, analysts and anyone who works
          in or around Oracle Fusion and the month-end grind. If you have ever
          stared at a blank spreadsheet wishing someone had already built the
          thing, this is for you.
        </p>

        <h2>What you will find</h2>
        <p>
          Ready-to-use templates and report packs, implementation document kits,
          courses, and a steady stream of practical articles on Oracle Fusion,
          Excel, ERP strategy, tools and finance careers.
        </p>
      </section>

      {/* Who's behind MyVault */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">
          Who is behind {SITE_NAME}
        </h2>

        <div className="mt-6 flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-start">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-background">
            {FOUNDER.name.split(' ').map((n) => n.charAt(0)).join('')}
          </div>
          <div>
            <p className="text-base font-semibold">{FOUNDER.name}</p>
            <p className="text-sm text-accent">{FOUNDER.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {FOUNDER.shortBio}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

        <ul className="mt-6 space-y-3">
          {FOUNDER.credentials.map((c) => (
            <li key={c} className="flex items-start gap-3 text-muted">
              <span className="mt-1 text-accent" aria-hidden="true">
                ✓
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 rounded-xl border border-border bg-surface p-7 text-center">
        <h2 className="text-xl font-semibold">Need hands-on help?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {SITE_NAME} also offers advisory, coaching and Oracle Fusion consulting
          for teams that want a faster result.
        </p>
        <Link
          href="/services"
          className="mt-5 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          See services
        </Link>
      </div>
    </div>
  );
}
