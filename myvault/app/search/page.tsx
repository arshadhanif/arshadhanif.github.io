import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import { getAllProducts } from '@/lib/products';
import { getAllResources } from '@/lib/resources';
import { SOLUTIONS } from '@/lib/solutions';
import PageHeader from '@/components/PageHeader';
import SearchClient, { type SearchItem } from '@/components/SearchClient';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search across articles, store products, free resources, solutions and tools.',
  robots: { index: false, follow: false },
};

const STATIC_PAGES: SearchItem[] = [
  { type: 'Page', title: 'Excel for finance', excerpt: 'Templates, courses and free tools for finance work.', href: '/excel' },
  { type: 'Page', title: 'Services', excerpt: 'Advisory calls, career coaching and Oracle Fusion consulting.', href: '/services' },
  { type: 'Page', title: 'About', excerpt: 'What ERP Finance Pro is and the founder behind it.', href: '/about' },
  { type: 'Tool', title: 'Excel Formula Generator', excerpt: 'Build the Excel formulas finance teams use most.', href: '/tools/excel-formula-generator', meta: 'Free tool' },
  { type: 'Tool', title: 'Depreciation Calculator', excerpt: 'Straight line and reducing balance with a full schedule.', href: '/tools/depreciation-calculator', meta: 'Free tool' },
  { type: 'Tool', title: 'Loan & Lease Amortization', excerpt: 'Payment, total interest and a payment schedule.', href: '/tools/lease-amortization-calculator', meta: 'Free tool' },
  { type: 'Tool', title: 'Financial Ratio Calculator', excerpt: 'Liquidity, leverage and profitability ratios.', href: '/tools/financial-ratio-calculator', meta: 'Free tool' },
  { type: 'Page', title: 'Glossary', excerpt: 'Oracle Fusion and finance terms, explained simply.', href: '/glossary' },
];

export default function SearchPage() {
  const index: SearchItem[] = [
    ...getAllPosts().map((p) => ({
      type: 'Article',
      title: p.title,
      excerpt: p.excerpt,
      href: `/blog/${p.slug}`,
      meta: p.category,
    })),
    ...getAllProducts().map((p) => ({
      type: 'Product',
      title: p.title,
      excerpt: p.description,
      href: `/store/${p.id}`,
      meta: p.category,
    })),
    ...getAllResources().map((r) => ({
      type: 'Resource',
      title: r.title,
      excerpt: r.description,
      href: '/resources',
      meta: r.format,
    })),
    ...SOLUTIONS.map((s) => ({
      type: 'Solution',
      title: s.title,
      excerpt: s.intro,
      href: `/solutions/${s.slug}`,
    })),
    ...STATIC_PAGES,
  ];

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeader
        eyebrow="Find anything"
        title="Search"
        intro="Look across every article, template, free resource, solution hub and tool on the site."
      />
      <SearchClient index={index} />
    </div>
  );
}
