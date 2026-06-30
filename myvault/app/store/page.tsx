import type { Metadata } from 'next';
import Script from 'next/script';
import { getAllProducts } from '@/lib/products';
import Link from 'next/link';
import StoreList from '@/components/StoreList';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { IconArrowRight } from '@/components/Icons';
import { SITE_URL, STORE_LIVE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Store',
  description:
    'Templates, report packs, document packs and courses for ERP and finance professionals.',
  openGraph: {
    title: 'Store',
    description:
      'Templates, report packs, document packs and courses for ERP and finance professionals.',
  },
};

export default function StorePage() {
  const products = getAllProducts();

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        description: product.description,
        category: product.category,
        url: product.gumroadUrl,
        offers: {
          '@type': 'Offer',
          price: product.price.replace(/[^0-9.]/g, ''),
          priceCurrency: 'USD',
          url: product.gumroadUrl,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="container-page py-16">
      <JsonLd data={itemListSchema} />
      {/* Gumroad embed support: this script powers Gumroad overlay checkout for
          any link with class="gumroad-button". Product "Get it" buttons link to
          their Gumroad URLs; add the class in ProductCard to enable overlays. */}
      <Script src="https://gumroad.com/js/gumroad.js" strategy="lazyOnload" />

      <PageHeader
        eyebrow="Templates · Report packs · Courses"
        title="The Store"
        intro="Proven templates, report packs and courses, built from real Oracle Fusion and finance work. Filter by category below."
      />

      {!STORE_LIVE && (
        <div className="mb-10 flex flex-col gap-4 rounded-2xl bg-foreground p-6 text-background sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Launching soon
            </p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
              The store opens shortly. Get in early.
            </h2>
            <p className="mt-1 text-sm text-background/70">
              Join the list to be first when products go live, with an early
              subscriber price.
            </p>
          </div>
          <Link
            href="/newsletter"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
          >
            Join the waitlist <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <StoreList products={products} />
    </div>
  );
}
