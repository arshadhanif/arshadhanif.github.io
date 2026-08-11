import jobsData from '@/content/jobs.json';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  module: string;
  type: string;
  /** ISO date string, e.g. "2026-07-31". */
  postedDate: string;
  url: string;
  featured: boolean;
}

/** All jobs, newest first (the JSON is maintained in that order). */
export function getAllJobs(): Job[] {
  return jobsData as Job[];
}

/** The date the board was last refreshed, the most recent posting date. */
export function getJobsLastUpdated(): string {
  const jobs = getAllJobs();
  if (jobs.length === 0) return '';
  return jobs
    .map((j) => j.postedDate)
    .sort()
    .reverse()[0];
}
