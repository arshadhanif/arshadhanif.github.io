import type { Metadata } from 'next';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Join the MyVault newsletter for practical ERP, Oracle Fusion, Excel and finance career insights, plus the free starter kit.',
  openGraph: {
    title: 'Newsletter',
    description:
      'Join the MyVault newsletter for practical ERP, Oracle Fusion, Excel and finance career insights.',
  },
};

const BENEFITS = [
  'The free ERP and Finance Starter Kit the moment you join',
  'Practical Oracle Fusion and ERP tips you can use straight away',
  'Excel techniques and templates for finance work',
  'Career insights for breaking into and growing in consulting',
  'A first look at new products and free resources',
];

export default function NewsletterPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <header className="mb-10 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
          Free · No spam
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          The {SITE_NAME} Newsletter
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Join finance and ERP professionals getting practical insights straight
          to their inbox. Subscribe and the free starter kit is yours.
        </p>
      </header>

      <ul className="mx-auto mb-10 max-w-xl space-y-3">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-3 text-muted">
            <span className="mt-1 text-accent" aria-hidden="true">
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <NewsletterSignup
        heading="Subscribe for free"
        subheading="One email, a few times a month. Unsubscribe anytime."
      />
    </div>
  );
}
