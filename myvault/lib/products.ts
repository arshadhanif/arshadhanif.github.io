import productsData from '@/content/products.json';
import type { ProductCategory } from './constants';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  category: ProductCategory;
  tags?: string[];
  gumroadUrl: string;
  featured: boolean;
}

export function getAllProducts(): Product[] {
  return productsData as Product[];
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
