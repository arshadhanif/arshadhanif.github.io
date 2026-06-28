import type { Metadata } from 'next';
import Link from 'next/link';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Advisory calls, career coaching and Oracle Fusion consulting from MyVault, for teams and professionals who want a faster result.',
  openGraph: {
    title: 'Services',
    description:
      'Advisory calls, career coaching and Oracle Fusion consulting from MyVault.',
  },
};

const SERVICES = [
  {
    title: 'Advisory Calls',
    description:
      'A focused session to work through an Oracle Fusion challenge, a reporting problem or an ERP decision. You leave with a clear plan you can act on.',
    subject: 'Advisory Call enquiry',
  },
  {
    title: 'Career Coaching',
    description:
      'A review of your CV, LinkedIn and interview approach from people who have hired and worked across ERP and finance. Position yourself to land the role.',
    subject: 'Career Coaching enquiry',
  },
  {
    title: 'Oracle Fusion Consulting',
    description:
      'Hands-on implementation, configuration and optimisation for Oracle Fusion Financials, from fit-gap through go-live and beyond.',
    subject: 'Oracle Fusion Consulting enquiry',
  },
];

export default function ServicesPage() {
  return (
    <div className="container-page py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Services
        </h1>
        <p className="mt-4 text-lg text-muted">
          Sometimes a template is not enough and you want someone in your corner.
          {' '}
          {SITE_NAME} offers a few focused services. Pick the one that fits and
          get in touch.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {SERVICES.map((service) => (
          <div
            key={service.title}
            className="flex flex-col rounded-xl border border-border bg-surface p-7"
          >
            <h2 className="text-xl font-semibold text-accent">{service.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
              {service.description}
            </p>
            <a
              href={`mailto:${FOUNDER.email}?subject=${encodeURIComponent(
                service.subject
              )}`}
              className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Get in touch
            </a>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-2xl text-sm text-muted">
        Services are delivered by {SITE_NAME} founder {FOUNDER.name}. You can read
        more about his background on the{' '}
        <Link href="/about" className="text-accent underline underline-offset-4">
          About page
        </Link>
        .
      </p>
    </div>
  );
}
