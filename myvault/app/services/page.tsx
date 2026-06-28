import type { Metadata } from 'next';
import { AUTHOR } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Work with Arshad Hanif directly — expert advisory calls, CV & career coaching, and Oracle Fusion consulting.',
  openGraph: {
    title: 'Services',
    description:
      'Work with Arshad Hanif directly — expert advisory calls, CV & career coaching, and Oracle Fusion consulting.',
  },
};

const SERVICES = [
  {
    title: 'Expert Advisory Calls',
    description:
      'Book a focused 1:1 session to work through an Oracle Fusion challenge, a reporting problem, or an ERP decision. Walk away with a clear, actionable plan.',
    subject: 'Expert Advisory Call enquiry',
  },
  {
    title: 'CV & Career Coaching',
    description:
      'Get your CV, LinkedIn, and interview approach reviewed by someone who has hired and worked across the ERP and finance space. Position yourself to land the role.',
    subject: 'CV & Career Coaching enquiry',
  },
  {
    title: 'Oracle Fusion Consulting',
    description:
      'Hands-on implementation, configuration, and optimisation support for Oracle Fusion Financials — from fit-gap through go-live and beyond.',
    subject: 'Oracle Fusion Consulting enquiry',
  },
];

export default function ServicesPage() {
  return (
    <div className="container-page py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Work with me
        </h1>
        <p className="mt-4 text-lg text-muted">
          Direct, practical help from an Oracle Fusion consultant. Pick the option
          that fits and book a call.
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
              href={`mailto:${AUTHOR.email}?subject=${encodeURIComponent(
                service.subject
              )}`}
              className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Book a Call
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
