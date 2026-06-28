'use client';

import { useMemo, useState } from 'react';
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

  const filtered =
    active === ALL ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryBadge
            key={cat}
            category={cat}
            as="button"
            active={active === cat}
            onClick={() => setActive(cat)}
          />
        ))}
      </div>

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
