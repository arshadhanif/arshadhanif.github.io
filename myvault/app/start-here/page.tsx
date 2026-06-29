import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedResources } from '@/lib/resources';
import ArticleCard from '@/components/ArticleCard';
import ResourceCard from '@/components/ResourceCard';
import PageHeader from '@/components/PageHeader';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Start Here',
  description:
    'New to ERP Finance Pro? Here is the quickest way to get value: the best articles to read first, the free resources to grab, and where to go next.',
  openGraph: {
    title: 'Start Here',
    description: 'New to ERP Finance Pro? Here is the quickest way to get value.',
  },
};

const STEPS = [
  {
    n: '1',
    title: 'Read a few articles',
    body: 'Start with the pieces below. They cover the things finance and ERP people ask about most.',
  },
  {
    n: '2',
    title: 'Grab the free resources',
    body: 'Download a checklist or cheat sheet and put it to work on your next task.',
  },
  {
    n: '3',
    title: 'Get the templates',
    body: 'When you are ready to save real time, the store has the full templates and packs.',
  },
];

export default function StartHerePage() {
  const topPosts = getAllPosts().slice(0, 3);
  const resources = getFeaturedResources(2);

  return (
    <div className="container-page py-16">
      <PageHeader
        eyebrow="New here?"
        title="Start here"
        intro={`This is the short version. ${SITE_NAME} is a resource hub for ERP and finance professionals: templates, guides and tools that help you work faster and report cleaner. Here is how to get value from it today.`}
      />

      {/* Steps */}
      <div className="mb-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <div className="font-display text-4xl font-bold text-accent">
              {String(step.n).padStart(2, '0')}
            </div>
            <h2 className="mt-3 font-display text-lg font-bold tracking-tight">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>

      {/* Read first */}
      <section className="mb-16">
        <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-4">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Read these first</h2>
          <Link
            href="/blog"
            className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
          >
            All articles
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {topPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Free resources */}
      <section className="mb-16">
        <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-4">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Grab a free resource</h2>
          <Link
            href="/resources"
            className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
          >
            All resources
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      {/* Next steps */}
      <section className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/store"
          className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/50"
        >
          <h3 className="text-lg font-semibold text-accent">Visit the store</h3>
          <p className="mt-2 text-sm text-muted">
            Templates, report packs and courses that save you weeks of work.
          </p>
        </Link>
        <Link
          href="/newsletter"
          className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/50"
        >
          <h3 className="text-lg font-semibold text-accent">Join the newsletter</h3>
          <p className="mt-2 text-sm text-muted">
            Practical insights and the free starter kit, straight to your inbox.
          </p>
        </Link>
      </section>
    </div>
  );
}
