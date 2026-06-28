import type { MetadataRoute } from 'next';
import { getAllPosts, getPostsByCategory } from '@/lib/posts';
import { getAllProductIds } from '@/lib/products';
import { SOLUTIONS } from '@/lib/solutions';
import { SITE_URL, BLOG_CATEGORIES } from '@/lib/constants';
import { categorySlug } from '@/lib/categories';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${basePath}`;

  const staticRoutes = [
    '',
    '/start-here',
    '/blog',
    '/store',
    '/excel',
    '/tools',
    '/tools/excel-formula-generator',
    '/watch',
    '/resources',
    '/solutions',
    '/services',
    '/about',
    '/newsletter',
  ].map((route) => ({
    url: `${base}${route}/`,
    lastModified: new Date('2026-06-28'),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const postRoutes = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}/`,
    lastModified: new Date(post.date || '2026-06-28'),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const categoryRoutes = BLOG_CATEGORIES.filter(
    (c) => getPostsByCategory(c).length > 0
  ).map((c) => ({
    url: `${base}/blog/category/${categorySlug(c)}/`,
    lastModified: new Date('2026-06-28'),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const productRoutes = getAllProductIds().map((id) => ({
    url: `${base}/store/${id}/`,
    lastModified: new Date('2026-06-28'),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const solutionRoutes = SOLUTIONS.map((s) => ({
    url: `${base}/solutions/${s.slug}/`,
    lastModified: new Date('2026-06-28'),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...postRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...solutionRoutes,
  ];
}
