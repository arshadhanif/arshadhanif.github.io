import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { slugify } from '@/lib/toc';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about ERP Finance Pro products, downloads, the newsletter, licensing and services.',
  openGraph: {
    title: 'FAQ',
    description:
      'Frequently asked questions about ERP Finance Pro products, downloads, the newsletter and services.',
  },
};

const GROUPS = [
  {
    title: 'Products & downloads',
    faqs: [
      { q: 'How are products delivered?', a: 'Everything in the store is delivered through Gumroad. You pay securely, then download the files straight away. There is nothing to wait for.' },
      { q: 'What format are the templates?', a: 'Most are Excel workbooks (.xlsx). Report packs include SQL and BI Publisher or OTBI assets. Document packs are editable files. Each product page lists what is inside.' },
      { q: 'Do I get updates?', a: 'When a product is updated, you can re-download the latest version from your Gumroad receipt at no extra cost.' },
      { q: 'Can I get a refund?', a: 'If something is not as described or will not open, email support and it will be put right. Reach out before raising a dispute and it gets sorted faster.' },
    ],
  },
  {
    title: 'Licensing & use',
    faqs: [
      { q: 'Can I use these at work?', a: 'Yes. Templates and packs are licensed for use on your own and your employer or client projects. You cannot resell or redistribute them as your own product.' },
      { q: 'Can I share a template with my team?', a: 'Use within one organisation is fine. For wider distribution or training material, get in touch about a team arrangement.' },
    ],
  },
  {
    title: 'Newsletter & free resources',
    faqs: [
      { q: 'What do I get for subscribing?', a: 'The free starter kit lands immediately, then practical Oracle Fusion, Excel and finance tips a few times a month. No spam, and you can unsubscribe in one click.' },
      { q: 'Do the free resources need an email?', a: 'No. The resources page has downloads you can grab with no sign-up. The starter kit is the one that arrives by email so it can include the welcome sequence.' },
    ],
  },
  {
    title: 'Services',
    faqs: [
      { q: 'Do you take on consulting work?', a: 'Yes, from a one-off configuration review to hands-on help across an Oracle Fusion implementation. See the services page or send a short note about your situation.' },
      { q: 'How much does consulting cost?', a: 'It depends on scope. Share what you need and you will get a clear quote rather than a vague day rate.' },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.faqs);

export default function FaqPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <JsonLd data={faqSchema} />
      <PageHeader
        eyebrow="Answers"
        title="FAQ"
        intro={`The questions that come up most about ${SITE_NAME} products, downloads, the newsletter and services.`}
      />

      <div className="mb-12 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <a
            key={g.title}
            href={`#${slugify(g.title)}`}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {g.title}
          </a>
        ))}
      </div>

      <div className="space-y-12">
        {GROUPS.map((g) => (
          <section key={g.title} id={slugify(g.title)} className="scroll-mt-24">
            <h2 className="border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {g.title}
            </h2>
            <dl className="divide-y divide-border">
              {g.faqs.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-border bg-surface p-7 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Still stuck?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          If your question is not here, send a note and you will get a real
          answer.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
