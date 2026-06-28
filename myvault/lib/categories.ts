import { BLOG_CATEGORIES, type BlogCategory } from './constants';

/** Turn a category name into a URL-safe slug, e.g. "ERP Strategy" -> "erp-strategy". */
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Resolve a slug back to its canonical category name, or null if unknown. */
export function categoryFromSlug(slug: string): BlogCategory | null {
  return BLOG_CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}
