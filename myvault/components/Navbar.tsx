'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAME, NAV_LINKS } from '@/lib/constants';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="container-page flex items-center justify-between py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-extrabold text-background transition-transform hover:scale-105">
            {SITE_NAME.charAt(0)}
          </span>
          <span>{SITE_NAME}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop links */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-accent'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/newsletter"
              className="ml-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Subscribe
            </Link>
          </div>

          <Link
            href="/search"
            aria-label="Search"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>

          <ThemeSwitcher />

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-accent'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/newsletter"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-accent px-4 py-2 text-center text-base font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Subscribe
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
