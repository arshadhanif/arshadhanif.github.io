import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductsByTag } from '@/lib/products';
import { getAllResources } from '@/lib/resources';
import { getPostsByCategory } from '@/lib/posts';
import ProductCard from '@/components/ProductCard';
import ResourceCard from '@/components/ResourceCard';
import ArticleCard from '@/components/ArticleCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import PageHeader from '@/components/PageHeader';
import { IconArrowRight } from '@/components/Icons';
import JsonLd from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Excel for Finance',
  description:
    'Free Excel tools and practical guides for finance professionals: a formula generator, finance calculators, and hands-on articles.',
  openGraph: {
    title: 'Excel for Finance',
    description:
      'Free Excel tools and practical guides for finance professionals.',
  },
};

export default function ExcelPage() {
  const excelProducts = getProductsByTag('Excel');
  const templates = excelProducts.filter((p) => p.category === 'Templates');
  const courses = excelProducts.filter((p) => p.category === 'Courses');

  const excelResources = getAllResources().filter(
    (r) =>
      r.format.toLowerCase() === 'excel' ||
      r.title.toLowerCase().includes('excel')
  );
  const excelArticles = getPostsByCategory('Excel');

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Excel', item: `${SITE_URL}${base}/excel/` },
    ],
  };

  return (
    <div className="container-page py-16">
      <JsonLd data={breadcrumbSchema} />

      <PageHeader
        eyebrow="Free tools · Guides"
        title="Excel for finance"
        intro={`The Excel side of ${SITE_NAME}: free tools and practical guides built for real finance work, starting with a formula generator that writes the formula for you.`}
      />

      {/* Free tool callout (inverted accent block) */}
      <Link
        href="/tools/excel-formula-generator"
        className="group mb-16 block rounded-2xl bg-foreground p-7 text-background transition-transform hover:-translate-y-0.5 sm:p-9"
      >
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Free tool
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Excel Formula Generator for Finance
        </h2>
        <p className="mt-2 max-w-2xl text-background/70">
          Pick a task, fill in your ranges, and copy a ready-made formula:
          XLOOKUP, SUMIFS, EOMONTH, IFERROR and more.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          Open the free tool{' '}
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>

      {/* Templates */}
      {templates.length > 0 && (
        <section className="mb-16">
          <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-4">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Excel templates</h2>
            <Link href="/store" className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent">
              All products
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Courses */}
      {courses.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-8 border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">Excel courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Free resources */}
      {excelResources.length > 0 && (
        <section className="mb-16">
          <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-4">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Free Excel resources</h2>
            <Link href="/resources" className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent">
              All resources
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {excelResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* Articles */}
      {excelArticles.length > 0 && (
        <section className="mb-16">
          <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-4">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Excel articles</h2>
            <Link
              href="/blog/category/excel"
              className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
            >
              All Excel articles
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {excelArticles.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      <NewsletterSignup
        heading="Get new Excel tools and guides first"
        subheading="Subscribe for new Excel tools, guides and tips, plus the free starter kit."
      />
    </div>
  );
}
