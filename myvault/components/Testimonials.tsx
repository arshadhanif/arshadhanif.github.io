import { getAllTestimonials } from '@/lib/testimonials';

interface TestimonialsProps {
  heading?: string;
  eyebrow?: string;
}

export default function Testimonials({
  heading = 'What clients say',
  eyebrow,
}: TestimonialsProps) {
  const testimonials = getAllTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="mt-16">
      {eyebrow && (
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {heading}
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <div className="text-sm tracking-wide text-accent" aria-hidden="true">
              ★★★★★
            </div>
            <blockquote className="mt-3 flex-1 leading-relaxed text-foreground/90">
              {t.quote}
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4">
              <span className="font-display font-bold">{t.name}</span>
              <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wider text-muted">
                {t.source}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
