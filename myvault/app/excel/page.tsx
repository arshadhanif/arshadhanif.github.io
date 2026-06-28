import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductsByTag } from '@/lib/products';
import { getAllResources } from '@/lib/resources';
import { getPostsByCategory } from '@/lib/posts';
import ProductCard from '@/components/ProductCard';
import ResourceCard from '@/components/ResourceCard';
import ArticleCard from '@/components/ArticleCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import JsonLd from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Excel for Finance',
  description:
    'Excel templates, courses and free tools for finance professionals: dashboards, financial models, close trackers, formulas and more.',
  openGraph: {
    title: 'Excel for Finance',
    description:
      'Excel templates, courses and free tools for finance professionals.',
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

      {/* Hero */}
      <header className="mb-12 max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
          Templates · Courses · Free tools
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Excel for finance
        </h1>
        <p className="mt-4 text-lg text-muted">
          The Excel side of {SITE_NAME}: ready-to-use templates, practical
          courses, and free tools built for real finance work. Stop fighting
          spreadsheets and start from something that already works.
        </p>
      </header>

      {/* Free tool callout */}
      <Link
        href="/tools/excel-formula-generator"
        className="group mb-16 block rounded-2xl border border-accent/30 bg-accent/5 p-6 transition-colors hover:border-accent/60 sm:p-8"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Free tool
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Excel Formula Generator for Finance
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Pick a task, fill in your ranges, and copy a ready-made formula:
          XLOOKUP, SUMIFS, EOMONTH, IFERROR and more.
        </p>
        <span className="mt-4 inline-block text-sm font-semibold text-accent group-hover:opacity-80">
          Open the free tool →
        </span>
      </Link>

      {/* Templates */}
      {templates.length > 0 && (
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Excel templates</h2>
            <Link href="/store" className="text-sm font-medium text-accent hover:opacity-80">
              All products →
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
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Excel courses</h2>
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
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Free Excel resources</h2>
            <Link href="/resources" className="text-sm font-medium text-accent hover:opacity-80">
              All resources →
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
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Excel articles</h2>
            <Link
              href="/blog/category/excel"
              className="text-sm font-medium text-accent hover:opacity-80"
            >
              All Excel articles →
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
        heading="Get new Excel templates first"
        subheading="Subscribe for new Excel templates, courses and tips, plus the free starter kit."
      />
    </div>
  );
}
