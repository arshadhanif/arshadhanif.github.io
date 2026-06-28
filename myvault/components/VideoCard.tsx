import type { Video } from '@/lib/videos';
import { SOCIAL } from '@/lib/constants';

/**
 * A video tile. With a real youtubeId it shows the thumbnail and links to the
 * video; without one it shows a "coming soon" placeholder linking to the channel.
 */
export default function VideoCard({ video }: { video: Video }) {
  const hasVideo = video.youtubeId.trim() !== '';
  const href = hasVideo
    ? `https://www.youtube.com/watch?v=${video.youtubeId}`
    : SOCIAL.youtube;
  const thumb = hasVideo
    ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-video w-full bg-surface-alt">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Coming soon
            </span>
          </div>
        )}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-background transition-transform group-hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug group-hover:text-accent">
          {video.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {video.description}
        </p>
      </div>
    </a>
  );
}
