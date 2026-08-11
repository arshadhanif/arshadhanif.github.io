import type { Resource } from '@/lib/resources';

/**
 * A free resource. Shows a download link when the file is available, or a
 * "Coming soon" state until the file is added under public/downloads and the
 * resource's `available` flag is flipped to true.
 */
export default function ResourceCard({ resource }: { resource: Resource }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const href = `${base}${resource.fileUrl}`;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true">🎁</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Free · {resource.format}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug">{resource.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {resource.description}
      </p>

      {resource.available ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block w-fit rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          ⬇ Download free
        </a>
      ) : (
        <span className="mt-5 inline-flex w-fit items-center rounded-md border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-muted">
          Coming soon
        </span>
      )}
    </article>
  );
}
