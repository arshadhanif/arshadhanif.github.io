import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
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
    metric: '40+',
    metricLabel: 'report packs',
    href: '/solutions/oracle-fusion-reporting',
  },
  {
    n: '02',
    title: 'Excel for finance',
    body: 'Models, dashboards and shortcuts that turn slow spreadsheets into something you trust at close.',
    metric: '25+',
    metricLabel: 'templates',
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

const KPIS = [
  { l: 'REVENUE', v: '$4.82M', d: '+12.0%' },
  { l: 'MARGIN', v: '38.4%', d: '+2.1pt' },
  { l: 'CLOSE', v: '3.0d', d: '-5.0d' },
  { l: 'VARIANCE', v: '0.3%', d: 'in band' },
];

export default function HomePage() {
  const posts = getAllPosts().slice(0, 4);
  const products = getFeaturedProducts(3);
  const bars = [38, 58, 44, 72, 52, 84, 66, 92];

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

        {/* Data panel */}
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs text-muted">
            <span>CLOSE.MONITOR // FY26</span>
            <span className="text-accent">● LIVE</span>
          </div>
          <div className="grid grid-cols-2">
            {KPIS.map((k, i) => (
              <div
                key={k.l}
                className={`p-5 ${i % 2 === 0 ? 'border-r border-border' : ''} ${
                  i < 2 ? 'border-b border-border' : ''
                }`}
              >
                <p className="font-mono text-[10px] tracking-wider text-muted">
                  {k.l}
                </p>
                <p className="mt-1 font-display text-2xl font-bold">{k.v}</p>
                <p className="font-mono text-xs text-accent">▲ {k.d}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-5">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted">
              <span>CASH BY MONTH</span>
              <span>FY26</span>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
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
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
