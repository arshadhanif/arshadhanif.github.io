import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE, SOCIAL } from '@/lib/constants';
import { IconArrowRight } from '@/components/Icons';

const LINK_GROUPS = [
  {
    title: 'Explore',
    links: [
      { href: '/start-here', label: 'Start Here' },
      { href: '/blog', label: 'Articles' },
      { href: '/store', label: 'Store' },
      { href: '/excel', label: 'Excel' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/resources', label: 'Resources' },
      { href: '/solutions', label: 'Solutions' },
      { href: '/tools/excel-formula-generator', label: 'Free Tools' },
      { href: '/watch', label: 'Watch' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/services', label: 'Services' },
      { href: '/about', label: 'About' },
      { href: '/newsletter', label: 'Newsletter' },
    ],
  },
];

// Brand-coloured social buttons: the icon carries its brand colour at rest and
// the whole chip fills with that colour on hover.
const socialBase =
  'group grid h-11 w-11 place-items-center rounded-xl border border-border bg-background transition-all hover:-translate-y-0.5';

const SOCIALS = [
  {
    href: SOCIAL.linkedin,
    label: 'LinkedIn',
    className: `${socialBase} text-[#0A66C2] hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white`,
    path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-9.5 8H7v8h2.5v-8zM8.25 6.5A1.25 1.25 0 1 0 8.25 9a1.25 1.25 0 0 0 0-2.5zM18 13.4c0-2.3-1.23-3.4-2.87-3.4a2.48 2.48 0 0 0-2.23 1.23h-.03V11H10.5v8H13v-4.2c0-1.05.2-2.07 1.5-2.07 1.28 0 1.3 1.2 1.3 2.14V19H18v-5.6z',
    fill: true,
  },
  {
    href: SOCIAL.youtube,
    label: 'YouTube',
    className: `${socialBase} text-[#FF0000] hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white`,
    path: 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.34 5.1 12 5.1 12 5.1s-7.34 0-8.83.43A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77c1.49.43 8.83.43 8.83.43s7.34 0 8.83-.43a2.5 2.5 0 0 0 1.77-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z',
    fill: true,
  },
];

export default function Footer() {
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          {/* Brand + newsletter nudge + socials */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-extrabold text-background">
                {SITE_NAME.charAt(0)}
              </span>
              <span>{SITE_NAME}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {SITE_TAGLINE}. Templates, report packs and guides drawn from real
              Oracle Fusion delivery.
            </p>

            <Link
              href="/newsletter"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
            >
              Join the newsletter <IconArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-6 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={s.className}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
              <a
                href={SOCIAL.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                className={`${socialBase} text-accent hover:border-accent hover:bg-accent hover:text-background`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Grouped link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {group.title}
                </h3>
                <nav className="mt-4 flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
          <span>Oracle Fusion · Excel · Finance reporting</span>
        </div>
      </div>
    </footer>
  );
}
