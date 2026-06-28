import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SOLUTIONS, getSolution } from '@/lib/solutions';
import { getPostBySlug } from '@/lib/posts';
import { getProductsByTag } from '@/lib/products';
import { getAllResources } from '@/lib/resources';
import ArticleCard from '@/components/ArticleCard';
import ProductCard from '@/components/ProductCard';
import ResourceCard from '@/components/ResourceCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import JsonLd from '@/components/JsonLd';
import { SITE_URL } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const solution = getSolution(params.slug);
  if (!solution) return { title: 'Not found' };
  return {
    title: solution.title,
    description: solution.intro,
    openGraph: { title: solution.metaTitle, description: solution.intro },
  };
}

export default function SolutionPage({
  params,
}: {
  params: { slug: string };
}) {
  const solution = getSolution(params.slug);
  if (!solution) notFound();

  const articles = solution.articleSlugs
    .map((s) => getPostBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const products = getProductsByTag(solution.productTag).slice(0, 3);
  const allResources = getAllResources();
  const resources = solution.resourceIds
    .map((id) => allResources.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Solutions', item: `${SITE_URL}${base}/solutions/` },
      { '@type': 'ListItem', position: 3, name: solution.title, item: `${SITE_URL}${base}/solutions/${solution.slug}/` },
    ],
  };

  return (
    <div className="container-page py-16">
      <JsonLd data={breadcrumbSchema} />

      <header className="mb-12 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {solution.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{solution.intro}</p>
      </header>

      <div className="prose-article mb-14 max-w-2xl">
        {solution.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {solution.toolHref && (
          <p>
            <Link href={solution.toolHref}>Open the free tool</Link> to try it now.
          </p>
        )}
      </div>

      {articles.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Read up</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Get the tools</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {resources.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Free resources</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      <NewsletterSignup
        heading="Get more like this"
        subheading="Practical guides, templates and tools for finance and ERP, plus the free starter kit."
      />
    </div>
  );
}
