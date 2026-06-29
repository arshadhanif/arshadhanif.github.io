import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { FOUNDER, SITE_NAME, SOCIAL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What ERP Finance Pro is, who it is for, and the founder behind it: Arshad Hanif, ACCA member and Oracle Fusion Cloud consultant.',
  openGraph: {
    title: 'About',
    description:
      'What ERP Finance Pro is, who it is for, and the founder behind it.',
  },
};

const TRUST_SIGNALS = [
  { stat: '7+', label: 'Years experience' },
  { stat: '13+', label: 'Clients served' },
  { stat: '5', label: 'Oracle certifications' },
  { stat: 'ACCA', label: 'Member' },
];

const SELECTED_CLIENTS = [
  'Charlotte-Mecklenburg Schools (USA)',
  'Central Florida RTA, LYNX (USA)',
  'Tarshid, National Energy Services (KSA)',
  'Gerry’s International, FedEx Express (Pakistan)',
  'Indus Hospital & Health Network',
  'Hum Network',
];

export default function AboutPage() {
  const initials = FOUNDER.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('');

  return (
    <div className="container-page max-w-3xl py-16">
      <PageHeader
        eyebrow="About"
        title={`About ${SITE_NAME}`}
        intro={`${SITE_NAME} is a resource hub for ERP and finance professionals. It is the place to find templates, report packs and straight answers on Oracle Fusion, Excel and running a finance function.`}
      />

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

      {/* Meet the founder */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">Meet the founder</h2>

        <div className="mt-6 flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-start">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-background">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold">{FOUNDER.name}</p>
            <p className="text-sm text-accent">{FOUNDER.title}</p>
            <p className="text-xs text-muted">{FOUNDER.location}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:opacity-80"
              >
                LinkedIn
              </a>
              <a
                href={FOUNDER.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:opacity-80"
              >
                Full portfolio
              </a>
            </div>
          </div>
        </div>

        <div className="prose-article mt-6">
          <p>
            {SITE_NAME} is run by {FOUNDER.name}, an ACCA member and Oracle Fusion
            Cloud consultant based in {FOUNDER.location}. Over more than seven
            years he has delivered end-to-end ERP implementations and finance
            transformation for clients across the UAE, USA, Saudi Arabia, Canada,
            Australia and Pakistan.
          </p>
          <p>
            His career started at Capital Accounting and was shaped at A.F.
            Ferguson &amp; Co. (PwC Pakistan), where he delivered four complete
            end-to-end Oracle Fusion implementations as a module lead across
            General Ledger, Payables, Receivables, Fixed Assets, Procurement and
            more. He went on to lead Oracle ERP engagements at TATA Pakistan and
            Gerry’s Group, managing teams of up to eight consultants, and now
            works independently with global clients.
          </p>
          <p>
            Beyond enterprise Oracle, he works hands-on with Excel and financial
            modelling, Xero and QuickBooks. The templates and guides on{' '}
            {SITE_NAME} come straight out of that day-to-day work.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {TRUST_SIGNALS.map((t) => (
            <div key={t.label} className="bg-surface p-5 text-center">
              <div className="font-display text-3xl font-bold text-accent">{t.stat}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Credentials and expertise */}
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Credentials
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOUNDER.credentials.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 text-accent" aria-hidden="true">
                    ✓
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Expertise
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {FOUNDER.expertise.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs text-muted"
                >
                  {e}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">
              Selected clients
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {SELECTED_CLIENTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-16 rounded-xl border border-border bg-surface p-7 text-center">
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
