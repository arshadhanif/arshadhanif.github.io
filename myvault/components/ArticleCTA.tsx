import Link from 'next/link';
import { IconArrowRight } from '@/components/Icons';
import type { BlogCategory } from '@/lib/constants';

interface Target {
  label: string;
  href: string;
  blurb: string;
}

// Send readers from an article to the most relevant next step on the site.
const BY_CATEGORY: Record<string, Target> = {
  'Oracle Fusion': {
    label: 'Explore the Oracle Fusion reporting hub',
    href: '/solutions/oracle-fusion-reporting',
    blurb: 'Report packs, validated SQL and the enterprise structure behind reports that run on any instance.',
  },
  Excel: {
    label: 'See Excel for finance',
    href: '/solutions/excel-for-finance',
    blurb: 'Templates, models and a free formula generator built for real finance work.',
  },
  'ERP Strategy': {
    label: 'See the month-end close hub',
    href: '/solutions/month-end-close',
    blurb: 'Checklists and a repeatable process so the close runs the same way every period.',
  },
  Career: {
    label: 'See career coaching',
    href: '/services',
    blurb: 'CV, LinkedIn and interview help from someone who has hired across ERP and finance.',
  },
  Tools: {
    label: 'Try the free finance tools',
    href: '/tools',
    blurb: 'Calculators and generators that do the heavy lifting for you, free.',
  },
};

const FALLBACK: Target = {
  label: 'Start here',
  href: '/start-here',
  blurb: 'The fastest way to get value from the site: the best reads, free resources and where to go next.',
};

export default function ArticleCTA({ category }: { category: BlogCategory }) {
  const target = BY_CATEGORY[category] ?? FALLBACK;

  return (
    <aside className="my-12 rounded-2xl bg-foreground p-7 text-background sm:p-9">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        Go deeper
      </p>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-background/85">
        {target.blurb}
      </p>
      <Link
        href={target.href}
        className="group mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5"
      >
        {target.label}{' '}
        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </aside>
  );
}
