import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} handles your data.`,
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeader eyebrow="Legal" title="Privacy Policy" />

      <div className="prose-article">
        <p>
          This policy explains what {SITE_NAME} collects, why, and what your
          choices are. It is written to be readable, not to bury anything in
          legalese. Last updated June 2026.
        </p>

        <h2>What we collect</h2>
        <p>
          If you subscribe to the newsletter, we collect your email address and
          basic engagement data (such as whether emails are opened) through our
          email provider, Beehiiv. If you buy a product, the transaction is
          handled by Gumroad, which collects the details needed to process your
          payment and deliver the file. {SITE_NAME} does not see or store your
          full payment card details.
        </p>
        <p>
          The site may use privacy-friendly analytics to understand which pages
          are useful. Where used, it is configured to avoid collecting
          personally identifying information.
        </p>

        <h2>How we use it</h2>
        <p>
          To send the newsletter and the resources you ask for, to deliver and
          support products you buy, and to improve the site. We do not sell your
          data.
        </p>

        <h2>Third parties</h2>
        <p>
          We rely on a small number of processors to run the site: Beehiiv for
          email, Gumroad for payments and delivery, and GitHub Pages for
          hosting. Each handles your data under its own terms.
        </p>

        <h2>Your choices</h2>
        <p>
          You can unsubscribe from the newsletter at any time using the link in
          any email. You can request a copy or deletion of the data we hold
          about you by emailing{' '}
          <a href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a>.
        </p>
      </div>
    </div>
  );
}
