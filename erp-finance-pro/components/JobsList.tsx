'use client';

import { useMemo, useState } from 'react';
import type { Job } from '@/lib/jobs';
import CategoryBadge from './CategoryBadge';

const ALL = 'All';

/** Human-friendly "posted" label from an ISO date, relative to today. */
function postedLabel(iso: string): string {
  const posted = new Date(iso);
  const now = new Date();
  const days = Math.round((now.getTime() - posted.getTime()) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return `${w} week${w > 1 ? 's' : ''} ago`;
  }
  const m = Math.round(days / 30);
  return `${m} month${m > 1 ? 's' : ''} ago`;
}

function JobCard({ job }: { job: Job }) {
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={job.module} />
          {job.featured && (
            <span className="inline-flex items-center rounded-full border border-accent bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
              Featured
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted">
          {postedLabel(job.postedDate)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
        {job.title}
      </h3>

      <p className="mt-1 text-sm text-muted">{job.company}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </span>
        <span>{job.type}</span>
      </div>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        View &amp; apply
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </a>
  );
}

export default function JobsList({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState('');
  const [module, setModule] = useState<string>(ALL);
  const [country, setCountry] = useState<string>(ALL);

  const modules = useMemo(() => {
    const set = new Set(jobs.map((j) => j.module));
    return [ALL, ...Array.from(set).sort()];
  }, [jobs]);

  const countries = useMemo(() => {
    const set = new Set(jobs.map((j) => j.country));
    return [ALL, ...Array.from(set).sort()];
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (module !== ALL && j.module !== module) return false;
      if (country !== ALL && j.country !== country) return false;
      if (q) {
        const haystack = `${j.title} ${j.company} ${j.location}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, query, module, country]);

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <label htmlFor="job-search" className="sr-only">
          Search jobs by title, company, or location
        </label>
        <input
          id="job-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, or location…"
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Module filter */}
      <div className="mb-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Module
        </p>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <CategoryBadge
              key={m}
              category={m}
              as="button"
              active={module === m}
              onClick={() => setModule(m)}
            />
          ))}
        </div>
      </div>

      {/* Location filter */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Location
        </p>
        <div className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <CategoryBadge
              key={c}
              category={c}
              as="button"
              active={country === c}
              onClick={() => setCountry(c)}
            />
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="mb-6 text-sm text-muted">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'role' : 'roles'}
        {module !== ALL && ` in ${module}`}
        {country !== ALL && ` · ${country}`}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">
            No roles match your filters. Try clearing the search or widening the
            module and location.
          </p>
        </div>
      )}
    </>
  );
}
