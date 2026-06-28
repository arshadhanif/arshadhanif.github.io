import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}${basePath}/sitemap.xml`,
  };
}
