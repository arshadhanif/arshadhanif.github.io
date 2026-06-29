import type { Metadata } from 'next';
import { GLOSSARY, GLOSSARY_CATEGORIES } from '@/lib/glossary';
import { slugify } from '@/lib/toc';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Glossary of Oracle Fusion & Finance Terms',
  description:
    'Plain-language definitions of the Oracle Fusion, reporting and finance terms that come up most: ledgers, business units, OTBI, subject areas, depreciation, the month-end close and more.',
  openGraph: {
    title: 'Glossary of Oracle Fusion & Finance Terms',
    description:
      'Plain-language definitions of the Oracle Fusion, reporting and finance terms that come up most.',
  },
};

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'ERP Finance Pro Glossary',
    hasDefinedTerm: GLOSSARY.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
    })),
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <JsonLd data={jsonLd} />
      <PageHeader
        eyebrow="Knowledge base"
        title="Glossary"
        intro="Plain-language definitions of the Oracle Fusion, reporting and finance terms that come up most. No jargon for the sake of it."
      />

      {/* Category jump nav */}
      <div className="mb-12 flex flex-wrap gap-2">
        {GLOSSARY_CATEGORIES.map((c) => (
          <a
            key={c}
            href={`#${slugify(c)}`}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {c}
          </a>
        ))}
      </div>

      <div className="space-y-16">
        {GLOSSARY_CATEGORIES.map((category) => {
          const terms = GLOSSARY.filter((t) => t.category === category);
          return (
            <section key={category} id={slugify(category)} className="scroll-mt-24">
              <h2 className="border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {category}
              </h2>
              <dl className="mt-2 divide-y divide-border">
                {terms.map((t) => (
                  <div
                    key={t.term}
                    id={slugify(t.term)}
                    className="scroll-mt-24 grid gap-2 py-6 md:grid-cols-[1fr_2fr] md:gap-10"
                  >
                    <dt className="font-display text-lg font-bold tracking-tight">
                      {t.term}
                    </dt>
                    <dd className="leading-relaxed text-muted">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}
