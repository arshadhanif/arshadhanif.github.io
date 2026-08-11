import { NEWSLETTER_URL } from '@/lib/constants';

interface NewsletterSignupProps {
  variant?: 'card' | 'inline';
  heading?: string;
  subheading?: string;
}

/**
 * Newsletter signup.
 *
 * Submits straight to the Beehiiv publication so sign-ups are actually
 * captured (the site is a static export, so there is no server to POST to).
 * The email is passed as a query param, which prefills the Beehiiv subscribe
 * form; the confirmation happens on Beehiiv. Opens in a new tab so the reader
 * keeps their place on the site.
 */
export default function NewsletterSignup({
  variant = 'card',
  heading = 'Join the newsletter',
  subheading = 'Practical ERP, Oracle Fusion, and finance insights, straight to your inbox. No spam, unsubscribe anytime.',
}: NewsletterSignupProps) {
  const wrapperClass =
    variant === 'card'
      ? 'rounded-2xl border border-border bg-surface p-8 sm:p-10'
      : '';

  return (
    <div className={wrapperClass}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-3 max-w-xl text-muted">{subheading}</p>

      <form
        action={NEWSLETTER_URL}
        method="get"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="w-full flex-1 rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Subscribe
        </button>
      </form>

      <p className="mt-3 text-xs text-muted">
        Subscriptions are handled securely on Beehiiv.
      </p>
    </div>
  );
}
