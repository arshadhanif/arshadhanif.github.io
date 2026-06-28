import videosData from '@/content/videos.json';

export interface Video {
  id: string;
  title: string;
  description: string;
  // YouTube video id (the part after watch?v=). Leave empty for a
  // "coming soon" placeholder tile.
  youtubeId: string;
}

export function getAllVideos(): Video[] {
  return videosData as Video[];
}
