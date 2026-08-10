/**
 * Brand + site-wide configuration.
 *
 * SITE_NAME is intentionally a single source of truth. "MyVault" is a
 * placeholder — change it here once and it propagates everywhere (metadata,
 * navbar, footer, structured data, etc.).
 */
export const SITE_NAME = 'MyVault';

export const SITE_TAGLINE =
  'The go-to resource for ERP and finance professionals';

export const SITE_DESCRIPTION =
  'Premium templates, report packages, and expert guidance for Oracle Fusion, Excel, and ERP finance professionals — curated by an Oracle Fusion consultant.';

// Public URL of the deployed site (used for absolute URLs in metadata + sitemap).
export const SITE_URL = 'https://arshadhanif.github.io';

// Default Open Graph image (relative to basePath).
export const OG_IMAGE = '/og-image.svg';

export const AUTHOR = {
  name: 'Arshad Hanif',
  title: 'Oracle Fusion Consultant',
  bio: 'Oracle Fusion consultant and finance professional. ACCA, Oracle certified, and part of the PwC network — helping 13+ clients streamline their ERP and finance operations.',
  email: 'arshadhanif1999@gmail.com',
};

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/arshadhanif',
  github: 'https://github.com/arshadhanif',
};

/**
 * Contact details.
 * whatsapp: international number with country code, no +, spaces, or dashes.
 * e.g. UK → '447911123456', Pakistan → '923001234567'
 * Update this one value and the WhatsApp button picks it up everywhere.
 */
export const CONTACT = {
  email: 'arshadhanif1999@gmail.com',
  // TODO: replace with your real WhatsApp number
  whatsapp: '923001234567',
  whatsappMessage:
    "Hi Arshad, I found your website and I'd like to enquire about your services.",
};

/** Homepage trust stats — shown in the stats bar below the hero. */
export const HOMEPAGE_STATS = [
  { value: '13+', label: 'Clients served' },
  { value: '6+', label: 'Industries covered' },
  { value: 'ACCA', label: 'Qualified' },
  { value: 'Oracle', label: 'Certified' },
];

// Blog categories (used for filter tags + badge styling).
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
  { href: '/blog', label: 'Blog' },
  { href: '/store', label: 'Store' },
  { href: '/resources', label: 'Free Resources' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

// The headline lead magnet — the free offer used to grow the email list.
// Swap the title/file once the real guide exists.
export const LEAD_MAGNET = {
  title: "The ERP Finance Professional's Toolkit",
  description:
    'A free starter kit: a month-end close checklist, an OTBI reporting cheat sheet, and a finance dashboard template — everything to get a quick win this week.',
  // Placeholder download (served from /public). Replace with the real asset.
  fileUrl: '/downloads/erp-finance-toolkit.pdf',
};
