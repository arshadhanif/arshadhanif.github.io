import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllProductIds,
  getProductById,
  getProductsByTag,
  isLive,
} from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import CloseTrackerPanel from '@/components/CloseTrackerPanel';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProductIds().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProductById(params.slug);
  if (!product) return { title: 'Not found' };
  return {
    title: product.title,
    description: product.description,
    openGraph: { title: product.title, description: product.description },
  };
}

// The flagship gets a visual preview of its Master Close Tracker.
const PREVIEW_IDS = new Set(['oracle-fusion-period-close-accelerator']);

const LIVE_POINTS = [
  'Instant download after checkout',
  'Secure checkout via Gumroad',
  'Built from real Oracle Fusion delivery',
];

const WAITLIST_POINTS = [
  'Launching soon',
  'Join the list to get it first',
  'Early subscriber price at launch',
];

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductById(params.slug);
  if (!product) notFound();

  const live = isLive(product);
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const siteBase = `${SITE_URL}${base}`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.longDescription || product.description,
    category: product.category,
    url: `${siteBase}/store/${product.id}/`,
    offers: {
      '@type': 'Offer',
      price: product.price.replace(/[^0-9.]/g, ''),
      priceCurrency: 'USD',
      // Live products advertise the real Gumroad checkout and in-stock status;
      // waitlist products point at this detail page and are marked pre-order.
      url: live ? product.gumroadUrl : `${siteBase}/store/${product.id}/`,
      availability: live
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
    },
  };

  // Related: other products sharing the first tag.
  const relatedTag = product.tags?.[0];
  const related = relatedTag
    ? getProductsByTag(relatedTag)
        .filter((p) => p.id !== product.id)
        .slice(0, 3)
    : [];

  const faqSchema =
    product.faqs && product.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: product.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  const points = live ? LIVE_POINTS : WAITLIST_POINTS;

  return (
    <div className="container-page max-w-6xl py-16">
      <JsonLd data={productSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <Breadcrumbs
        items={[{ label: 'Store', href: '/store' }, { label: product.title }]}
      />

      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Main column */}
        <div>
          <header className="border-b-2 border-foreground pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {product.category}
              </span>
              {live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Available now
                </span>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Coming soon
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {product.title}
            </h1>

            {/* Compact buy row for small screens; the buy card handles lg+. */}
            <div className="mt-6 flex flex-wrap items-center gap-4 lg:hidden">
              <span className="font-display text-3xl font-bold">
                {product.price}
              </span>
              {live ? (
                <a
                  href={product.gumroadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Get it now
                </a>
              ) : (
                <Link
                  href="/newsletter"
                  className="rounded-full bg-foreground px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Join the waitlist
                </Link>
              )}
            </div>
          </header>

          {PREVIEW_IDS.has(product.id) && (
            <figure className="mt-8">
              <CloseTrackerPanel className="print-shadow" />
              <figcaption className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                The Master Close Tracker, one of 9 sheets inside
              </figcaption>
            </figure>
          )}

          {product.freeDownloads && product.freeDownloads.length > 0 && (
            <section className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Free to read now
              </p>
              <p className="mt-2 text-sm text-muted">
                See exactly how it works before you buy. These are free, no
                email required.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {product.freeDownloads.map((d) => (
                  <a
                    key={d.url}
                    href={`${base}${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                  >
                    {d.label}{' '}
                    <span className="font-mono text-[10px] text-muted">
                      {d.format}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <div className="prose-article mt-8">
            <p>{product.longDescription || product.description}</p>
          </div>

          {product.whatsInside && product.whatsInside.length > 0 && (
            <section className="mt-10">
              <h2 className="border-b-2 border-foreground pb-3 font-display text-xl font-bold tracking-tight sm:text-2xl">
                What&apos;s inside
              </h2>
              <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {product.whatsInside.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/90">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.faqs && product.faqs.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Questions
              </h2>
              <dl className="mt-4 divide-y divide-border border-y-2 border-foreground">
                {product.faqs.map((faq) => (
                  <div key={faq.q} className="py-5">
                    <dt className="font-semibold">{faq.q}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                      {faq.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Buy card */}
        <aside className="rounded-3xl border-2 border-foreground bg-surface p-7 lg:sticky lg:top-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {live ? 'One-time purchase' : 'On the waitlist'}
          </p>
          <p className="mt-2 font-display text-5xl font-bold tracking-tight">
            {product.price}
          </p>
          {live ? (
            <a
              href={product.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-full bg-accent px-6 py-3.5 text-center font-semibold text-background transition-all hover:-translate-y-0.5 hover:bg-accent-dim"
            >
              Get it now
            </a>
          ) : (
            <Link
              href="/newsletter"
              className="mt-6 block rounded-full bg-foreground px-6 py-3.5 text-center font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Join the waitlist
            </Link>
          )}
          <ul className="mt-6 space-y-3 border-t border-border pt-6">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-muted"
              >
                <span className="mt-0.5 text-accent" aria-hidden="true">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
          {live && (
            <p className="mt-6 border-t border-border pt-5 font-mono text-[11px] uppercase tracking-wider text-accent">
              Instant download. Start using it this close.
            </p>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            You might also like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-14 text-center text-sm text-muted">
        Back to the full{' '}
        <Link href="/store" className="text-accent hover:opacity-80">
          {SITE_NAME} store
        </Link>
        .
      </p>
    </div>
  );
}
