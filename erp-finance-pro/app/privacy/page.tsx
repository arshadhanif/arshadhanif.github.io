import type { Metadata } from 'next';
import { SITE_NAME, CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} handles your data and privacy.`,
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated: August 2026</p>
      </header>

      <section className="prose-article">
        <p>
          {SITE_NAME} respects your privacy. This policy explains what
          information we collect, why we collect it, and how it is used.
        </p>

        <h2>Information we collect</h2>
        <p>
          We only collect information you choose to give us — for example, your
          name and email address when you subscribe to the newsletter, download a
          free resource, or contact us about a service. We do not sell, rent, or
          share your personal information with third parties for their marketing.
        </p>

        <h2>How we use your information</h2>
        <ul>
          <li>To send the newsletter and updates you have opted in to receive.</li>
          <li>To deliver resources or respond to enquiries you have made.</li>
          <li>To improve the content and services offered on this site.</li>
        </ul>

        <h2>Analytics</h2>
        <p>
          This site may use privacy-friendly analytics to understand which pages
          are useful. This data is aggregated and does not personally identify
          you.
        </p>

        <h2>Your choices</h2>
        <p>
          You can unsubscribe from emails at any time using the link in any
          message. You may also request that we delete any personal information we
          hold about you by contacting us.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </section>
    </div>
  );
}
