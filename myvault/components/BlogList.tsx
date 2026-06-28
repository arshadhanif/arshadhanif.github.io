'use client';

import { useMemo, useState } from 'react';
import type { PostMeta } from '@/lib/posts';
import ArticleCard from './ArticleCard';
import CategoryBadge from './CategoryBadge';

const ALL = 'All';

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [active, setActive] = useState<string>(ALL);
  const [query, setQuery] = useState('');

  // Build the tag list from categories actually present in the posts.
  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return [ALL, ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesCategory = active === ALL || p.category === active;
      const matchesQuery =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [posts, active, query]);

  return (
    <>
      <div className="mb-6">
        <label htmlFor="article-search" className="sr-only">
          Search articles
        </label>
        <input
          id="article-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles"
          className="w-full max-w-md rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
          {filtered.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted">
          No articles match your search. Try a different term or category.
        </p>
      )}
    </>
  );
}
