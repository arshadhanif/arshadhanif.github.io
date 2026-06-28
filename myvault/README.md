# ERP Finance Pro

> **The go-to resource for ERP and finance professionals.**

A Next.js 14 finance and ERP resource brand (blog, store, services and
newsletter) built as a fully static site for GitHub Pages.

> The brand name lives in a single constant (`SITE_NAME` in
> [`lib/constants.ts`](lib/constants.ts)) so it can be changed globally in one
> edit. The source folder and URL path are still `myvault/` and `/myvault`.

## Tech stack

- **Next.js 14** (App Router) with `output: 'export'` (static HTML)
- **Tailwind CSS** for styling
- **MDX** for blog posts (via `next-mdx-remote`)
- File-based content, **no database**

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
```

## Project structure

```
app/                 App Router pages (home, blog, store, services, about, newsletter)
  blog/[slug]/       Single MDX article route
  sitemap.ts         Auto-generated sitemap.xml
  robots.ts          Auto-generated robots.txt
components/          Navbar, Footer, ArticleCard, ProductCard, NewsletterSignup, etc.
content/
  blog/*.mdx         Blog posts (frontmatter: title, date, category, excerpt, readTime, published)
  products.json      Store products (id, title, description, price, category, gumroadUrl, featured)
lib/
  constants.ts       SITE_NAME + brand/site config (single source of truth)
  posts.ts           MDX reading/parsing helpers
  products.ts        Product data helpers
public/              Static assets (favicon, OG image, .nojekyll)
```

## Design tokens

| Token        | Value      |
| ------------ | ---------- |
| Background   | `#0A0A0A`  |
| Accent       | `#00D4AA`  |
| Text         | `#F5F5F5`  |
| Font         | Inter      |

## Content

### Blog

Add an `.mdx` file to `content/blog/` with frontmatter:

```yaml
---
title: 'Your title'
date: '2026-06-28'
category: 'Oracle Fusion' # Oracle Fusion | Excel | ERP Strategy | Career | Tools
excerpt: 'One-line summary.'
readTime: '5 min read'
published: true
---
```

Set `published: false` to keep a draft out of the build.

### Store

Edit `content/products.json`. Categories: `Templates`, `Report Packages`,
`Document Packs`, `Courses`. The Gumroad URLs and prices are placeholders.

## Still to replace before full launch

- **Gumroad URLs** in `content/products.json`
- **Real download files** in `public/downloads/` (current ones are placeholders)
- **Newsletter form**: wired to Beehiiv via `components/BeehiivForm.tsx`
  (`BEEHIIV_FORM_ID` in `lib/constants.ts`)

## Deployment (GitHub Pages)

ERP Finance Pro lives in the `myvault/` folder of the `arshadhanif.github.io`
repo and is served at `https://arshadhanif.github.io/myvault/`. The repo root
keeps the portfolio. The workflow at `.github/workflows/pages.yml` (repo root)
builds it with `BASE_PATH=/myvault` and publishes it alongside the portfolio in
a single Pages artifact on every push to `main`.

To run the site under a different sub-path, change `BASE_PATH` in that workflow.
See [`next.config.js`](next.config.js) for how `basePath` is wired.
