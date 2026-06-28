import Link from 'next/link';
import { FOUNDER, SITE_NAME } from '@/lib/constants';

export default function AuthorBio() {
  const initials = FOUNDER.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('');

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-base font-bold text-background">
        {initials}
      </div>
      <div>
        <p className="text-sm text-muted">
          Published by{' '}
          <Link href="/about" className="font-semibold text-foreground hover:text-accent">
            {SITE_NAME}
          </Link>
          , written by {FOUNDER.name}.
        </p>
        <p className="mt-1 text-sm text-muted">
          More templates and guides for finance and ERP people at{' '}
          <Link href="/" className="text-accent hover:opacity-80">
            {SITE_NAME}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
