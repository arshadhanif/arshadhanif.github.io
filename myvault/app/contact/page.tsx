import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { IconArrowRight } from '@/components/Icons';
import { FOUNDER, SITE_NAME, SOCIAL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with ERP Finance Pro: advisory calls, Oracle Fusion consulting, product support, or a general enquiry.',
  openGraph: {
    title: 'Contact',
    description:
      'Get in touch with ERP Finance Pro for advisory, consulting, support or a general enquiry.',
  },
};

const OPTIONS = [
  {
    title: 'Advisory or consulting',
    body: 'A focused session on an Oracle Fusion, reporting or close problem, or hands-on implementation help.',
    subject: 'Advisory / consulting enquiry',
    cta: 'Start a conversation',
  },
  {
    title: 'Product support',
    body: 'A question about a template, report pack or course you bought, or trouble with a download.',
    subject: 'Product support',
    cta: 'Get help',
  },
  {
    title: 'Partnerships or speaking',
    body: 'Collaboration, a guest piece, a workshop, or anything else worth a conversation.',
    subject: 'Partnership / speaking enquiry',
    cta: 'Reach out',
  },
];

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        intro={`The fastest way to reach ${SITE_NAME} is email. Pick the option that fits and your message lands with a clear subject, so it gets to the right place.`}
      />

      <div className="grid gap-5 md:grid-cols-3">
        {OPTIONS.map((o, idx) => (
          <a
            key={o.title}
            href={`mailto:${FOUNDER.email}?subject=${encodeURIComponent(o.subject)}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/50"
          >
            <span className="font-mono text-sm text-accent">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold tracking-tight">
              {o.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {o.body}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              {o.cta}{' '}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>

      <div className="mt-12 grid gap-5 rounded-2xl border-2 border-foreground p-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Direct details
          </h2>
          <p className="mt-3 text-sm text-muted">Email</p>
          <a
            href={`mailto:${FOUNDER.email}`}
            className="font-mono text-sm text-accent hover:opacity-80"
          >
            {FOUNDER.email}
          </a>
          <p className="mt-4 text-sm text-muted">LinkedIn</p>
          <a
            href={SOCIAL.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:opacity-80"
          >
            Connect with the founder
          </a>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            What to expect
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Most emails get a reply within two business days. For consulting
            enquiries, a short note on your instance, timeline and what you are
            trying to solve means a useful first response instead of a back and
            forth. Prefer to read more first? See the{' '}
            <Link href="/services" className="text-accent underline underline-offset-4">
              services
            </Link>{' '}
            and{' '}
            <Link href="/faq" className="text-accent underline underline-offset-4">
              FAQ
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
