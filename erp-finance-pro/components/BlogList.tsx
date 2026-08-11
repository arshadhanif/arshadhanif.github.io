'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PostMeta } from '@/lib/posts';
import ArticleCard from './ArticleCard';
import CategoryBadge from './CategoryBadge';

const ALL = 'All';

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [active, setActive] = useState<string>(ALL);

  // Build the tag list from categories actually present in the posts.
  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return [ALL, ...Array.from(set)];
  }, [posts]);

  // On load, honour a ?category=… in the URL so filtered views are shareable
  // (e.g. a category badge on an article card links straight here).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('category');
    if (param && categories.includes(param)) {
      setActive(param);
    }
  }, [categories]);

  // Keep the URL in step with the active filter, without a full navigation.
  function selectCategory(cat: string) {
    setActive(cat);
    const url = new URL(window.location.href);
    if (cat === ALL) {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', cat);
    }
    window.history.replaceState(null, '', url);
  }

  const filtered =
    active === ALL ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryBadge
            key={cat}
            category={cat}
            as="button"
            active={active === cat}
            onClick={() => selectCategory(cat)}
          />
        ))}
      </div>

      <p className="mb-8 text-sm text-muted">
        Showing{' '}
        <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'article' : 'articles'}
        {active !== ALL && ` in ${active}`}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No articles in this category yet.</p>
      )}
    </>
  );
}
