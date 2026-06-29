import type { Metadata } from 'next';
import Link from 'next/link';
import { IconArrowRight } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Style previews',
  robots: { index: false, follow: false },
};

const OPTIONS = [
  {
    href: '/',
    label: 'Clean premium',
    note: 'Notion / Vercel · currently live',
    desc: 'Calm, polished, generous whitespace, tasteful color and a distinctive display typeface. The current homepage.',
  },
  {
    href: '/preview/stripe',
    label: 'Vivid SaaS',
    note: 'Stripe / Linear',
    desc: 'Bright multi-colour gradients, glassy product window, gradient buttons and a colourful CTA band. Modern tech-product energy.',
  },
  {
    href: '/preview/editorial',
    label: 'Bold editorial',
    note: 'Magazine',
    desc: 'Type as the hero: oversized headlines, a masthead, a numbered index, a moving topic strip and an inverted quote block.',
  },
  {
    href: '/preview/dashboard',
    label: 'Finance terminal',
    note: 'Fintech',
    desc: 'Dark, data-dense and monospace. A live ticker, KPI panels, module grid and a feed table. Reads like a trading desk.',
  },
];

export default function PreviewIndex() {
  return (
    <div className="container-page py-16 sm:py-20">
      <header className="max-w-2xl">
        <span className="pill text-accent">Pick a direction</span>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Four looks, same content
        </h1>
        <p className="mt-4 text-lg text-muted">
          Open each one, compare, and tell me which to run with. Once you choose,
          I will apply that style across the whole site. Use the bar at the top of
          each preview to jump between them.
        </p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {OPTIONS.map((o) => (
          <Link key={o.href} href={o.href} className="card-premium group flex flex-col p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold transition-colors group-hover:text-accent">
                {o.label}
              </h2>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {o.note}
              </span>
            </div>
            <p className="mt-3 flex-1 text-muted">{o.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              View this style{' '}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
