import { getAllTestimonials } from '@/lib/testimonials';

interface TestimonialsProps {
  heading?: string;
  subheading?: string;
}

export default function Testimonials({
  heading = 'Trusted by finance & ERP teams',
  subheading,
}: TestimonialsProps) {
  const testimonials = getAllTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="container-page py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
        {subheading && <p className="mt-2 text-muted">{subheading}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex h-full flex-col rounded-xl border border-border bg-surface p-6"
          >
            <span className="text-3xl leading-none text-accent" aria-hidden="true">
              &ldquo;
            </span>
            <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-foreground/90">
              {t.quote}
            </blockquote>
            <figcaption className="mt-4 border-t border-border pt-4 text-sm">
              <span className="font-semibold">{t.name}</span>
              {(t.role || t.company) && (
                <span className="block text-xs text-muted">
                  {[t.role, t.company].filter(Boolean).join(' · ')}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
