import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllResources } from '@/lib/resources';
import LeadMagnet from '@/components/LeadMagnet';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Free Resources',
  description:
    'Free templates, checklists and cheat sheets for ERP and finance professionals. Download them and put them to work today.',
  openGraph: {
    title: 'Free Resources',
    description:
      'Free templates, checklists and cheat sheets for ERP and finance professionals.',
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
          Useful things you can grab for free: checklists, cheat sheets and
          templates built for real finance and ERP work. Drop your email and the
          download is yours.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {resources.map((resource) => (
          <LeadMagnet
            key={resource.id}
            title={resource.title}
            description={resource.description}
            fileUrl={resource.fileUrl}
            format={resource.format}
          />
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-surface p-7 text-center">
        <h2 className="text-xl font-semibold">Want the paid versions?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          The store has the full templates, report packs and courses these free
          resources are based on.
        </p>
        <Link
          href="/store"
          className="mt-5 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Visit the {SITE_NAME} store
        </Link>
      </div>
    </div>
  );
}
