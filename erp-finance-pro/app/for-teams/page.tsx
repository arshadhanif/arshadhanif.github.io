import type { Metadata } from 'next';
import Link from 'next/link';
import { AUTHOR, CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'For Teams',
  description:
    'Oracle Fusion support for your whole team. Group advisory, tailored upskilling, in-house implementation support, and custom report and template builds for finance and ERP teams.',
  openGraph: {
    title: 'Oracle Fusion Support for Teams',
    description:
      'Group advisory, tailored upskilling, implementation support, and custom report builds for finance and ERP teams.',
  },
};

const OFFERINGS = [
  {
    title: 'Team advisory & workshops',
    body: 'Focused sessions for your finance and ERP team to work through a real problem together, from a stubborn reporting gap to a decision on how to structure a new entity. Your team leaves with a plan, not just notes.',
  },
  {
    title: 'Oracle Fusion upskilling',
    body: 'Practical training built around your own instance and processes, not a fixed syllabus. We work on your setup, your reports, and the tasks your team actually does, so the learning sticks and shows up in daily work.',
  },
  {
    title: 'Implementation & go-live support',
    body: 'Extra hands and expertise for your in-house team during a rollout or a phase go-live. Fit-gap, configuration, testing, and the messy final stretch before go-live, working alongside the people who own the system.',
  },
  {
    title: 'Custom report & template builds',
    body: 'Report packs and templates built for your organisation. OTBI analyses, BI Publisher documents, and finance templates like month-end close trackers, tuned to your chart of accounts and your enterprise structure.',
  },
];

const WHO_ITS_FOR = [
  {
    title: 'Finance leaders',
    body: 'You want your team to get more out of Oracle Fusion without waiting in the IT queue for every report.',
  },
  {
    title: 'ERP & IT managers',
    body: 'You need experienced support through an implementation or an upgrade, sized to the work in front of you.',
  },
  {
    title: 'In-house teams',
    body: 'Your team is capable but stretched, and a focused expert would move a specific piece of work forward fast.',
  },
];

const TRUST = [
  '13+ client engagements across real estate, media, logistics, manufacturing, and financial services',
  'Oracle Fusion Financials certified, with hands-on delivery from fit-gap to go-live',
  'ACCA-qualified, so the work is grounded in how finance teams actually operate',
  'Part of the PwC professional network',
];

export default function ForTeamsPage() {
  const proposalSubject = 'Oracle Fusion team engagement: proposal request';
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    "Hi Arshad, I'd like to talk about Oracle Fusion support for our team."
  )}`;

  return (
    <div className="container-page py-16">
      {/* Hero */}
      <header className="mb-14 max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
          For businesses & teams
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Oracle Fusion support for your whole team
        </h1>
        <p className="mt-4 text-lg text-muted">
          Bring in an experienced Oracle Fusion consultant to move a specific
          piece of work forward, lift your team's skills, or support a rollout.
          Every engagement is built around your systems and your goals.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
              proposalSubject
            )}`}
            className="w-full rounded-md bg-accent px-6 py-3 text-center font-semibold text-background transition-colors hover:bg-accent-dim sm:w-auto"
          >
            Request a proposal
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-md border border-border px-6 py-3 text-center font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
          >
            Chat on WhatsApp
          </a>
        </div>
      </header>

      {/* What I offer */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How I work with teams
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Pick what fits. Engagements can be a one-off workshop or ongoing
          support, sized to the work.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {OFFERINGS.map((o) => (
            <div
              key={o.title}
              className="rounded-xl border border-border bg-surface p-7"
            >
              <h3 className="text-lg font-semibold text-accent">{o.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Who this is for
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {WHO_ITS_FOR.map((w) => (
            <div
              key={w.title}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h3 className="text-base font-semibold text-foreground">
                {w.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why me */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Why work with {AUTHOR.name.split(' ')[0]}
        </h2>
        <ul className="mt-6 space-y-3">
          {TRUST.map((t) => (
            <li key={t} className="flex items-start gap-3 text-muted">
              <span className="mt-1 text-accent" aria-hidden="true">
                ✓
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight">
          Tell me what your team needs
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Send a short note about the work, your timeline, and your Oracle Fusion
          setup. I will come back with a clear proposal and a sensible way to
          start.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
              proposalSubject
            )}`}
            className="w-full rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim sm:w-auto"
          >
            Request a proposal
          </a>
          <Link
            href="/services"
            className="w-full rounded-md border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
          >
            Individual services
          </Link>
        </div>
      </section>
    </div>
  );
}
