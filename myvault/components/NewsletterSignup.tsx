import BeehiivForm from './BeehiivForm';

interface NewsletterSignupProps {
  variant?: 'card' | 'inline';
  heading?: string;
  subheading?: string;
}

/**
 * Newsletter signup block: our heading and copy wrapped around the live
 * Beehiiv form, which handles the actual subscription.
 */
export default function NewsletterSignup({
  variant = 'card',
  heading = 'Join the newsletter',
  subheading = 'Practical ERP, Oracle Fusion and finance insights, straight to your inbox. No spam, unsubscribe anytime.',
}: NewsletterSignupProps) {
  const wrapperClass =
    variant === 'card'
      ? 'rounded-2xl border border-border bg-surface p-8 sm:p-10'
      : '';

  return (
    <div className={wrapperClass}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-3 max-w-xl text-muted">{subheading}</p>
      <BeehiivForm className="mt-6" />
    </div>
  );
}
