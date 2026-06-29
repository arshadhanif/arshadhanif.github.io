import type { Metadata } from 'next';
import { getAllVideos } from '@/lib/videos';
import VideoCard from '@/components/VideoCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import PageHeader from '@/components/PageHeader';
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
      <PageHeader
        eyebrow="Video tutorials"
        title="Watch"
        intro={`Short, practical video tutorials on Excel, Oracle Fusion and finance. New videos land on the ${SITE_NAME} YouTube channel.`}
        action={
          <a
            href={SOCIAL.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Subscribe on YouTube
          </a>
        }
      />

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
