import type { Metadata } from 'next';
import { getAllVideos } from '@/lib/videos';
import VideoCard from '@/components/VideoCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import { SITE_NAME, SOCIAL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Watch',
  description:
    'Video tutorials on Excel, Oracle Fusion and finance from ERP Finance Pro.',
  openGraph: {
    title: 'Watch',
    description: 'Video tutorials on Excel, Oracle Fusion and finance.',
  },
};

export default function WatchPage() {
  const videos = getAllVideos();

  return (
    <div className="container-page py-16">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Watch
          </h1>
          <p className="mt-4 text-lg text-muted">
            Short, practical video tutorials on Excel, Oracle Fusion and finance.
            New videos land on the {SITE_NAME} YouTube channel.
          </p>
        </div>
        <a
          href={SOCIAL.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block shrink-0 rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
        >
          Subscribe on YouTube
        </a>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <div className="mt-14">
        <NewsletterSignup
          heading="Never miss a new video"
          subheading="Subscribe and get new tutorials and templates in your inbox, plus the free starter kit."
        />
      </div>
    </div>
  );
}
