import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import ArticleCard from '@/components/ArticleCard';
import ProductCard from '@/components/ProductCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_TAGLINE } from '@/lib/constants';

const VALUE_PROPS = [
  {
    title: 'Stop starting from scratch',
    body: 'Templates and report packs you can drop straight into real work, so you are not rebuilding the same spreadsheet every month.',
  },
  {
    title: 'Answers from the field',
    body: 'Plain-language guides on Oracle Fusion, Excel and ERP, written for the people who actually do the work.',
  },
  {
    title: 'Get sharper every week',
    body: 'Practical ideas on reporting, tools and finance careers. No fluff, no jargon.',
  },
];

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);
  const featuredProducts = getFeaturedProducts(3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,212,170,0.12),transparent)]" />
        <div className="container-page relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
              ERP · Finance · Oracle Fusion
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Templates, guides and tools that help finance and ERP teams work
              faster and report cleaner. Free resources, a no-noise newsletter,
              and a store full of things you can use today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/store"
                className="w-full rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim sm:w-auto"
              >
                Browse the store
              </Link>
              <Link
                href="/blog"
                className="w-full rounded-md border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
              >
                Read the articles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map((vp) => (
            <div
              key={vp.title}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h3 className="text-lg font-semibold text-accent">{vp.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{vp.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest articles */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Latest articles
            </h2>
            <p className="mt-2 text-muted">Practical reads for finance and ERP teams.</p>
          </div>
          <Link
            href="/blog"
            className="hidden text-sm font-medium text-accent hover:opacity-80 sm:block"
          >
            View all →
          </Link>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-muted">No articles published yet. Check back soon.</p>
        )}
      </section>

      {/* Featured products */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Featured products
            </h2>
            <p className="mt-2 text-muted">Tools that earn their keep.</p>
          </div>
          <Link
            href="/store"
            className="hidden text-sm font-medium text-accent hover:opacity-80 sm:block"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container-page py-12">
        <NewsletterSignup />
      </section>
    </>
  );
}
