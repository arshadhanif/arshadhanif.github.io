import type { Metadata } from 'next';
import Script from 'next/script';
import { getAllProducts, isLive } from '@/lib/products';
import Link from 'next/link';
import StoreList from '@/components/StoreList';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { IconArrowRight } from '@/components/Icons';
import { SITE_URL } from '@/lib/constants';

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
  const liveProducts = products.filter(isLive);
  const featuredLive = liveProducts[0];

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const siteBase = `${SITE_URL}${base}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => {
      // Only products with a real checkout are advertised as in stock with a
      // Gumroad URL. Waitlist products point at their detail page and are
      // marked pre-order so search engines do not surface a dead offer link.
      const live = isLive(product);
      const offerUrl = live
        ? product.gumroadUrl
        : `${siteBase}/store/${product.id}/`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.title,
          description: product.description,
          category: product.category,
          url: offerUrl,
          offers: {
            '@type': 'Offer',
            price: product.price.replace(/[^0-9.]/g, ''),
            priceCurrency: 'USD',
            url: offerUrl,
            availability: live
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
          },
        },
      };
    }),
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

      {featuredLive ? (
        <div className="mb-10 flex flex-col gap-4 rounded-2xl bg-foreground p-6 text-background sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Available now
            </p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
              {featuredLive.title}
            </h2>
            <p className="mt-1 text-sm text-background/70">
              Our first product is live. More templates and report packs are
              landing soon, join the list to hear first.
            </p>
          </div>
          <Link
            href={`/store/${featuredLive.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
          >
            View product <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
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
