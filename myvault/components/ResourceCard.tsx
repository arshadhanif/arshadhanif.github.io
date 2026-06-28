import type { Resource } from '@/lib/resources';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * A free resource shown on the resources hub. These are genuinely free, so they
 * download directly with no email gate. Email capture happens through the
 * newsletter, which is the better trade for everyone.
 */
export default function ResourceCard({ resource }: { resource: Resource }) {
  const href = `${basePath}${resource.fileUrl}`;

  return (
    <article className="card-hover flex h-full flex-col rounded-xl border border-border bg-surface p-6">
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Free · {resource.format}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug">{resource.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {resource.description}
      </p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
      >
        Download
      </a>
    </article>
  );
}
