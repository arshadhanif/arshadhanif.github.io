import type { Metadata } from 'next';
import NewsletterSignup from '@/components/NewsletterSignup';
import PageHeader from '@/components/PageHeader';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Join the ERP Finance Pro newsletter for practical ERP, Oracle Fusion, Excel and finance career insights, plus the free starter kit.',
  openGraph: {
    title: 'Newsletter',
    description:
      'Join the ERP Finance Pro newsletter for practical ERP, Oracle Fusion, Excel and finance career insights.',
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
      <PageHeader
        align="center"
        eyebrow="Free · No spam"
        title={`The ${SITE_NAME} Newsletter`}
        intro="Join finance and ERP professionals getting practical insights straight to their inbox. Subscribe and the free starter kit is yours."
      />

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
