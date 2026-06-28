import type { Metadata } from 'next';
import Script from 'next/script';
import { getAllProducts } from '@/lib/products';
import StoreList from '@/components/StoreList';

export const metadata: Metadata = {
  title: 'Store',
  description:
    'Premium templates, report packages, document packs, and courses for ERP and finance professionals.',
  openGraph: {
    title: 'Store',
    description:
      'Premium templates, report packages, document packs, and courses for ERP and finance professionals.',
  },
};

export default function StorePage() {
  const products = getAllProducts();

  return (
    <div className="container-page py-16">
      {/* Gumroad embed support: this script powers Gumroad overlay checkout for
          any link with class="gumroad-button". Product "Get it" buttons link to
          their Gumroad URLs; add the class in ProductCard to enable overlays. */}
      <Script src="https://gumroad.com/js/gumroad.js" strategy="lazyOnload" />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          The Store
        </h1>
        <p className="mt-4 text-lg text-muted">
          Proven templates, report packs and courses, built from real Oracle
          Fusion and finance work. Filter by category below.
        </p>
      </header>

      <StoreList products={products} />
    </div>
  );
}
