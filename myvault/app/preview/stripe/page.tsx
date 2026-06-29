import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProducts } from '@/lib/products';
import StyleSwitcher from '@/components/StyleSwitcher';
import { IconArrowRight, IconTemplate, IconChart, IconCompass, IconCheck } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Style preview: Vivid SaaS',
  robots: { index: false, follow: false },
};

const FEATURES = [
  { icon: IconTemplate, title: 'Templates that ship', body: 'Drop-in report packs and models you can use the same week.', from: '#6366f1', to: '#8b5cf6' },
  { icon: IconChart, title: 'Reports that travel', body: 'Built on the enterprise structure, so they run on any instance.', from: '#06b6d4', to: '#3b82f6' },
  { icon: IconCompass, title: 'A repeatable close', body: 'Checklists and process so month-end runs the same every period.', from: '#14b8a6', to: '#22c55e' },
];

export default function StripePreview() {
  const posts = getAllPosts().slice(0, 3);
  const products = getFeaturedProducts(3);

  return (
    <div className="bg-white text-slate-900">
      <StyleSwitcher active="/preview/stripe" />

      {/* Hero with gradient mesh */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 60% at 15% 0%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(50% 50% at 85% 10%, rgba(236,72,153,0.20), transparent 60%), radial-gradient(60% 60% at 60% 90%, rgba(6,182,212,0.20), transparent 60%)',
          }}
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-indigo-600 shadow-sm backdrop-blur">
              ERP · Finance · Oracle Fusion
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              The finance toolkit that{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(100deg,#6366f1,#8b5cf6,#06b6d4)' }}
              >
                pays for itself
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Templates, guides and tools that help finance and ERP teams move
              faster and report cleaner. Built from real Oracle Fusion delivery.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-0.5"
                style={{ backgroundImage: 'linear-gradient(100deg,#6366f1,#8b5cf6)' }}
              >
                Browse the store <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/excel"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300"
              >
                Explore Excel
              </Link>
            </div>
          </div>

          {/* Floating product window */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur">
              <div className="rounded-xl border border-slate-100 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-slate-400">monthly-close.xlsx</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-3">
                  {[
                    { l: 'Revenue', v: '$4.82M', d: '+12%', c: '#6366f1' },
                    { l: 'Margin', v: '38.4%', d: '+2.1pt', c: '#06b6d4' },
                    { l: 'Variance', v: '0.3%', d: 'in band', c: '#14b8a6' },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{k.l}</p>
                      <p className="mt-1 text-2xl font-bold">{k.v}</p>
                      <p className="text-xs font-semibold" style={{ color: k.c }}>{k.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient feature cards */}
      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl">
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-lg"
                  style={{ backgroundImage: `linear-gradient(135deg,${f.from},${f.to})` }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA gradient band */}
      <section className="container-page pb-20">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white sm:px-12"
          style={{ backgroundImage: 'linear-gradient(120deg,#4f46e5,#7c3aed,#0891b2)' }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get a quick win this week
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Grab the free starter kit: a month-end checklist, an OTBI cheat
            sheet, and a set of Excel finance shortcuts.
          </p>
          <Link
            href="/start-here"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-indigo-600 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <IconCheck className="h-4 w-4" /> Start here
          </Link>
        </div>
      </section>

      {/* Articles + products preview row */}
      <section className="container-page pb-24">
        <h2 className="text-2xl font-bold tracking-tight">Fresh from the blog</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{p.category}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
