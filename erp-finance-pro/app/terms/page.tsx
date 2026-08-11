import type { Metadata } from 'next';
import { SITE_NAME, CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms governing your use of ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated: August 2026</p>
      </header>

      <section className="prose-article">
        <p>
          By using {SITE_NAME}, you agree to these terms. Please read them
          carefully.
        </p>

        <h2>Use of content</h2>
        <p>
          The articles, templates, and resources on this site are provided for
          your professional and educational use. You may use and adapt purchased
          and free templates within your own organisation. You may not resell,
          redistribute, or republish the content as your own.
        </p>

        <h2>Products and downloads</h2>
        <p>
          Digital products are delivered electronically. Because of the nature of
          digital goods, all sales are final unless the product is faulty or not
          as described. If something is not right, contact us and we will make it
          right.
        </p>

        <h2>Advisory and consulting services</h2>
        <p>
          Advisory calls and consulting engagements are provided on a
          best-efforts professional basis. Guidance is tailored to the
          information you share and does not constitute a guarantee of any
          specific outcome. Always validate configuration changes in a test
          environment before applying them to production systems.
        </p>

        <h2>No warranty</h2>
        <p>
          Content is provided &ldquo;as is&rdquo; without warranty of any kind.
          {' '}{SITE_NAME} is not liable for any loss arising from the use of the
          information or materials on this site.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </section>
    </div>
  );
}
