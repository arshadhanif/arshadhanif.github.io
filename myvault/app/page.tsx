import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import ArticleCard from '@/components/ArticleCard';
import ProductCard from '@/components/ProductCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import LeadMagnet from '@/components/LeadMagnet';
import Reveal from '@/components/Reveal';
import HeroVisual from '@/components/HeroVisual';
import { ReportArt, ExcelArt, CloseArt } from '@/components/SpotArt';
import {
  IconTemplate,
  IconBook,
  IconBolt,
  IconArrowRight,
  IconCheck,
  IconSparkles,
} from '@/components/Icons';
import { LEAD_MAGNET } from '@/lib/constants';

const STATS = [
  { value: '7+', label: 'Years on real ERP projects' },
  { value: '6', label: 'Countries delivered in' },
  { value: '50+', label: 'Templates and report packs' },
  { value: 'ACCA', label: 'Member, Oracle certified' },
];

const TRUST = [
  'Oracle Fusion Cloud',
  'OTBI',
  'BI Publisher',
  'Excel',
  'Power Query',
  'Financial modelling',
];

const PILLARS = [
  {
    art: ReportArt,
    title: 'Oracle Fusion reporting',
    body: 'OTBI and BI Publisher packs, validated SQL, and the structure behind reports that work on every instance.',
    href: '/solutions/oracle-fusion-reporting',
  },
  {
    art: ExcelArt,
    title: 'Excel for finance',
    body: 'Models, dashboards and shortcuts that turn slow spreadsheets into something you trust at close.',
    href: '/excel',
  },
  {
    art: CloseArt,
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
        <div className="noise pointer-events-none absolute inset-0" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28 3xl:py-36">
          <div className="animate-fade-up">
            <span className="pill text-accent">
              <IconSparkles className="h-3.5 w-3.5" />
              ERP · Finance · Oracle Fusion
            </span>
            <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl 3xl:text-7xl">
              Report cleaner.{' '}
              <span className="text-gradient">Close faster.</span>
              <br className="hidden sm:block" /> Stop rebuilding the same work.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted 3xl:text-xl">
              Templates, guides and tools that help finance and ERP teams move
              quicker and report with confidence. Built from real Oracle Fusion
              delivery, not theory.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/store" className="btn-primary">
                Browse the store <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/excel" className="btn-ghost">
                Explore Excel
              </Link>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted">
              <IconCheck className="h-4 w-4 text-accent" />
              Free starter kit and a no-noise newsletter.{' '}
              <Link href="/start-here" className="text-accent hover:opacity-80">
                Start here
              </Link>
            </p>
          </div>

          <div className="animate-scale-in lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-surface/50">
        <div className="container-page py-7">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted">
            Built around the tools finance teams actually run
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
            {TRUST.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-b border-border">
        <div className="container-page grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center sm:text-left">
              <p className="font-display text-3xl font-bold text-accent 3xl:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Value proposition bento */}
      <section className="container-page py-16 sm:py-20">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <span className="pill text-accent">Why it works</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Less rebuilding. More reporting.
            </h2>
            <p className="mt-3 text-lg text-muted">
              Everything here is something you can put to work the same week, not
              another theory deck to file away.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Flagship card */}
          <Reveal className="lg:col-span-2">
            <div className="card-premium flex h-full flex-col overflow-hidden p-7">
              <span className="icon-chip">
                <IconTemplate className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">
                Stop starting from scratch
              </h3>
              <p className="mt-2 max-w-md text-muted">
                Templates and report packs you drop straight into real work, so
                you are not rebuilding the same spreadsheet every month.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                <ExcelArt className="block" />
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={80}>
              <div className="card-premium h-full p-7">
                <span className="icon-chip">
                  <IconBook className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  Answers from the field
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Plain-language guides on Oracle Fusion, Excel and ERP, written
                  for the people who do the work.
                </p>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="card-premium h-full p-7">
                <span className="icon-chip">
                  <IconBolt className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  Get sharper every week
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Practical ideas on reporting, tools and finance careers. No
                  fluff, no jargon, no filler.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Content pillars */}
      <section className="container-page pb-16 sm:pb-20">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <span className="pill text-accent">Where to start</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Pick what you are working on
            </h2>
            <p className="mt-3 text-lg text-muted">
              Each hub pulls together the articles, tools and templates for that
              job in one place.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => {
            const Art = p.art;
            return (
              <Reveal key={p.title} delay={i * 100}>
                <Link
                  href={p.href}
                  className="card-premium group flex h-full flex-col overflow-hidden"
                >
                  <div className="border-b border-border">
                    <Art className="block" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold transition-colors group-hover:text-accent">
                      {p.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {p.body}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                      Explore{' '}
                      <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Free starter kit (lead magnet) */}
      <section className="container-page pb-16 sm:pb-20">
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
      <section className="container-page pb-16 sm:pb-20">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
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
      <section className="container-page pb-16 sm:pb-20">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
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
      <section className="container-page pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-12">
            <div className="hero-glow pointer-events-none absolute inset-0" />
            <div className="bg-dots pointer-events-none absolute inset-0" />
            <div className="relative">
              <NewsletterSignup />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
