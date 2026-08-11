'use client';

import { useState } from 'react';

interface LeadMagnetProps {
  title: string;
  description: string;
  fileUrl: string;
  format?: string;
  variant?: 'card' | 'banner';
}

/**
 * Email-gated free download, the core lead-magnet pattern for this niche.
 *
 * Placeholder behaviour: collects the email locally, then reveals the download
 * link. Before launch, POST the email to your Mailchimp/Beehiiv list first
 * (replace the handler), then reveal the file.
 */
export default function LeadMagnet({
  title,
  description,
  fileUrl,
  format,
  variant = 'card',
}: LeadMagnetProps) {
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const href = `${base}${fileUrl}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send `email` to the email provider before unlocking.
    if (email.trim()) setUnlocked(true);
  }

  const wrapper =
    variant === 'banner'
      ? 'rounded-xl border border-accent/30 bg-accent/5 p-6'
      : 'flex h-full flex-col rounded-xl border border-border bg-surface p-6';

  return (
    <div className={wrapper}>
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true">🎁</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Free download{format ? ` · ${format}` : ''}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {description}
      </p>

      {unlocked ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          ⬇ Download now
        </a>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`lm-${title}`} className="sr-only">
            Email address
          </label>
          <input
            id={`lm-${title}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
          >
            Get it free
          </button>
        </form>
      )}
    </div>
  );
}
