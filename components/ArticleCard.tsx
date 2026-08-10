import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';
import CategoryBadge from './CategoryBadge';

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ArticleCard({ post }: { post: PostMeta }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CategoryBadge
          category={post.category}
          as="link"
          href={`/blog?category=${encodeURIComponent(post.category)}`}
        />
        <span className="text-xs text-muted">{post.readTime}</span>
      </div>

      <h3 className="text-lg font-semibold leading-snug">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors group-hover:text-accent"
        >
          {post.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {post.excerpt}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <time className="text-xs text-muted" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
