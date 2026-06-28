import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from '@/lib/posts';
import CategoryBadge from '@/components/CategoryBadge';
import AuthorBio from '@/components/AuthorBio';
import ShareButtons from '@/components/ShareButtons';
import ArticleCard from '@/components/ArticleCard';
import LeadMagnet from '@/components/LeadMagnet';
import { SITE_NAME, FOUNDER, LEAD_MAGNET } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Not found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [FOUNDER.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, 2);

  return (
    <article className="container-page max-w-3xl py-16">
      <Link
        href="/blog"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Back to blog
      </Link>

      <header className="mt-6">
        <div className="flex items-center gap-3">
          <CategoryBadge category={post.category} />
          <span className="text-sm text-muted">{post.readTime}</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>By {FOUNDER.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </header>

      <div className="prose-article mt-10">
        <MDXRemote source={post.content} />
      </div>

      {/* Content upgrade: turn a reader into a subscriber */}
      <div className="mt-12">
        <LeadMagnet
          variant="banner"
          title={LEAD_MAGNET.title}
          description={LEAD_MAGNET.description}
          fileUrl={LEAD_MAGNET.fileUrl}
          format={LEAD_MAGNET.format}
        />
      </div>

      <hr className="my-10 border-border" />

      <div className="flex flex-col gap-8">
        <ShareButtons title={post.title} slug={post.slug} />
        <AuthorBio />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <ArticleCard key={r.slug} post={r} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-sm text-muted">
        Find more templates and guides across {SITE_NAME}.
      </p>
    </article>
  );
}
