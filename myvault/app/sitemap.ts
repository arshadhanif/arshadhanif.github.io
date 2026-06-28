import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { SITE_URL } from '@/lib/constants';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${basePath}`;

  const staticRoutes = [
    '',
    '/blog',
    '/store',
    '/resources',
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

  return [...staticRoutes, ...postRoutes];
}
