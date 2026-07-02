import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts, isLive } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import CloseTrackerPanel from '@/components/CloseTrackerPanel';
import NewsletterSignup from '@/components/NewsletterSignup';
import Testimonials from '@/components/Testimonials';
import Reveal from '@/components/Reveal';
import { IconArrowRight } from '@/components/Icons';

const TOPICS = [
  'Period close',
  'OTBI',
  'BI Publisher',
  'Excel',
  'Power Query',
  'Enterprise structure',
  'Financial modelling',
  'ERP strategy',
];

const TICKER = [
  ['GL', 'tied out'],
  ['AP', 'posted'],
  ['AR', 'aged'],
  ['FA', 'depreciated'],
  ['CASH', '$4.82M'],
  ['MARGIN', '38.4%'],
  ['CLOSE', '3 days'],
  ['VARIANCE', '0.3%'],
];

const INDEX = [
  {
    n: '01',
    title: 'Oracle Fusion reporting',
    body: 'OTBI and BI Publisher packs, validated SQL, and the structure behind reports that run on any instance.',
    metric: '100+',
    metricLabel: 'reports mapped',
    href: '/solutions/oracle-fusion-reporting',
  },
  {
    n: '02',
    title: 'Excel for finance',
    body: 'Free calculators, a formula generator and hands-on guides that make finance Excel faster and safer.',
    metric: '5',
    metricLabel: 'free tools',
    href: '/excel',
  },
  {
    n: '03',
    title: 'Month-end close',
    body: 'Checklists and a repeatable process so the close runs the same way every period, with nothing missed.',
    metric: '3 days',
    metricLabel: 'typical close',
    href: '/solutions/month-end-close',
  },
];

const FLAGSHIP_STATS = [
  { n: '100+', l: 'Tasks' },
  { n: '12', l: 'Modules' },
  { n: '100+', l: 'Reports' },
];

export default function HomePage() {
  const posts = getAllPosts().slice(0, 4);
  const featured = getFeaturedProducts(3);
  const flagship = featured.find(isLive);
  const others = featured.filter((p) => p.id !== flagship?.id);

  return (
    <>
      {/* Masthead */}
      <div className="container-page pt-6">
        <div className="flex items-center justify-between border-b border-border pb-3 text-[11px] font-semibold uppercase tracking-[0.25em]">
          <span>ERP Finance Pro</span>
          <span className="hidden text-muted sm:inline">
            The field manual for finance and ERP
          </span>
          <span className="inline-flex items-center gap-2 text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Live
          </span>
        </div>
      </div>

      {/* Hero: editorial headline + data panel */}
      <section className="container-page grid gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
        <div className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            ERP · Finance · Oracle Fusion
          </p>
          <h1 className="mt-5 font-display text-[3.2rem] font-bold leading-[0.94] tracking-tight sm:text-[4.6rem] lg:text-[5.4rem]">
            Report cleaner.
            <br />
            <span className="italic text-accent">Close faster.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Templates, report packs and tools that help finance and ERP teams
            stop rebuilding the same work. Drawn from real Oracle Fusion
            delivery, not theory.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/store"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Browse the store{' '}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/start-here"
              className="text-lg font-bold underline decoration-2 underline-offset-4 hover:text-accent"
            >
              Start here
            </Link>
          </div>
        </div>

        {/* Data panel: the flagship's Master Close Tracker, print-shadowed */}
        <div className="animate-scale-in lg:pr-3">
          <CloseTrackerPanel className="print-shadow" />
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            From the{' '}
            <Link
              href="/store/oracle-fusion-period-close-accelerator"
              className="font-bold text-accent hover:opacity-80"
            >
              Period Close Accelerator
            </Link>
            , live now
          </p>
        </div>
      </section>

      {/* Topic marquee */}
      <section className="overflow-hidden border-y border-foreground bg-foreground py-4 text-background">
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8 text-lg font-bold uppercase tracking-wider">
            {[...TOPICS, ...TOPICS].map((t, i) => (
              <span key={i} className="flex items-center gap-8">
                {t} <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Data ticker */}
      <section className="overflow-hidden border-b border-border bg-surface py-2.5">
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-6 pr-6 font-mono text-xs">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-muted">{t[0]}</span>
                <span>{t[1]}</span>
                <span className="text-border">|</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Numbered index */}
      <section className="container-page py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          The index
        </p>
        <div className="mt-6 border-y-2 border-foreground">
          {INDEX.map((item, idx) => (
            <Link
              key={item.n}
              href={item.href}
              className={`group grid gap-4 py-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 ${
                idx > 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className="font-display text-4xl font-bold text-accent sm:text-6xl">
                {item.n}
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight transition-colors group-hover:text-accent sm:text-4xl">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-2xl text-base text-muted sm:text-lg">
                  {item.body}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold sm:text-3xl">
                    {item.metric}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {item.metricLabel}
                  </p>
                </div>
                <IconArrowRight className="hidden h-7 w-7 transition-transform group-hover:translate-x-2 md:block" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Inverted quote block */}
      <section className="bg-foreground py-20 text-background">
        <div className="container-page">
          <p className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            &ldquo;Most reporting pain is not a tooling problem. It is a
            structure problem. Map it once and the reports take care of
            themselves.&rdquo;
          </p>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            From the enterprise structure guide
          </p>
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between border-b-2 border-foreground pb-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Featured products
          </h2>
          <Link
            href="/store"
            className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
          >
            All products
          </Link>
        </div>

        {/* Flagship: the one you can buy today */}
        {flagship && (
          <div className="mt-8 grid gap-8 rounded-3xl border-2 border-foreground p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                Available now
              </p>
              <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                {flagship.title}
              </h3>
              <p className="mt-3 max-w-xl leading-relaxed text-muted">
                {flagship.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href={flagship.gumroadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Get it for {flagship.price}
                </a>
                <Link
                  href={`/store/${flagship.id}`}
                  className="font-bold underline decoration-2 underline-offset-4 hover:text-accent"
                >
                  See what&apos;s inside
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FLAGSHIP_STATS.map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border border-border bg-surface px-4 py-5 text-center"
                >
                  <p className="font-display text-2xl font-bold text-accent sm:text-3xl">
                    {s.n}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next up */}
        {others.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {others.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Latest dispatches */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between border-b-2 border-foreground pb-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Latest dispatches
          </h2>
          <Link
            href="/blog"
            className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
          >
            All articles
          </Link>
        </div>
        <div>
          {posts.map((p, i) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className={`group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-8 ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className="font-mono text-sm text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                  {p.category} · {p.readTime}
                </p>
              </div>
              <IconArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="container-page pb-4">
        <Reveal>
          <Testimonials eyebrow="Trusted by clients" heading="Proven on real work" />
        </Reveal>
      </section>

      {/* Newsletter band */}
      <section className="container-page py-16 pb-24">
        <Reveal>
          <div className="rounded-3xl border-2 border-foreground p-8 sm:p-12">
            <NewsletterSignup />
          </div>
        </Reveal>
      </section>
    </>
  );
}
