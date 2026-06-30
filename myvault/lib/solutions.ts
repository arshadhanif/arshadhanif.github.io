/**
 * Solution landing pages: evergreen hubs that target high-intent searches and
 * pull together the relevant articles, products and resources in one place.
 */
export interface Solution {
  slug: string;
  title: string;
  metaTitle: string;
  intro: string;
  body: string[];
  articleSlugs: string[];
  productTag: string;
  resourceIds: string[];
  toolHref?: string;
}

export const SOLUTIONS: Solution[] = [
  {
    slug: 'oracle-fusion-reporting',
    title: 'Oracle Fusion Reporting',
    metaTitle: 'Oracle Fusion Reporting: OTBI, BI Publisher and the Data Behind It',
    intro:
      'Everything you need to report confidently on Oracle Fusion: how the data is structured, where to start in OTBI, and ready-made report packs that work across instances.',
    body: [
      'Reporting on Oracle Fusion goes wrong in predictable ways: queries that pull the wrong entity, counts that double because a book filter was missed, and reports that only work on the instance they were built on. The fix is understanding the enterprise structure first, then building on portable parameters.',
      'The articles below cover the foundations, and the report packs give you a working baseline across GL, AP, AR and FA without starting from a blank page.',
    ],
    articleSlugs: [
      'oracle-fusion-enterprise-structure',
      'getting-started-with-oracle-fusion-otbi',
      'oracle-fusion-value-set-dff-budget-attributes',
    ],
    productTag: 'Reporting',
    resourceIds: ['enterprise-structure-query', 'otbi-subject-area-cheatsheet'],
  },
  {
    slug: 'excel-for-finance',
    title: 'Excel for Finance',
    metaTitle: 'Excel for Finance: Templates, Formulas and a Free Generator',
    intro:
      'The Excel side of finance work, done properly: the formulas that matter, ready-to-use templates, and a free tool that builds the formulas for you.',
    body: [
      'Most finance Excel work is the same handful of patterns repeated: lookups, conditional sums, period-end dates, clean error handling, and dashboards that update themselves. Learn those well and start from templates that already work, and you save hours every month.',
      'Start with the free formula generator, read the formula guide, then pick up the templates that fit your work.',
    ],
    articleSlugs: ['excel-formulas-every-finance-pro-should-know'],
    productTag: 'Excel',
    resourceIds: ['excel-finance-shortcuts'],
    toolHref: '/tools/excel-formula-generator',
  },
  {
    slug: 'month-end-close',
    title: 'Month-End Close',
    metaTitle: 'Month-End Close: Checklists, Trackers and the Year-End Rollover',
    intro:
      'Make the close a controlled, repeatable routine: a tracker to run it, reconciliation templates to evidence it, and a checklist for the fiscal year rollover.',
    body: [
      'A clean close is about process, not heroics. A clear task list with owners and dependencies, reconciliations that tie out, and a year-end rollover that nobody has to scramble through. The tools and guide below cover all three.',
    ],
    articleSlugs: ['oracle-fusion-new-year-setup-checklist'],
    productTag: 'Finance',
    resourceIds: ['period-close-guide', 'month-end-close-checklist-lite', 'new-year-setup-checklist'],
  },
];

export function getSolution(slug: string): Solution | null {
  return SOLUTIONS.find((s) => s.slug === slug) ?? null;
}
