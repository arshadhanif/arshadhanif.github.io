import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `The terms for using ${SITE_NAME} and its products.`,
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeader eyebrow="Legal" title="Terms of Use" />

      <div className="prose-article">
        <p>
          By using {SITE_NAME} you agree to these terms. They are meant to be
          fair and clear. Last updated June 2026.
        </p>

        <h2>Use of the site</h2>
        <p>
          The articles, tools and free resources are provided for general
          information. They are not a substitute for professional accounting,
          tax or legal advice tailored to your situation. Always confirm
          treatment against your own policies and local rules.
        </p>

        <h2>Products and licensing</h2>
        <p>
          Templates, report packs, document packs and courses are licensed for
          use by you and the organisation you work for or consult to. You may
          adapt them for your own projects. You may not resell, redistribute or
          publish them as your own product or template.
        </p>

        <h2>Tools and calculators</h2>
        <p>
          The calculators and generators on the site produce estimates for
          planning only. {SITE_NAME} does not guarantee their accuracy for any
          particular purpose, and is not liable for decisions made on their
          output.
        </p>

        <h2>Payments and delivery</h2>
        <p>
          Purchases are processed by Gumroad and are subject to its terms.
          Products are delivered digitally. If a product is faulty or not as
          described, email support and it will be put right.
        </p>

        <h2>Liability</h2>
        <p>
          The site and its content are provided on an as-is basis. To the extent
          allowed by law, {SITE_NAME} is not liable for any loss arising from use
          of the site, its tools or its products.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a>.
        </p>
      </div>
    </div>
  );
}
