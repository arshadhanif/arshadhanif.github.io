/**
 * Brand and site-wide configuration.
 *
 * SITE_NAME is the single source of truth. "MyVault" is a placeholder, so
 * change it here once and it updates everywhere (metadata, navbar, footer,
 * structured data and so on).
 */
export const SITE_NAME = 'MyVault';

export const SITE_TAGLINE =
  'The go-to resource for ERP and finance professionals';

export const SITE_DESCRIPTION =
  'Templates, report packs and practical guides that help ERP and finance professionals work faster and report cleaner. Built around Oracle Fusion, Excel and everyday finance operations.';

// Public URL of the deployed site (used for absolute URLs in metadata and sitemap).
export const SITE_URL = 'https://arshadhanif.github.io';

// Default Open Graph image (relative to basePath).
export const OG_IMAGE = '/og-image.svg';

// The person behind the brand. This shows up on the About page, not the
// homepage. MyVault is the entity; this is the credibility behind it.
export const FOUNDER = {
  name: 'Arshad Hanif',
  title: 'Founder of MyVault, Oracle Fusion consultant',
  shortBio:
    'Arshad is an Oracle Fusion consultant and ACCA-qualified finance professional. He started MyVault to put the templates and know-how he uses on real projects into the hands of other finance and ERP people.',
  credentials: [
    'Oracle Fusion Financials certified consultant',
    'ACCA-qualified finance professional',
    'Part of the PwC professional network',
    'Has delivered ERP work for 13+ clients across industries',
  ],
  email: 'arshadhanif1999@gmail.com',
};

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/arshadhanif',
  github: 'https://github.com/arshadhanif',
};

// Blog categories (used for filter tags and badge styling).
export const BLOG_CATEGORIES = [
  'Oracle Fusion',
  'Excel',
  'ERP Strategy',
  'Career',
  'Tools',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

// Store categories.
export const PRODUCT_CATEGORIES = [
  'Templates',
  'Report Packages',
  'Document Packs',
  'Courses',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const NAV_LINKS = [
  { href: '/blog', label: 'Articles' },
  { href: '/store', label: 'Store' },
  { href: '/resources', label: 'Free Resources' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

// The headline free offer used to grow the email list. This is the thing the
// homepage and article pages point people to. Swap the file once it is ready.
export const LEAD_MAGNET = {
  title: "The ERP and Finance Starter Kit",
  description:
    'A free bundle to get a quick win this week: a one-page month-end close checklist, an OTBI subject area cheat sheet, and a set of Excel finance shortcuts.',
  fileUrl: '/downloads/erp-finance-starter-kit.pdf',
  format: 'PDF',
};
