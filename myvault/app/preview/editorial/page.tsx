import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import StyleSwitcher from '@/components/StyleSwitcher';
import { IconArrowRight } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Style preview: Bold editorial',
  robots: { index: false, follow: false },
};

const INDEX = [
  { n: '01', title: 'Oracle Fusion reporting', body: 'OTBI and BI Publisher packs, validated SQL, and the structure behind reports that work on every instance.', href: '/solutions/oracle-fusion-reporting' },
  { n: '02', title: 'Excel for finance', body: 'Models, dashboards and shortcuts that turn slow spreadsheets into something you trust at close.', href: '/excel' },
  { n: '03', title: 'Month-end close', body: 'Checklists and a repeatable process so the close runs the same way every period.', href: '/solutions/month-end-close' },
];

const TOPICS = ['Oracle Fusion', 'OTBI', 'BI Publisher', 'Excel', 'Power Query', 'Month-end close', 'Financial modelling', 'ERP strategy'];

export default function EditorialPreview() {
  const posts = getAllPosts().slice(0, 4);

  return (
    <div className="bg-[#faf9f6] text-[#111110]">
      <StyleSwitcher active="/preview/editorial" />

      {/* Masthead hero */}
      <section className="border-b-2 border-[#111110]">
        <div className="container-page py-6">
          <div className="flex items-center justify-between border-b border-[#111110]/20 pb-3 text-xs font-semibold uppercase tracking-[0.25em]">
            <span>ERP Finance Pro</span>
            <span className="hidden sm:inline">The field manual for finance and ERP</span>
            <span>Est. 2026</span>
          </div>
        </div>
        <div className="container-page pb-16 pt-8">
          <h1 className="font-display text-[3.4rem] font-bold leading-[0.95] tracking-tight sm:text-[5.5rem] lg:text-[7rem]">
            Report cleaner.
            <br />
            <span className="italic">Close faster.</span>
          </h1>
          <div className="mt-8 grid gap-8 border-t-2 border-[#111110] pt-8 md:grid-cols-[2fr_1fr]">
            <p className="max-w-2xl text-xl leading-relaxed sm:text-2xl">
              Templates, guides and tools that help finance and ERP teams stop
              rebuilding the same work. Drawn from real Oracle Fusion delivery
              across six countries, written for the people who do the work.
            </p>
            <div className="flex flex-col items-start justify-end gap-3">
              <Link href="/store" className="group inline-flex items-center gap-2 text-lg font-bold underline decoration-2 underline-offset-4">
                Browse the store <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/start-here" className="text-lg font-medium text-[#111110]/70 underline decoration-1 underline-offset-4 hover:text-[#111110]">
                Start here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee of topics */}
      <section className="overflow-hidden border-b-2 border-[#111110] bg-[#111110] py-4 text-[#faf9f6]">
        <div className="flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8 text-lg font-semibold uppercase tracking-wider">
            {[...TOPICS, ...TOPICS].map((t, i) => (
              <span key={i} className="flex items-center gap-8">
                {t} <span className="text-[#c8a24a]">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Index list */}
      <section className="container-page py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#111110]/50">The index</p>
        <div className="mt-6 divide-y-2 divide-[#111110]/10 border-y-2 border-[#111110]">
          {INDEX.map((item) => (
            <Link key={item.n} href={item.href} className="group grid gap-4 py-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
              <span className="font-display text-4xl font-bold text-[#c8a24a] sm:text-6xl">{item.n}</span>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight transition-colors group-hover:text-[#c8a24a] sm:text-4xl">{item.title}</h2>
                <p className="mt-2 max-w-2xl text-base text-[#111110]/70 sm:text-lg">{item.body}</p>
              </div>
              <IconArrowRight className="hidden h-8 w-8 transition-transform group-hover:translate-x-2 md:block" />
            </Link>
          ))}
        </div>
      </section>

      {/* Inverted statement block */}
      <section className="bg-[#111110] py-20 text-[#faf9f6]">
        <div className="container-page">
          <p className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            &ldquo;Most reporting pain is not a tooling problem. It is a structure
            problem. Map it once and the reports take care of themselves.&rdquo;
          </p>
          <p className="mt-8 text-sm uppercase tracking-[0.25em] text-[#c8a24a]">From the enterprise structure guide</p>
        </div>
      </section>

      {/* Editorial article list */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between border-b-2 border-[#111110] pb-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Latest dispatches</h2>
          <Link href="/blog" className="text-sm font-bold underline decoration-2 underline-offset-4">All articles</Link>
        </div>
        <div className="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {posts.map((p, i) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group border-t border-[#111110]/20 pt-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#111110]/50">
                <span className="text-[#c8a24a]">{String(i + 1).padStart(2, '0')}</span>
                <span>{p.category}</span>
                <span>·</span>
                <span>{p.readTime}</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight transition-colors group-hover:text-[#c8a24a] sm:text-3xl">{p.title}</h3>
              <p className="mt-2 text-[#111110]/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
