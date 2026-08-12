# Website Backlog & Notes

Running note of what is done, paused, and pending on the site. Keep it current.

## Archived (hidden from the live site, kept in git)

Archived on 2026-08-11 at Arshad's request. Removed from nav, sitemap, and the
build, but retained in git history so they restore cleanly.

- **Jobs board**: `app/jobs/`, `components/JobsList.tsx`, `lib/jobs.ts`,
  `content/jobs.json`, plus the `/jobs` nav and sitemap entries. The refresh
  playbook `docs/jobs-board-refresh.md` is kept for when it returns.
- **Course product**: the `oracle-fusion-financials-course` entry in
  `content/products.json` (the only Courses item).

To restore, check the files out from the last commit that had them (`73feae2`):
`git checkout 73feae2 -- erp-finance-pro/app/jobs erp-finance-pro/components/JobsList.tsx erp-finance-pro/lib/jobs.ts erp-finance-pro/content/jobs.json`
then re-add the `/jobs` nav link and sitemap entry, and the course entry in
products.json.

## Paused

### Interview Prep blog series
Opener published: `content/blog/oracle-fusion-financials-interview-questions.mdx`
(Financials). Series **paused here** at Arshad's request on 2026-08-10.

Remaining parts, in priority order, for when the series resumes:
1. **Oracle Fusion Technical Interview Questions**, reports, BIP data models,
   FBDI / integrations, OTBI subject areas. Still close to Arshad's core.
2. **Behavioural & Scenario Questions for ERP Consultants**, softer round,
   module-agnostic, links to the ERP consulting roadmap article.
3. **HCM / SCM editions**, only if breadth is wanted. Outside Arshad's core
   module, so keep them lighter and do not overclaim depth.

## Pending (from the LearnwithCR competitive analysis)

Still not started, roughly in impact order:
- **Corporate / Team engagement page**, B2B positioning, higher deal size.
- **Interactive self-assessment quiz**, e.g. "Oracle Fusion Career Readiness"
  or "ERP Implementation Health Check". Lead-gen + engagement.
- **Module-specific service pages**, split consulting into Financials and
  Reporting/Analytics pages for SEO on high-intent queries.
- **YouTube integration**, embed a demo/tutorial on the homepage once content
  exists.
- **Student / member login portal (LMS)**, long-term, needs a backend. Future.

## Done (this workstream)

- Floating WhatsApp button (site-wide), homepage stats bar, footer contact
  column + Privacy/Terms pages.
- Oracle Fusion Jobs board (`/jobs`), 35 real listings across UAE, Saudi
  Arabia, Pakistan, India. Refresh playbook at `docs/jobs-board-refresh.md`.
- Homepage FAQ section with FAQPage JSON-LD schema.
- Interview prep series opener (Financials).
- Blog category filtering already existed (client-side chips in `BlogList`).

## Open dependency, GO LIVE

Everything above is on branch `claude/myvault-nextjs-site-8k5y93`. As of
2026-08-10, `main` is ~151 commits behind (old `myvault/` layout) and the site
is **not live** from this work. Going live = merging this branch to `main`.
Do not merge or open a PR without Arshad asking. When it happens, repoint the
jobs refresh playbook from the feature branch to `main`.

## Recurring

- **Jobs board weekly refresh**, durable schedule to be set up by Arshad in the
  Claude Code web app (recurring session), prompt: "Refresh the Oracle Fusion
  jobs board following `docs/jobs-board-refresh.md`." In-session cron is not
  durable (7-day cap), so it is not the mechanism.
