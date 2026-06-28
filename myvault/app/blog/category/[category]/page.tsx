import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostsByCategory } from '@/lib/posts';
import { BLOG_CATEGORIES } from '@/lib/constants';
import { categorySlug, categoryFromSlug } from '@/lib/categories';
import ArticleCard from '@/components/ArticleCard';
import JsonLd from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_CATEGORIES.filter(
    (c) => getPostsByCategory(c).length > 0
  ).map((c) => ({ category: categorySlug(c) }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const category = categoryFromSlug(params.category);
  if (!category) return { title: 'Not found' };

  const title = `${category} articles`;
  const description = `Articles on ${category} for ERP and finance professionals.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = categoryFromSlug(params.category);
  if (!category) notFound();

  const posts = getPostsByCategory(category);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const siteBase = `${SITE_URL}${base}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${siteBase}/blog/` },
      {
        '@type': 'ListItem',
        position: 3,
        name: category,
        item: `${siteBase}/blog/category/${params.category}/`,
      },
    ],
  };

  return (
    <div className="container-page py-16">
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-sm text-muted">
        <Link href="/blog" className="hover:text-accent">
          Articles
        </Link>
        <span className="px-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground">{category}</span>
      </nav>

      <header className="mb-10 mt-4 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {category}
        </h1>
        <p className="mt-4 text-lg text-muted">
          Everything on {SITE_NAME} filed under {category}.
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No articles in this category yet.</p>
      )}
    </div>
  );
}
