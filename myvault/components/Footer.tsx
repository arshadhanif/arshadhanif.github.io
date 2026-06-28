import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE, NAV_LINKS, SOCIAL } from '@/lib/constants';

export default function Footer() {
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-extrabold text-background">
                {SITE_NAME.charAt(0)}
              </span>
              <span>{SITE_NAME}</span>
            </Link>
            <p className="mt-4 text-sm text-muted">{SITE_TAGLINE}.</p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Explore
            </h3>
            <Link
              href="/start-here"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Start Here
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/tools/excel-formula-generator"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Free Tools
            </Link>
            <Link
              href="/watch"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Watch
            </Link>
            <Link
              href="/newsletter"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Newsletter
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Connect
            </h3>
            <div className="flex gap-3">
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-9.5 8H7v8h2.5v-8zM8.25 6.5A1.25 1.25 0 1 0 8.25 9a1.25 1.25 0 0 0 0-2.5zM18 13.4c0-2.3-1.23-3.4-2.87-3.4a2.48 2.48 0 0 0-2.23 1.23h-.03V11H10.5v8H13v-4.2c0-1.05.2-2.07 1.5-2.07 1.28 0 1.3 1.2 1.3 2.14V19H18v-5.6z" />
                </svg>
              </a>
              <a
                href={SOCIAL.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
              <a
                href={SOCIAL.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.34 5.1 12 5.1 12 5.1s-7.34 0-8.83.43A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77c1.49.43 8.83.43 8.83.43s7.34 0 8.83-.43a2.5 2.5 0 0 0 1.77-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted">
          © {year} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
