# Pending from you (single source of truth)

Everything that can be built without you is built and live. This is the short
list of things only Arshad can do. When an item is done, tick it and tell Claude.

Last refreshed: 2026-06-30 (Period Close Accelerator is live and selling).

---

## NOTE: SEO is intentionally on hold (site is under construction)

Arshad does not want the site showing up in search yet: it is still being built
out and does not have enough content. So the whole `/myvault` subsite is set to
**noindex, nofollow** (in `app/layout.tsx` metadata), which keeps every page out
of Google and Bing even if they crawl it. The portfolio at the domain root is
not affected.

Do NOT submit the site to Google Search Console or chase rankings for now.

**When ready to do SEO later:** delete the `robots` block in `app/layout.tsx`
(or set `index: true, follow: true`), then submit the sitemap in Google Search
Console and request indexing on the key pages. Everything else (sitemap,
robots.txt, titles, structured data) is already in place for that day.

---

## 1. Analytics (one value, 2 minutes)

- [ ] Create a free Google Analytics 4 property and send Claude the **Measurement
  ID** (`G-XXXXXXXXXX`). Steps: analytics.google.com > Admin > Create > add a Web
  data stream for https://arshadhanif.github.io > copy the ID. Claude then turns
  analytics on in `lib/constants.ts`.

## 2. Optional, not blocking

- [ ] The remaining store products are on the waitlist until you build their
  files. After a market review, the generic Excel templates and Excel courses
  were dropped (they compete with free versions and sit outside the Oracle
  niche). The moat-focused lineup to build, in priority order: OTBI Analytics
  Pack (build next), BI Publisher Report Pack, Oracle Fusion Reporting Bundle,
  ERP Implementation Document Pack (only in an Oracle Fusion specific form), and
  the Oracle Fusion Financials course (highest effort, build later once there is
  an audience). The Period Close Accelerator is the one real, selling product.
- [ ] Real YouTube channel handle + video IDs. The Watch page is built but
  hidden (removed from the footer and sitemap) until a channel exists; send the
  handle and real video IDs and Claude switches it back on in minutes.
- [ ] Custom domain (only if you want one; the github.io URL works).

---

## Already done (so we stop revisiting)

**Product is live and selling.**
- Period Close Accelerator Excel workbook finalised: the 5 sheets re-protected
  (Cover, Module Scope, Master Close Tracker, Period Open - Tasks, Period Close -
  Tasks) and the final recalc check passed.
- Live on Gumroad at **$39**, wired into the site as a real "Get it now" checkout.
  The store runs a per-product model (`isLive`), so this one sells while the other
  12 stay on the waitlist. No site-wide switch needed.
- Custom Gumroad landing page published (high-contrast, light and dark, clickable
  email and LinkedIn). Source kept at `gumroad/landing.html`.

**Free collateral.**
- The free PDF is now the **Period Close Guide** (renamed everywhere): bold
  colon bullet labels, and the "move to the cloud" section removed.
- The one-pager task and report counts are version-proofed to **"100+"** so a new
  workbook version does not make it inaccurate.
- Email and LinkedIn are clickable in both PDFs. Editable HTML sources live in
  `content/source/`.

**Infrastructure.**
- GitHub Pages "Source" set to **GitHub Actions**, which removed the deploy race.
  Pushes now deploy the whole site (portfolio root + /myvault/) cleanly on their
  own, with no manual re-trigger.
- Structured data marks live products as InStock and waitlist products as
  PreOrder, so search engines do not index dead offer links.

**Site and design.**
- Full editorial site and design system; all pages (home, blog + categories +
  articles, store + product pages, excel, solutions + hubs, services, about,
  resources, watch, newsletter, start-here, contact, FAQ, glossary, privacy,
  terms, search, 404); 4 finance calculators + Excel formula generator;
  breadcrumbs; article table of contents; structured data; Beehiiv newsletter
  with welcome + 5-day course automations; branded footer; themes.
- Period Close Accelerator is the lead product (featured on home and the
  month-end-close hub), with accurate copy from the actual workbook, FAQs, and
  the free guide and one-pager hosted as downloads. An SEO article on the Oracle
  Fusion close funnels to it.
