import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllResources } from '@/lib/resources';
import ResourceCard from '@/components/ResourceCard';

export const metadata: Metadata = {
  title: 'Free Resources',
  description:
    'Free, practical downloads for finance and ERP teams: Oracle Fusion OTBI cheat sheets, Excel shortcuts, close checklists, and ERP project templates.',
  openGraph: {
    title: 'Free Resources',
    description:
      'Free, practical downloads for finance and ERP teams: OTBI cheat sheets, Excel shortcuts, and ERP project templates.',
  },
};

export default function ResourcesPage() {
  const resources = getAllResources();

  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Free Resources
        </h1>
        <p className="mt-4 text-lg text-muted">
          Practical, no-cost downloads for finance and ERP teams. More are on the
          way, so check back or join the newsletter to hear when new ones land.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {/* Newsletter nudge */}
      <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-surface p-7 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Want these in your inbox?</h2>
          <p className="mt-1 text-sm text-muted">
            Join the newsletter and I will send new resources as they go live,
            along with practical Oracle Fusion and finance tips.
          </p>
        </div>
        <Link
          href="/newsletter"
          className="shrink-0 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Join the newsletter
        </Link>
      </div>
    </div>
  );
}
