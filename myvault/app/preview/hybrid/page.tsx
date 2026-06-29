import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import StyleSwitcher from '@/components/StyleSwitcher';
import { IconArrowRight } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Style preview: Editorial + Data',
  robots: { index: false, follow: false },
};

/* Local palette: warm editorial paper, near-black ink, brand teal as the data
   accent. Kept inline so the preview reads the same in any global theme. */
const INK = '#16150f';
const ACCENT = '#0f8a72';

const TOPICS = ['Period close', 'OTBI', 'BI Publisher', 'Excel', 'Power Query', 'Enterprise structure', 'Financial modelling', 'ERP strategy'];

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
  { n: '01', title: 'Oracle Fusion reporting', body: 'OTBI and BI Publisher packs, validated SQL, and the structure behind reports that run on any instance.', metric: '40+', metricLabel: 'report packs', href: '/solutions/oracle-fusion-reporting' },
  { n: '02', title: 'Excel for finance', body: 'Models, dashboards and shortcuts that turn slow spreadsheets into something you trust at close.', metric: '25+', metricLabel: 'templates', href: '/excel' },
  { n: '03', title: 'Month-end close', body: 'Checklists and a repeatable process so the close runs the same way every period, with nothing missed.', metric: '3 days', metricLabel: 'typical close', href: '/solutions/month-end-close' },
];

const KPIS = [
  { l: 'REVENUE', v: '$4.82M', d: '+12.0%' },
  { l: 'MARGIN', v: '38.4%', d: '+2.1pt' },
  { l: 'CLOSE', v: '3.0d', d: '-5.0d' },
  { l: 'VARIANCE', v: '0.3%', d: 'in band' },
];

export default function HybridPreview() {
  const posts = getAllPosts().slice(0, 4);
  const bars = [38, 58, 44, 72, 52, 84, 66, 92];

  return (
    <div style={{ backgroundColor: '#f6f4ee', color: INK }} className="font-sans">
      <StyleSwitcher active="/preview/hybrid" />

      {/* Masthead */}
      <div className="container-page pt-6">
        <div
          className="flex items-center justify-between border-b pb-3 text-[11px] font-semibold uppercase tracking-[0.25em]"
          style={{ borderColor: `${INK}22` }}
        >
          <span>ERP Finance Pro</span>
          <span className="hidden sm:inline" style={{ color: `${INK}99` }}>The field manual for finance and ERP</span>
          <span className="inline-flex items-center gap-2" style={{ color: ACCENT }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: ACCENT }} />
            Live
          </span>
        </div>
      </div>

      {/* Hero: editorial headline + data panel */}
      <section className="container-page grid gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
            ERP · Finance · Oracle Fusion
          </p>
          <h1 className="mt-5 font-display text-[3.2rem] font-bold leading-[0.94] tracking-tight sm:text-[4.6rem] lg:text-[5.4rem]">
            Report cleaner.
            <br />
            <span className="italic" style={{ color: ACCENT }}>Close faster.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: `${INK}b3` }}>
            Templates, report packs and tools that help finance and ERP teams
            stop rebuilding the same work. Drawn from real Oracle Fusion delivery,
            not theory.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/store"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: INK }}
            >
              Browse the store <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/start-here" className="text-lg font-bold underline decoration-2 underline-offset-4">
              Start here
            </Link>
          </div>
        </div>

        {/* Light data panel */}
        <div className="rounded-2xl border bg-white shadow-xl" style={{ borderColor: `${INK}1a`, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.25)' }}>
          <div className="flex items-center justify-between border-b px-5 py-3 font-mono text-xs" style={{ borderColor: `${INK}14`, color: `${INK}80` }}>
            <span>CLOSE.MONITOR // FY26</span>
            <span style={{ color: ACCENT }}>● LIVE</span>
          </div>
          <div className="grid grid-cols-2">
            {KPIS.map((k, i) => (
              <div
                key={k.l}
                className="p-5"
                style={{
                  borderRight: i % 2 === 0 ? `1px solid ${INK}10` : undefined,
                  borderBottom: i < 2 ? `1px solid ${INK}10` : undefined,
                }}
              >
                <p className="font-mono text-[10px] tracking-wider" style={{ color: `${INK}80` }}>{k.l}</p>
                <p className="mt-1 font-display text-2xl font-bold">{k.v}</p>
                <p className="font-mono text-xs" style={{ color: ACCENT }}>▲ {k.d}</p>
              </div>
            ))}
          </div>
          <div className="border-t p-5" style={{ borderColor: `${INK}14` }}>
            <div className="mb-2 flex items-center justify-between font-mono text-[10px]" style={{ color: `${INK}80` }}>
              <span>CASH BY MONTH</span>
              <span>FY26</span>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, ${ACCENT}55, ${ACCENT})` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Topic marquee (the one you liked) */}
      <section className="overflow-hidden border-y py-4 text-[#f6f4ee]" style={{ backgroundColor: INK, borderColor: INK }}>
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8 text-lg font-bold uppercase tracking-wider">
            {[...TOPICS, ...TOPICS].map((t, i) => (
              <span key={i} className="flex items-center gap-8">
                {t} <span style={{ color: ACCENT }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Data ticker (monospace) */}
      <section className="overflow-hidden border-b bg-white py-2.5" style={{ borderColor: `${INK}14` }}>
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-6 pr-6 font-mono text-xs">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span style={{ color: `${INK}66` }}>{t[0]}</span>
                <span>{t[1]}</span>
                <span style={{ color: `${INK}1f` }}>|</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Numbered index with metrics */}
      <section className="container-page py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: `${INK}80` }}>The index</p>
        <div className="mt-6 border-y-2" style={{ borderColor: INK }}>
          {INDEX.map((item, idx) => (
            <Link
              key={item.n}
              href={item.href}
              className="group grid gap-4 py-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10"
              style={{ borderTop: idx > 0 ? `1px solid ${INK}1a` : undefined }}
            >
              <span className="font-display text-4xl font-bold sm:text-6xl" style={{ color: ACCENT }}>{item.n}</span>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">{item.title}</h2>
                <p className="mt-2 max-w-2xl text-base sm:text-lg" style={{ color: `${INK}b3` }}>{item.body}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold sm:text-3xl">{item.metric}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: `${INK}80` }}>{item.metricLabel}</p>
                </div>
                <IconArrowRight className="hidden h-7 w-7 transition-transform group-hover:translate-x-2 md:block" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Inverted quote block (you liked this) */}
      <section className="py-20 text-[#f6f4ee]" style={{ backgroundColor: INK }}>
        <div className="container-page">
          <p className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            &ldquo;Most reporting pain is not a tooling problem. It is a structure
            problem. Map it once and the reports take care of themselves.&rdquo;
          </p>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
            From the enterprise structure guide
          </p>
        </div>
      </section>

      {/* Latest dispatches as a data table */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between border-b-2 pb-4" style={{ borderColor: INK }}>
          <h2 className="font-display text-3xl font-bold tracking-tight">Latest dispatches</h2>
          <Link href="/blog" className="text-sm font-bold underline decoration-2 underline-offset-4">All articles</Link>
        </div>
        <div>
          {posts.map((p, i) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-8"
              style={{ borderTop: i > 0 ? `1px solid ${INK}1a` : undefined }}
            >
              <span className="font-mono text-sm" style={{ color: ACCENT }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">{p.title}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: `${INK}80` }}>{p.category} · {p.readTime}</p>
              </div>
              <IconArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="rounded-3xl border-2 px-8 py-14 text-center sm:px-12" style={{ borderColor: INK }}>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Get a quick win this week</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg" style={{ color: `${INK}b3` }}>
            The free starter kit: a month-end checklist, an OTBI cheat sheet, and
            a set of Excel finance shortcuts.
          </p>
          <Link
            href="/start-here"
            className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: ACCENT }}
          >
            Start here <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
