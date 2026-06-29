'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface SearchItem {
  type: string;
  title: string;
  excerpt: string;
  href: string;
  meta?: string;
}

export default function SearchClient({ index }: { index: SearchItem[] }) {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const words = term.split(/\s+/);
    return index
      .map((item) => {
        const haystack = `${item.title} ${item.excerpt} ${item.meta ?? ''} ${item.type}`.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (!haystack.includes(w)) return { item, score: -1 };
          if (item.title.toLowerCase().includes(w)) score += 3;
          else score += 1;
        }
        return { item, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((r) => r.item);
  }, [q, index]);

  return (
    <div>
      <div className="relative">
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles, templates, tools..."
          className="w-full rounded-xl border-2 border-foreground bg-surface px-5 py-4 text-lg focus:outline-none"
        />
      </div>

      {q.trim() && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">
          {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{q.trim()}&rdquo;
        </p>
      )}

      <div className="mt-4 divide-y divide-border border-t border-border">
        {results.map((item) => (
          <Link
            key={`${item.type}-${item.href}-${item.title}`}
            href={item.href}
            className="group block py-5"
          >
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
                {item.type}
              </span>
              {item.meta && <span>{item.meta}</span>}
            </div>
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight transition-colors group-hover:text-accent">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{item.excerpt}</p>
          </Link>
        ))}
      </div>

      {!q.trim() && (
        <p className="mt-8 text-muted">
          Start typing to search across articles, store products, free
          resources, solutions and tools.
        </p>
      )}
    </div>
  );
}
