'use client';

import { useState } from 'react';

interface NewsletterSignupProps {
  variant?: 'card' | 'inline';
  heading?: string;
  subheading?: string;
}

/**
 * Newsletter signup form.
 *
 * This is a placeholder that captures the email locally and shows a success
 * state. To go live, point the form `action` at your Mailchimp or Beehiiv
 * embed endpoint (replace the onSubmit handler with a real POST), e.g.:
 *
 *   <form action="https://YOUR.us1.list-manage.com/subscribe/post?u=...&id=..."
 *         method="post" target="_blank">
 */
export default function NewsletterSignup({
  variant = 'card',
  heading = 'Join the newsletter',
  subheading = 'Practical ERP, Oracle Fusion, and finance insights — straight to your inbox. No spam, unsubscribe anytime.',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: wire this up to Mailchimp / Beehiiv before launch.
    if (email.trim()) setSubmitted(true);
  }

  const wrapperClass =
    variant === 'card'
      ? 'rounded-2xl border border-border bg-surface p-8 sm:p-10'
      : '';

  return (
    <div className={wrapperClass}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-3 max-w-xl text-muted">{subheading}</p>

      {submitted ? (
        <div className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          🎉 You&apos;re on the list! Check your inbox to confirm your subscription.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
      )}
    </div>
  );
}
