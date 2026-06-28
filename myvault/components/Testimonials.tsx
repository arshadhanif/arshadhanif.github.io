import { getAllTestimonials } from '@/lib/testimonials';

export default function Testimonials({
  heading = 'What clients say',
}: {
  heading?: string;
}) {
  const testimonials = getAllTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex h-full flex-col rounded-xl border border-border bg-surface p-6"
          >
            <div className="text-sm text-accent" aria-hidden="true">
              ★★★★★
            </div>
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
              {t.quote}
            </blockquote>
            <figcaption className="mt-4 border-t border-border pt-4 text-sm">
              <span className="font-semibold">{t.name}</span>
              <span className="block text-xs text-muted">{t.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
