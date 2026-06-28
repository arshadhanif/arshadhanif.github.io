import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import ArticleCard from '@/components/ArticleCard';
import ProductCard from '@/components/ProductCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import LeadMagnet from '@/components/LeadMagnet';
import Reveal from '@/components/Reveal';
import HeroVisual from '@/components/HeroVisual';
import {
  IconTemplate,
  IconBook,
  IconBolt,
  IconChart,
  IconTool,
  IconCompass,
  IconArrowRight,
  IconCheck,
} from '@/components/Icons';
import { LEAD_MAGNET } from '@/lib/constants';

const STATS = [
  { value: '7+', label: 'Years on real ERP projects' },
  { value: '6', label: 'Countries delivered in' },
  { value: '50+', label: 'Templates and report packs' },
  { value: '5-day', label: 'Free reporting course' },
];

const VALUE_PROPS = [
  {
    icon: IconTemplate,
    title: 'Stop starting from scratch',
    body: 'Templates and report packs you drop straight into real work, so you are not rebuilding the same spreadsheet every month.',
  },
  {
    icon: IconBook,
    title: 'Answers from the field',
    body: 'Plain-language guides on Oracle Fusion, Excel and ERP, written for the people who actually do the work.',
  },
  {
    icon: IconBolt,
    title: 'Get sharper every week',
    body: 'Practical ideas on reporting, tools and finance careers. No fluff, no jargon, no filler.',
  },
];

const PILLARS = [
  {
    icon: IconChart,
    title: 'Oracle Fusion reporting',
    body: 'OTBI and BI Publisher packs, validated SQL, and the structure behind reports that work on every instance.',
    href: '/solutions/oracle-fusion-reporting',
  },
  {
    icon: IconTool,
    title: 'Excel for finance',
    body: 'Models, dashboards and shortcuts that turn slow spreadsheets into something you trust at close.',
    href: '/excel',
  },
  {
    icon: IconCompass,
    title: 'Month-end close',
    body: 'Checklists and a repeatable process so the close runs the same way every period, with nothing missed.',
    href: '/solutions/month-end-close',
  },
];

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);
  const featuredProducts = getFeaturedProducts(3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-glow animate-glow-pulse pointer-events-none absolute inset-0" />
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28 3xl:py-36">
          <div className="animate-fade-up">
            <span className="pill text-accent">
              <IconBolt className="h-3.5 w-3.5" />
              ERP · Finance · Oracle Fusion
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl 3xl:text-7xl">
              Report cleaner.{' '}
              <span className="text-gradient">Close faster.</span>{' '}
              Stop rebuilding the same work.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted 3xl:text-xl">
              Templates, guides and tools that help finance and ERP teams move
              quicker and report with confidence. Free resources, a no-noise
              newsletter, and a store full of things you can use today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
              >
                Browse the store <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/excel"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
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

          <div className="animate-scale-in lg:pl-6">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-b border-border bg-surface">
        <div className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="text-3xl font-extrabold text-accent 3xl:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value proposition */}
      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map((vp, i) => {
            const Icon = vp.icon;
            return (
              <Reveal
                key={vp.title}
                delay={i * 100}
                className="card-hover rounded-2xl border border-border bg-surface p-6"
              >
                <span className="icon-chip">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{vp.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {vp.body}
                </p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Content pillars */}
      <section className="container-page py-4 pb-16">
        <Reveal>
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pick what you are working on
            </h2>
            <p className="mt-2 text-muted">
              Each hub pulls together the articles, tools and templates for that
              job in one place.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 100}>
                <Link
                  href={p.href}
                  className="group card-hover flex h-full flex-col rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-alt p-6"
                >
                  <span className="icon-chip">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {p.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    Explore <IconArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Free starter kit (lead magnet) */}
      <section className="container-page py-4 pb-16">
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
      <section className="container-page py-4 pb-16">
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
              className="hidden items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 sm:inline-flex"
            >
              View all <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {latestPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-muted">
              No articles published yet. Check back soon.
            </p>
          )}
        </Reveal>
      </section>

      {/* Featured products */}
      <section className="container-page py-4 pb-16">
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
              className="hidden items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 sm:inline-flex"
            >
              View all <IconArrowRight className="h-4 w-4" />
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
      <section className="container-page py-4 pb-20">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
}
