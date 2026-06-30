/**
 * Brand and site-wide configuration.
 *
 * SITE_NAME is the single source of truth for the brand name. Change it here
 * once and it updates everywhere (metadata, navbar, footer, structured data
 * and so on).
 */
export const SITE_NAME = 'ERP Finance Pro';

export const SITE_TAGLINE =
  'The go-to resource for ERP and finance professionals';

export const SITE_DESCRIPTION =
  'Templates, report packs and practical guides that help ERP and finance professionals work faster and report cleaner. Built around Oracle Fusion, Excel and everyday finance operations.';

// Public URL of the deployed site (used for absolute URLs in metadata and sitemap).
export const SITE_URL = 'https://arshadhanif.github.io';

// Default Open Graph image (relative to basePath).
export const OG_IMAGE = '/og-image.svg';

// Privacy-friendly analytics. Nothing loads until this is filled in.
// - For Plausible: set provider to 'plausible' and domain to your site domain.
// - For Google Analytics 4: set provider to 'ga' and gaId to 'G-XXXXXXX'.
export const ANALYTICS: {
  provider: '' | 'plausible' | 'ga';
  domain: string;
  gaId: string;
} = {
  provider: 'ga',
  domain: 'arshadhanif.github.io',
  gaId: 'G-PX9FZD48E5',
};

// The person behind the brand. This shows up on the About page, not the
// homepage. The brand is the entity; this is the credibility behind it.
export const FOUNDER = {
  name: 'Arshad Hanif',
  title: 'Founder of ERP Finance Pro, Oracle Fusion Cloud consultant and ACCA member',
  location: 'Riyadh, Saudi Arabia',
  portfolioUrl: 'https://arshadhanif.github.io/',
  shortBio:
    'Arshad is an ACCA member and Oracle Fusion Cloud consultant with 7+ years delivering end-to-end ERP implementations and finance transformation for clients across the UAE, USA, Saudi Arabia, Canada, Australia and Pakistan. He started ERP Finance Pro to share the templates and know-how he uses on real projects.',
  credentials: [
    'ACCA member (Association of Chartered Certified Accountants)',
    'Oracle Financials Certified Foundations Associate',
    'Oracle Procurement Certified Foundations Associate',
    'Oracle SCM Certified Foundations Associate',
    'Oracle HCM Certified Foundations Associate',
    'Oracle Fusion Analytics Warehouse Certified Implementation Professional',
    'PwC alumnus (A.F. Ferguson & Co., PwC Pakistan)',
  ],
  expertise: [
    'Oracle Fusion Cloud ERP',
    'ERP implementation and go-live',
    'Finance transformation',
    'OTBI and BI Publisher reporting',
    'Financial modelling in Excel',
    'Xero and QuickBooks',
  ],
  email: 'arshadhanif1999@gmail.com',
};

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/arshad-hanif-acca-erp/',
  website: 'https://arshadhanif.github.io/',
  // Placeholder YouTube channel. Replace with the real handle once it exists.
  youtube: 'https://www.youtube.com/@erpfinancepro',
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
  { href: '/excel', label: 'Excel' },
  { href: '/resources', label: 'Resources' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

// Store launch state is now decided per product, not site-wide. A product goes
// live (real Gumroad checkout) as soon as it has a real gumroadUrl; see
// isLive() in lib/products.ts. Products still on a placeholder URL keep the
// "Notify me" waitlist button. This flag is kept only for reference and is no
// longer read anywhere in the app.
export const STORE_LIVE = false;

// Beehiiv subscribe form id (from the embed snippet). Used by the BeehiivForm
// component for all email capture across the site.
export const BEEHIIV_FORM_ID = '918006cc-0744-44ac-a374-75efce67f345';

// The headline free offer used to grow the email list. This is the thing the
// homepage and article pages point people to. Swap the file once it is ready.
export const LEAD_MAGNET = {
  title: "The ERP and Finance Starter Kit",
  description:
    'A free bundle to get a quick win this week: a one-page month-end close checklist, an OTBI subject area cheat sheet, and a set of Excel finance shortcuts.',
  fileUrl: '/downloads/erp-finance-starter-kit.pdf',
  format: 'PDF',
};
