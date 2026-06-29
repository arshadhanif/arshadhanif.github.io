import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * Editorial page masthead: a small tracked eyebrow, an oversized display
 * headline, an intro, and a heavy bottom rule. Shared across every inner page
 * so the site reads as one editorial system.
 */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  align = 'left',
  action,
  children,
}: PageHeaderProps) {
  const centered = align === 'center';

  return (
    <header
      className={`mb-12 border-b-2 border-foreground pb-8 ${
        centered ? 'text-center' : ''
      }`}
    >
      <div
        className={
          centered
            ? 'mx-auto max-w-2xl'
            : 'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between'
        }
      >
        <div className={centered ? '' : 'max-w-2xl'}>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.0] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {intro && (
            <p
              className={`mt-5 text-lg leading-relaxed text-muted ${
                centered ? 'mx-auto max-w-xl' : ''
              }`}
            >
              {intro}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </header>
  );
}
