import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Testimonials from '@/components/Testimonials';
import PageHeader from '@/components/PageHeader';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Advisory calls, career coaching and Oracle Fusion consulting from ERP Finance Pro, for teams and professionals who want a faster result.',
  openGraph: {
    title: 'Services',
    description:
      'Advisory calls, career coaching and Oracle Fusion consulting from ERP Finance Pro.',
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

const FAQS = [
  {
    q: 'How do advisory calls work?',
    a: 'Book in and share the problem ahead of time. You get a focused session and a short written summary with clear next steps.',
  },
  {
    q: 'Can you help with a live Oracle Fusion implementation?',
    a: 'Yes. That ranges from a one-off configuration review to hands-on help across fit-gap, build, testing and go-live.',
  },
  {
    q: 'Do you offer ongoing support?',
    a: 'Yes, either on a retainer or ad-hoc, depending on what your team needs.',
  },
  {
    q: 'How much does it cost?',
    a: 'It depends on scope. Send a short description of what you need and you will get a clear quote.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function ServicesPage() {
  return (
    <div className="container-page py-16">
      <JsonLd data={faqSchema} />
      <PageHeader
        eyebrow="Work with us"
        title="Services"
        intro={`Sometimes a template is not enough and you want someone in your corner. ${SITE_NAME} offers a few focused services. Pick the one that fits and get in touch.`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {SERVICES.map((service, idx) => (
          <div
            key={service.title}
            className="flex flex-col rounded-2xl border border-border bg-surface p-7"
          >
            <span className="font-mono text-sm text-accent">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
              {service.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
              {service.description}
            </p>
            <a
              href={`mailto:${FOUNDER.email}?subject=${encodeURIComponent(
                service.subject
              )}`}
              className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
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

      <Testimonials />

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Common questions</h2>
        <dl className="mt-6 divide-y divide-border border-y-2 border-foreground">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-5">
              <dt className="font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
