'use client';

import { useState } from 'react';
import { SITE_URL } from '@/lib/constants';

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const url = `${SITE_URL}${base}/blog/${slug}/`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available; ignore.
    }
  }

  const linkClass =
    'grid h-10 w-10 place-items-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">Share:</span>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={linkClass}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.9l-5.4-7.06L3.96 22H.7l8.02-9.17L1.5 2h7.07l4.88 6.45L18.244 2zm-1.21 18h1.9L7.05 4h-2.0l11.984 16z" />
        </svg>
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={linkClass}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-9.5 8H7v8h2.5v-8zM8.25 6.5A1.25 1.25 0 1 0 8.25 9a1.25 1.25 0 0 0 0-2.5zM18 13.4c0-2.3-1.23-3.4-2.87-3.4a2.48 2.48 0 0 0-2.23 1.23h-.03V11H10.5v8H13v-4.2c0-1.05.2-2.07 1.5-2.07 1.28 0 1.3 1.2 1.3 2.14V19H18v-5.6z" />
        </svg>
      </a>

      <button type="button" onClick={copyLink} aria-label="Copy link" className={linkClass}>
        {copied ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
    </div>
  );
}
