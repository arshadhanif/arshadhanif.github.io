import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import ArticleCard from '@/components/ArticleCard';
import ProductCard from '@/components/ProductCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import LeadMagnet from '@/components/LeadMagnet';
import Reveal from '@/components/Reveal';
import { SITE_TAGLINE, LEAD_MAGNET } from '@/lib/constants';

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
        <div className="hero-glow animate-glow-pulse pointer-events-none absolute inset-0" />
        <div className="container-page relative py-20 sm:py-28 lg:py-32 3xl:py-44">
          <div className="mx-auto max-w-3xl text-center animate-fade-up 3xl:max-w-5xl">
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
              ERP · Finance · Oracle Fusion
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl 3xl:text-7xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted 3xl:text-xl">
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
                href="/excel"
                className="w-full rounded-md border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
              >
                Explore Excel
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              New here?{' '}
              <Link href="/start-here" className="text-accent hover:opacity-80">
                Start here
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map((vp, i) => (
            <Reveal
              key={vp.title}
              delay={i * 100}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h3 className="text-lg font-semibold text-accent">{vp.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{vp.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Free starter kit (lead magnet) */}
      <section className="container-page py-12">
        <Reveal>
          <LeadMagnet
            variant="banner"
            title={LEAD_MAGNET.title}
            description={LEAD_MAGNET.description}
            fileUrl={LEAD_MAGNET.fileUrl}
            format={LEAD_MAGNET.format}
          />
        </Reveal>
      </section>

      {/* Latest articles */}
      <section className="container-page py-12">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Latest articles
              </h2>
              <p className="mt-2 text-muted">
                Practical reads for finance and ERP teams.
              </p>
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
        </Reveal>
      </section>

      {/* Featured products */}
      <section className="container-page py-12">
        <Reveal>
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
        </Reveal>
      </section>

      {/* Newsletter CTA */}
      <section className="container-page py-12 pb-20">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
}
