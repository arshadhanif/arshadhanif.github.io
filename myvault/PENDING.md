# Pending from you (single source of truth)

This is the one list of things only Arshad can provide. Everything else (design,
pages, tools, copy, SEO, structured data) is built. When an item below is
supplied, Claude plugs it in and ticks it off here. Do not re-ask for anything
already filled in.

Last refreshed: 2026-06-30.

---

## 1. Blocks real sales (highest priority)

- [ ] **Gumroad product links.** All 13 store products currently point to
  placeholder URLs (`//gumroad.com/l/placeholder-...`), so "Get it" buttons do
  not lead to a real checkout. Provide the real Gumroad link (or product
  permalink) for each product. Any format is fine: a list mapping product title
  to URL. Products live in `content/products.json`.
  - Excel Finance Dashboard Kit
  - Month-End Close Checklist
  - Excel 3-Statement Model
  - 13-Week Cashflow
  - Budgeting Pack
  - Excel Bundle
  - ERP Implementation Docs
  - Excel Finance Course
  - Excel Formulas Course
  - Oracle Fusion Course
  - Oracle Fusion Reporting Pack
  - OTBI + BIP Bundle
  - Reconciliation Bundle
  (Exact ids are in `content/products.json`.)

## 2. Turns on growth tracking

- [ ] **Analytics.** Pick one and send it over; Claude flips it on in
  `lib/constants.ts`:
  - Plausible: just confirm the domain (default `arshadhanif.github.io`), or
  - Google Analytics 4: send the Measurement ID (looks like `G-XXXXXXXXXX`).

## 3. Video / YouTube

- [ ] **Real YouTube channel handle.** Currently a placeholder
  (`@erpfinancepro`) in `lib/constants.ts` (`SOCIAL.youtube`). Confirm the real
  handle or full channel URL.
- [ ] **Video IDs.** The 3 entries in `content/videos.json` have empty
  `youtubeId`. Send the real YouTube video IDs, or say the word and the Watch
  page can be hidden until videos exist.

## 4. Real downloadable files

(You already said these are not ready, so this is just the holding list.)

- [ ] Replace the placeholder files in `public/downloads/` with the real ones:
  - `erp-finance-starter-kit.pdf` (the lead magnet)
  - `excel-finance-shortcuts.pdf`
  - `month-end-close-checklist-lite.pdf`
  - `erp-implementation-raci.xlsx`
  - (The Oracle SQL and the new-year / user-inactivation checklists are already
    real content.)

## 5. Optional, not blocking

- [ ] **Custom domain** (e.g. a branded domain instead of the github.io
  subpath). Only if you want one; the current URL works.
- [ ] **More testimonials.** Three real Upwork testimonials are in place. Send
  more any time and they slot into `content/testimonials.json`.

---

## Already done (so we stop revisiting)

Design system, all pages (home, blog, store, excel, solutions, services, about,
resources, watch, newsletter, start-here), 4 free calculators, Excel formula
generator, site search, glossary, contact, FAQ, privacy, terms, breadcrumbs,
article table of contents, RSS, sitemap, robots, structured data (Organization,
Product, FAQ, BlogPosting, Breadcrumb, DefinedTermSet), Beehiiv newsletter +
welcome and 5-day course automations, branded footer, theme switcher.
