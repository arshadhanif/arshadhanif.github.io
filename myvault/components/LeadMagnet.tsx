import BeehiivForm from './BeehiivForm';

interface LeadMagnetProps {
  title: string;
  description: string;
  format?: string;
  variant?: 'card' | 'banner';
  // Kept for compatibility with existing call sites; the file is delivered by
  // the Beehiiv welcome email rather than unlocked on the page.
  fileUrl?: string;
}

/**
 * A free-offer block. The Beehiiv form captures the email; the welcome email
 * delivers the file. This is the standard lead-magnet flow for a static site.
 */
export default function LeadMagnet({
  title,
  description,
  format,
  variant = 'card',
}: LeadMagnetProps) {
  const wrapper =
    variant === 'banner'
      ? 'rounded-2xl border border-accent/30 bg-accent/5 p-8 sm:p-10'
      : 'flex h-full flex-col rounded-xl border border-border bg-surface p-6';

  return (
    <div className={wrapper}>
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Free download{format ? ` · ${format}` : ''}
        </span>
      </div>

      <h3
        className={
          variant === 'banner'
            ? 'text-2xl font-bold tracking-tight sm:text-3xl'
            : 'text-lg font-semibold leading-snug'
        }
      >
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>

      <BeehiivForm className="mt-5" />
      <p className="mt-3 text-xs text-muted">
        Enter your email and we will send it straight to your inbox.
      </p>
    </div>
  );
}
