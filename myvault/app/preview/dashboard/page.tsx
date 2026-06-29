import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import StyleSwitcher from '@/components/StyleSwitcher';
import { IconArrowRight, IconChart, IconTemplate, IconCompass } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Style preview: Finance terminal',
  robots: { index: false, follow: false },
};

const TICKER = [
  ['GL', 'tied out', '+0.0%'],
  ['AP', 'posted', '+12'],
  ['AR', 'aged', '-3'],
  ['FA', 'depreciated', 'run'],
  ['CASH', '$4.82M', '+12%'],
  ['MARGIN', '38.4%', '+2.1pt'],
  ['CLOSE', '3 days', '-5'],
  ['VARIANCE', '0.3%', 'in band'],
];

const MODULES = [
  { icon: IconChart, code: 'RPT', title: 'Oracle Fusion reporting', body: 'OTBI + BI Publisher packs, validated SQL.', href: '/solutions/oracle-fusion-reporting' },
  { icon: IconTemplate, code: 'XLS', title: 'Excel for finance', body: 'Models, dashboards, shortcuts.', href: '/excel' },
  { icon: IconCompass, code: 'CLS', title: 'Month-end close', body: 'Checklists and a repeatable process.', href: '/solutions/month-end-close' },
];

const KPIS = [
  { l: 'REVENUE', v: '$4.82M', d: '+12.0%', up: true },
  { l: 'GROSS MARGIN', v: '38.4%', d: '+2.1pt', up: true },
  { l: 'CLOSE TIME', v: '3.0d', d: '-5.0d', up: true },
  { l: 'VARIANCE', v: '0.3%', d: 'IN BAND', up: true },
];

export default function DashboardPreview() {
  const posts = getAllPosts().slice(0, 4);
  const products = getFeaturedProducts(3);

  return (
    <div className="bg-[#0a0e17] font-mono text-[#cfe3d6]">
      <StyleSwitcher active="/preview/dashboard" />

      {/* Ticker */}
      <div className="overflow-hidden border-y border-[#1c2a24] bg-[#070b12] py-2">
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-6 pr-6 text-xs">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-[#5b7a68]">{t[0]}</span>
                <span className="text-[#cfe3d6]">{t[1]}</span>
                <span className="text-[#34d399]">{t[2]}</span>
                <span className="text-[#1c2a24]">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero + KPI panel */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded border border-[#1c2a24] bg-[#0d1420] px-3 py-1 text-xs text-[#34d399]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" /> SYSTEM ONLINE
            </span>
            <h1 className="mt-6 font-sans text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Run finance like a{' '}
              <span className="text-[#34d399]">trading desk</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#8aa597]">
              Templates, report packs and tools that turn Oracle Fusion and Excel
              into a fast, reliable reporting stack. Numbers you can trust, close
              you can predict.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/store" className="inline-flex items-center gap-2 rounded bg-[#34d399] px-6 py-3 text-sm font-bold text-[#06210f] transition-colors hover:bg-[#2bbd88]">
                OPEN STORE <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/start-here" className="inline-flex items-center gap-2 rounded border border-[#1c2a24] bg-[#0d1420] px-6 py-3 text-sm font-bold text-[#cfe3d6] transition-colors hover:border-[#34d399]">
                START HERE
              </Link>
            </div>
          </div>

          {/* KPI grid + chart panel */}
          <div className="rounded-lg border border-[#1c2a24] bg-[#0d1420]">
            <div className="flex items-center justify-between border-b border-[#1c2a24] px-4 py-2.5 text-xs text-[#5b7a68]">
              <span>CLOSE.MONITOR // FY26</span>
              <span className="text-[#34d399]">LIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#1c2a24]">
              {KPIS.map((k) => (
                <div key={k.l} className="bg-[#0d1420] p-4">
                  <p className="text-[10px] tracking-wider text-[#5b7a68]">{k.l}</p>
                  <p className="mt-1 font-sans text-2xl font-bold text-white">{k.v}</p>
                  <p className="text-xs text-[#34d399]">▲ {k.d}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1c2a24] p-4">
              <div className="flex h-24 items-end gap-1.5">
                {[34, 52, 41, 66, 48, 78, 60, 88, 72, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#34d399]/30 to-[#34d399]" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module grid */}
      <section className="container-page pb-16">
        <p className="text-xs tracking-[0.25em] text-[#5b7a68]">// MODULES</p>
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-[#1c2a24] bg-[#1c2a24] md:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.code} href={m.href} className="group bg-[#0d1420] p-6 transition-colors hover:bg-[#10192a]">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded border border-[#1c2a24] bg-[#070b12] text-[#34d399]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs text-[#5b7a68]">{m.code}</span>
                </div>
                <h3 className="mt-4 font-sans text-base font-bold text-white transition-colors group-hover:text-[#34d399]">{m.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#8aa597]">{m.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-[#34d399]">OPEN <IconArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Article data table */}
      <section className="container-page pb-24">
        <div className="flex items-center justify-between border-b border-[#1c2a24] pb-3">
          <p className="text-xs tracking-[0.25em] text-[#5b7a68]">// FEED</p>
          <Link href="/blog" className="text-xs text-[#34d399]">ALL →</Link>
        </div>
        <div className="divide-y divide-[#1c2a24]">
          {posts.map((p, i) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 transition-colors hover:bg-[#0d1420]">
              <span className="text-xs text-[#5b7a68]">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-sans text-sm font-bold text-white transition-colors group-hover:text-[#34d399]">{p.title}</h3>
                <p className="mt-0.5 text-xs text-[#8aa597]">{p.category} · {p.readTime}</p>
              </div>
              <IconArrowRight className="h-4 w-4 text-[#5b7a68] transition-transform group-hover:translate-x-1 group-hover:text-[#34d399]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
