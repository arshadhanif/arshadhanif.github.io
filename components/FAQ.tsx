'use client';

import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-foreground">
          {item.question}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-accent transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {open && (
        <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">
          {item.answer}
        </p>
      )}
    </div>
  );
}

/**
 * Accordion FAQ with embedded FAQPage structured data (JSON-LD) so the
 * questions are eligible for Google rich results / featured snippets.
 */
export default function FAQ({
  items,
  heading = 'Frequently asked questions',
  subheading,
}: {
  items: FAQItem[];
  heading?: string;
  subheading?: string;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {heading}
        </h2>
        {subheading && <p className="mt-3 text-muted">{subheading}</p>}
      </div>
      <div className="rounded-xl border border-border bg-surface px-6">
        {items.map((item) => (
          <FAQRow key={item.question} item={item} />
        ))}
      </div>
    </section>
  );
}
