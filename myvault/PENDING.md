# Pending from you (single source of truth)

Everything that can be built without you is built. This is the short list of
things only Arshad can do. When an item is done, tick it and tell Claude.

Last refreshed: 2026-06-30 (Period Close Accelerator is now the flagship product).

---

## 1. Finish the product file (Excel) - quick

- [ ] **Re-protect 5 sheets in the v7 workbook.** They lost sheet protection:
  Cover, Module Scope, Master Close Tracker, Period Open - Tasks,
  Period Close - Tasks. In Excel: Review > Protect Sheet > leave password blank >
  OK, on each. Tick "Use AutoFilter" and "Sort" in that dialog. (The other 4
  sheets are already protected. Cell lock flags are correct, this just switches
  protection back on.)
- [ ] **Final Excel check:** open it, accept no repair prompt, press Ctrl+Alt+F9
  to recalc, confirm no error cells, and eyeball Cover/Instructions text fits.

## 2. Put it on Gumroad and send the link (this is what turns the store live)

- [ ] Create one Gumroad product for the **Oracle Fusion Cloud Period Close
  Accelerator**, upload the final .xlsx, set the price, publish, copy the product
  link, and send it to Claude. Step-by-step is in `GUMROAD-GUIDE.md`.
- [ ] **Confirm the price.** The site currently shows **$89** as a placeholder.
  Tell Claude if it should be different.
- Once the link is provided, Claude sets it in `content/products.json` and flips
  `STORE_LIVE` to true. The "Join the waitlist / Notify me" buttons become a live
  "Get it" checkout. (Until then the page already gives away the free guide
  and one-pager and collects emails, so it is working for you now.)

## 3. Analytics (one value, 2 minutes)

- [ ] Create a free Google Analytics 4 property and send Claude the **Measurement
  ID** (`G-XXXXXXXXXX`). Steps: analytics.google.com > Admin > Create > add a Web
  data stream for https://arshadhanif.github.io > copy the ID. Claude then turns
  analytics on in `lib/constants.ts`.

## 4. Optional, not blocking
- [ ] Custom domain (only if you want one; the github.io URL works).
- [ ] Real YouTube channel handle + video IDs (the Watch page is stubbed).
- [ ] The other 12 store products: their files are not built yet. They sit on the
  waitlist until you create them. The Period Close Accelerator is the one real,
  finished product.

---

## Already done (so we stop revisiting)

Full editorial site and design system; all pages (home, blog + categories +
articles, store + product pages, excel, solutions + hubs, services, about,
resources, watch, newsletter, start-here, contact, FAQ, glossary, privacy,
terms, search, 404); 4 finance calculators + Excel formula generator;
breadcrumbs; article table of contents; structured data; Beehiiv newsletter with
welcome + 5-day course automations; branded footer; themes.

**Flagship product is fully built around the real file:** the Period Close
Accelerator is the lead product (featured on home and the month-end-close hub),
with accurate copy from the actual workbook, FAQs, and the real guide and
one-pager hosted as free downloads. An SEO article on the Oracle Fusion close
funnels to it. Only the Gumroad link (item 2) is needed to start selling.
