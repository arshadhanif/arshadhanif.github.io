# MyVault

> **The go-to resource for ERP and finance professionals.**

A Next.js 14 finance & ERP resource brand — blog, store, services, and
newsletter — built as a fully static site for GitHub Pages.

> **`MyVault` is a placeholder name.** It lives in a single constant
> (`SITE_NAME` in [`lib/constants.ts`](lib/constants.ts)) so it can be
> renamed globally in one edit.

## Tech stack

- **Next.js 14** (App Router) with `output: 'export'` (static HTML)
- **Tailwind CSS** for styling
- **MDX** for blog posts (via `next-mdx-remote`)
- File-based content — **no database**

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

## Placeholders to replace before launch

- **`SITE_NAME`** in `lib/constants.ts` (currently `"MyVault"`)
- **Gumroad URLs** in `content/products.json`
- **Newsletter form** — `components/NewsletterSignup.tsx` is a local placeholder;
  wire it to your Mailchimp/Beehiiv embed
- **Social links** (`SOCIAL`) and **email** (`AUTHOR.email`) in `lib/constants.ts`

## Deployment (GitHub Pages)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the static
export and deploys it to GitHub Pages on every push to `main`. Enable
**Settings → Pages → Source: GitHub Actions** in the repo.

This repo is a **user** Pages site (served from the domain root), so `basePath`
is empty. To deploy under a sub-path (project page), set the `BASE_PATH` env var
(e.g. `BASE_PATH="/myvault"`) — see [`next.config.js`](next.config.js).
