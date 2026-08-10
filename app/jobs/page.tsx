import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllJobs, getJobsLastUpdated } from '@/lib/jobs';
import JobsList from '@/components/JobsList';

export const metadata: Metadata = {
  title: 'Oracle Fusion Jobs',
  description:
    'A curated board of live Oracle Fusion consultant roles across the UAE, Saudi Arabia, and Pakistan — Financials, HCM, SCM, Technical, and more. Filter by module and location.',
  openGraph: {
    title: 'Oracle Fusion Jobs',
    description:
      'Live Oracle Fusion consultant roles across the Gulf and Pakistan. Filter by module and location, apply in one click.',
  },
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function JobsPage() {
  const jobs = getAllJobs();
  const lastUpdated = formatDate(getJobsLastUpdated());

  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Oracle Fusion Jobs
        </h1>
        <p className="mt-4 text-lg text-muted">
          A curated board of live Oracle Fusion roles across the UAE, Saudi
          Arabia, and Pakistan — Financials, HCM, SCM, Technical, and more.
          Filter by module and location, then apply in one click.
        </p>
        <p className="mt-3 text-sm text-muted">
          {jobs.length} open roles
          {lastUpdated && (
            <>
              {' '}· Last updated {lastUpdated} · Curated from{' '}
              <a
                href="https://www.indeed.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-4 hover:opacity-80"
              >
                Indeed
              </a>
            </>
          )}
        </p>
      </header>

      <JobsList jobs={jobs} />

      {/* Career CTA */}
      <section className="mt-16 rounded-xl border border-border bg-surface p-8 text-center sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight">
          Want to land one of these roles?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          I help finance and ERP professionals position themselves for Oracle
          Fusion consulting roles — CV, LinkedIn, and interview preparation from
          someone who works in the field every day.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/services"
            className="w-full rounded-md bg-accent px-6 py-3 font-semibold text-background transition-colors hover:bg-accent-dim sm:w-auto"
          >
            CV &amp; career coaching
          </Link>
          <Link
            href="/blog/breaking-into-erp-consulting"
            className="w-full rounded-md border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
          >
            Read the roadmap
          </Link>
        </div>
      </section>
    </div>
  );
}
