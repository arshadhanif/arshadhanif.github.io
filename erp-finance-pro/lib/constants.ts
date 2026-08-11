/**
 * Brand + site-wide configuration.
 *
 * SITE_NAME is the single source of truth for the brand. Change it here once
 * and it propagates everywhere (metadata, navbar, footer, structured data).
 */
export const SITE_NAME = 'ERP Finance Pro';

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
  whatsapp: '923332597950',
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
  { href: '/jobs', label: 'Jobs' },
  { href: '/store', label: 'Store' },
  { href: '/resources', label: 'Free Resources' },
  { href: '/services', label: 'Services' },
  { href: '/for-teams', label: 'For Teams' },
  { href: '/about', label: 'About' },
];

// Homepage FAQ — chosen to match real search queries (SEO) and answer the
// questions prospective clients and career-switchers actually ask.
export const HOMEPAGE_FAQ = [
  {
    question: 'What does an Oracle Fusion consultant actually do?',
    answer:
      'An Oracle Fusion consultant helps organisations implement, configure, and get real value from Oracle Fusion Cloud — mapping business processes to the system, setting up the enterprise structure and modules like Financials and Procurement, building reports, and fixing issues after go-live. My work centres on Oracle Fusion Financials, where finance knowledge and system expertise meet.',
  },
  {
    question: 'How do I move from finance or accounting into ERP consulting?',
    answer:
      'If you have a finance or accounting background, you are closer than you think. The path is: pick a platform and specialise (Oracle Fusion Financials is a natural fit for finance people), build hands-on configuration skills in a training environment, get certified, and land your first implementation. I cover the full roadmap in the blog and offer one-to-one career coaching to shortcut it.',
  },
  {
    question: 'Do I need an Oracle certification to get hired?',
    answer:
      'Certification is not strictly required, but it opens doors and gets you past procurement filters on client bids. An Oracle certification paired with a finance qualification like ACCA is a powerful combination — it signals both the technical "what" and the accounting "why" that clients pay for.',
  },
  {
    question: "What's the difference between OTBI and BI Publisher?",
    answer:
      'OTBI (Oracle Transactional Business Intelligence) is for fast, live exploration — build an analysis directly on Fusion data in minutes, no extract needed. BI Publisher is for pixel-perfect, printable, formal documents. The rule of thumb: OTBI for answering your own questions quickly, BIP for reports that leave the building.',
  },
  {
    question: 'How long does an Oracle Fusion implementation take?',
    answer:
      'It depends on scope, number of modules, and how many legal entities and business units are involved. A focused single-entity Financials rollout can go live in a few months; a multi-entity, multi-module programme runs longer. The biggest driver is not the software — it is decision-making speed and data readiness on the client side.',
  },
  {
    question: 'Can you help with a specific Oracle Fusion problem or report?',
    answer:
      'Yes. Beyond full implementations, I take focused advisory calls to work through a single reporting problem, a configuration question, or an ERP decision — you walk away with a clear, actionable plan. Book an advisory call from the Services page.',
  },
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
