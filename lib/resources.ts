import resourcesData from '@/content/resources.json';

export interface Resource {
  id: string;
  title: string;
  description: string;
  format: string;
  fileUrl: string;
  featured: boolean;
}

export function getAllResources(): Resource[] {
  return resourcesData as Resource[];
}

export function getFeaturedResources(limit = 2): Resource[] {
  return getAllResources()
    .filter((r) => r.featured)
    .slice(0, limit);
}
