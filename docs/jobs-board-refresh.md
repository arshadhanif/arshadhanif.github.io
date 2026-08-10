# Oracle Fusion Jobs Board — Refresh Playbook

This is the standing procedure for refreshing the `/jobs` board with fresh,
real listings. Any Claude session (manual or scheduled) should be able to run
this end to end and produce a consistent result.

**One-line prompt to trigger a refresh:**

> Refresh the Oracle Fusion jobs board following `docs/jobs-board-refresh.md`.

---

## What the board is

- Page: `app/jobs/page.tsx` → renders `components/JobsList.tsx`
- Data: `content/jobs.json` (the only file a refresh needs to rewrite)
- Loader: `lib/jobs.ts`
- Every listing is **real**, sourced from the Indeed MCP connector. Never
  invent, pad, or estimate a listing. If a market returns nothing, leave it out.

## Markets to pull (Indeed `search_jobs`)

Pull each of these every refresh. Search term `Oracle Fusion Consultant` or
`Oracle Fusion` works best; broaden to `Oracle Fusion Financials` where a market
is thin.

| Country | country_code | Locations to search |
|---|---|---|
| UAE | AE | Dubai, Abu Dhabi |
| Saudi Arabia | SA | Riyadh, Jeddah |
| Qatar | QA | Doha |
| Oman | OM | Muscat |
| Bahrain | BH | Manama |
| Kuwait | KW | Kuwait City |
| Pakistan | PK | Karachi, Lahore, Islamabad |
| India | IN | Bengaluru, Hyderabad, Pune, Chennai |
| United Kingdom | GB | London, remote |

Gulf minors (QA/OM/BH/KW), the UK, and Pakistan cities are frequently empty on
Indeed — that is expected. Keep them in the sweep so we catch new postings when
they appear.

## Curation rules

1. **Freshness** — drop anything posted more than ~3 months before today.
   A stale board reads as abandoned. Keep the most recent postings.
2. **On-topic** — keep Oracle Fusion / Oracle Cloud roles. Drop pure Oracle EBS
   roles and generic finance roles that only mention Oracle in passing.
3. **Dedupe** — one row per unique apply URL. If the same role appears twice,
   keep the fresher posting.
4. **Normalise** — clean up titles that arrive in ALL CAPS; write Indian
   locations as `City, India` (not `City, State`); keep the country field to the
   filter values: `UAE`, `Saudi Arabia`, `Qatar`, `Oman`, `Bahrain`, `Kuwait`,
   `Pakistan`, `India`, `United Kingdom`.
5. **Module** — classify each role into exactly one: `Financials`,
   `Procurement & SCM`, `HCM`, `Technical`, `EPM`, `PPM`, `Project Management`,
   or `General` (use General for ERP/BA/leadership roles that don't map cleanly).
6. **Featured** — mark ~5 as `"featured": true`. Prefer Financials (the site's
   specialty) and recognisable brands (Oracle, Deloitte, Infosys, PwC, EY, etc.).
7. **Order** — sort the array newest first by `postedDate`.

## JSON shape (`content/jobs.json`)

```json
{
  "id": "job-<indeed_jobsearch_number>",
  "title": "Oracle Fusion Financial Functional Consultant",
  "company": "BlackStone eIT",
  "location": "Abu Dhabi, UAE",
  "country": "UAE",
  "module": "Financials",
  "type": "Full-time",
  "postedDate": "2026-07-30",
  "url": "https://to.indeed.com/aaf9clm9fnqd",
  "featured": true
}
```

- `id`: stable per posting; reuse the Indeed JOBSEARCH number so re-pulled roles
  keep the same id.
- `postedDate`: ISO `YYYY-MM-DD` from Indeed's "Posted on".
- `type`: Indeed's job type, or `Full-time` if not stated.

## Steps

1. Ensure you are on the branch that holds the live board (currently
   `claude/myvault-nextjs-site-8k5y93`; switch to `main` once the board is
   merged and deploying from there). Pull latest.
2. Run the Indeed searches for every market above.
3. Apply the curation rules and rewrite `content/jobs.json` (newest first).
4. `npm run build` — must pass. Spot-check `out/jobs/index.html` contains the
   new companies and the `Last updated` date reflects the newest posting.
5. Commit (`Refresh Oracle Fusion jobs board`) and push.

## Notes

- The board's "Last updated" date is derived automatically from the newest
  `postedDate` in the data (see `lib/jobs.ts` → `getJobsLastUpdated`). No manual
  date field to maintain.
- Target cadence: weekly.
