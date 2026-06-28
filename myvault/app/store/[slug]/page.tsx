import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllProductIds,
  getProductById,
  getProductsByTag,
} from '@/lib/products';
import ProductCard from '@/components/ProductCard';
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

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductById(params.slug);
  if (!product) notFound();

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
      url: product.gumroadUrl,
      availability: 'https://schema.org/InStock',
    },
  };

  // Related: other products sharing the first tag.
  const relatedTag = product.tags?.[0];
  const related = relatedTag
    ? getProductsByTag(relatedTag)
        .filter((p) => p.id !== product.id)
        .slice(0, 3)
    : [];

  return (
    <div className="container-page max-w-3xl py-16">
      <JsonLd data={productSchema} />

      <nav className="text-sm text-muted">
        <Link href="/store" className="hover:text-accent">
          Store
        </Link>
        <span className="px-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <header className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          {product.category}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {product.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="text-3xl font-bold">{product.price}</span>
          <a
            href={product.gumroadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
          >
            Get it now
          </a>
        </div>
      </header>

      <div className="prose-article mt-8">
        <p>{product.longDescription || product.description}</p>
      </div>

      {product.whatsInside && product.whatsInside.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">What's inside</h2>
          <ul className="mt-4 space-y-2.5">
            {product.whatsInside.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted">
                <span className="mt-0.5 text-accent" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.faqs && product.faqs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Questions</h2>
          <dl className="mt-4 divide-y divide-border border-y border-border">
            {product.faqs.map((faq) => (
              <div key={faq.q} className="py-4">
                <dt className="font-semibold">{faq.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-10 rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-lg font-semibold">{product.price}</p>
        <a
          href={product.gumroadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Get {product.title}
        </a>
        <p className="mt-3 text-xs text-muted">
          Secure checkout via Gumroad. Instant download.
        </p>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            You might also like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-sm text-muted">
        Back to the full{' '}
        <Link href="/store" className="text-accent hover:opacity-80">
          {SITE_NAME} store
        </Link>
        .
      </p>
    </div>
  );
}
