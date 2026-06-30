import Link from 'next/link';
import { FOUNDER, SITE_NAME, SOCIAL } from '@/lib/constants';

export default function AuthorBio() {
  const initials = FOUNDER.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('');

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-bold text-background">
          {initials}
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Written by
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight">
            {FOUNDER.name}
          </p>
          <p className="text-sm text-accent">{FOUNDER.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {FOUNDER.shortBio}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <Link href="/about" className="text-accent hover:opacity-80">
              About {SITE_NAME}
            </Link>
            <a
              href={SOCIAL.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:opacity-80"
            >
              LinkedIn
            </a>
            <Link href="/services" className="text-accent hover:opacity-80">
              Work with him
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
