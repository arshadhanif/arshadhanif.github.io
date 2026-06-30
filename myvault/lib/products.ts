import productsData from '@/content/products.json';
import type { ProductCategory } from './constants';

export interface ProductFaq {
  q: string;
  a: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  category: ProductCategory;
  tags?: string[];
  gumroadUrl: string;
  featured: boolean;
  // Optional richer detail-page content. Falls back to description if absent.
  longDescription?: string;
  whatsInside?: string[];
  faqs?: ProductFaq[];
  // Free collateral (whitepaper, one-pager) offered on the product page.
  freeDownloads?: { label: string; url: string; format: string }[];
}

export function getAllProducts(): Product[] {
  return productsData as Product[];
}

/**
 * A product is "live" (real, buyable checkout) when it has a real Gumroad URL,
 * not a placeholder. This lets a single product go live with a working
 * checkout while the rest stay on the "Notify me" waitlist, independent of the
 * site-wide STORE_LIVE switch.
 */
export function isLive(product: Product): boolean {
  return (
    !!product.gumroadUrl && !product.gumroadUrl.includes('placeholder')
  );
}

export function getProductById(id: string): Product | null {
  return getAllProducts().find((p) => p.id === id) ?? null;
}

export function getAllProductIds(): string[] {
  return getAllProducts().map((p) => p.id);
}

export function getFeaturedProducts(limit = 3): Product[] {
  return getAllProducts()
    .filter((p) => p.featured)
    .slice(0, limit);
}

/** Products carrying a given tag (case-insensitive), e.g. "Excel". */
export function getProductsByTag(tag: string): Product[] {
  const t = tag.toLowerCase();
  return getAllProducts().filter((p) =>
    (p.tags ?? []).some((x) => x.toLowerCase() === t)
  );
}
