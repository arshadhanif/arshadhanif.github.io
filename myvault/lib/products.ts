import productsData from '@/content/products.json';
import type { ProductCategory } from './constants';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  category: ProductCategory;
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
