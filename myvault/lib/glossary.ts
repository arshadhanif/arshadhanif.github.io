export interface GlossaryTerm {
  term: string;
  category: 'Oracle Fusion' | 'Reporting' | 'Finance' | 'Close';
  definition: string;
}

/**
 * Plain-language definitions of the Oracle Fusion, reporting and finance terms
 * that come up most. Kept here so the glossary page and structured data share
 * one source.
 */
export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Ledger', category: 'Oracle Fusion', definition: 'The book of account in Oracle Fusion that ties together a chart of accounts, accounting calendar, currency and accounting method. Most reporting questions start with which ledger you are in.' },
  { term: 'Legal Entity', category: 'Oracle Fusion', definition: 'A registered company recognised by law. In Fusion it sits between the ledger and the business units, and it is what files statutory accounts and tax.' },
  { term: 'Business Unit', category: 'Oracle Fusion', definition: 'An operational division that owns transactions such as payables, receivables and procurement. Filtering subledger reports by the right business unit (ORG_ID) is critical to getting correct numbers.' },
  { term: 'Chart of Accounts', category: 'Oracle Fusion', definition: 'The structure of segments (company, account, cost centre and so on) used to record every transaction. Its design drives what you can report on without extra work.' },
  { term: 'Value Set', category: 'Oracle Fusion', definition: 'The list of valid values a chart of accounts segment can take, for example the list of natural accounts. Value sets can carry extra attributes through a descriptive flexfield.' },
  { term: 'Descriptive Flexfield (DFF)', category: 'Oracle Fusion', definition: 'A configurable field that captures extra information without changing the data model. The Value Set Values DFF is the clean way to tag accounts with reporting attributes.' },
  { term: 'Corporate Book', category: 'Oracle Fusion', definition: 'The primary Fixed Assets book that depreciates assets for the main ledger. Reporting on assets means filtering to the corporate book (BOOK_TYPE_CODE) so figures do not double up with tax books.' },
  { term: 'Inventory Organization', category: 'Oracle Fusion', definition: 'The entity that holds and values stock. Receiving and inventory reporting filters on the inventory organization (ORGANIZATION_ID).' },
  { term: 'OTBI', category: 'Reporting', definition: 'Oracle Transactional Business Intelligence. The self-service reporting tool built on curated subject areas, used for ad hoc analyses and dashboards over live data.' },
  { term: 'Subject Area', category: 'Reporting', definition: 'A business-friendly, pre-joined view of data in OTBI. Picking the right subject area is most of the battle: the wrong one makes a simple report hard.' },
  { term: 'BI Publisher', category: 'Reporting', definition: 'Oracle’s pixel-perfect reporting tool, used for formatted statements, invoices and high-volume output driven by SQL data models and templates.' },
  { term: 'Data Model', category: 'Reporting', definition: 'In BI Publisher, the SQL and parameters that fetch the data a report renders. Filtering on the right keys here is what makes a report portable across instances.' },
  { term: 'Trial Balance', category: 'Finance', definition: 'A listing of every account with its debit or credit balance for a period. It must net to zero and is the starting point for the financial statements.' },
  { term: 'Accrual', category: 'Finance', definition: 'An entry that records revenue earned or costs incurred before the cash moves, so the period reflects what actually happened rather than what was paid.' },
  { term: 'Depreciation', category: 'Finance', definition: 'Spreading the cost of a fixed asset over its useful life. Common methods are straight line (equal each year) and reducing balance (a fixed rate on the falling book value).' },
  { term: 'Book Value', category: 'Finance', definition: 'An asset’s cost less accumulated depreciation. It is what the asset is carried at on the balance sheet, not what it would sell for.' },
  { term: 'Working Capital', category: 'Finance', definition: 'Current assets minus current liabilities. It measures the short-term liquidity a business has to fund day-to-day operations.' },
  { term: 'Current Ratio', category: 'Finance', definition: 'Current assets divided by current liabilities. A quick read on whether a business can cover its short-term obligations; above 1.0 is the usual baseline.' },
  { term: 'Quick Ratio', category: 'Finance', definition: 'Like the current ratio but excluding inventory, since stock can be slow to convert to cash. A stricter test of liquidity.' },
  { term: 'Gross Margin', category: 'Finance', definition: 'Revenue less cost of goods sold, as a percentage of revenue. It shows how much of each sale is left after direct costs.' },
  { term: 'EBITDA', category: 'Finance', definition: 'Earnings before interest, tax, depreciation and amortisation. A proxy for operating cash generation that strips out financing and accounting policy effects.' },
  { term: 'Amortization', category: 'Finance', definition: 'Spreading a cost or a loan balance over time. For loans and leases it is the schedule that splits each payment into interest and principal.' },
  { term: 'Month-end Close', category: 'Close', definition: 'The recurring process of finalising the books for a period: reconciling accounts, posting accruals, running depreciation and producing reports.' },
  { term: 'Reconciliation', category: 'Close', definition: 'Confirming that two sources agree, for example a control account against its subledger or the bank statement against the cash book, and explaining any difference.' },
  { term: 'Period Close', category: 'Close', definition: 'Formally closing an accounting period in the system so no further entries can be posted to it, locking the reported numbers.' },
  { term: 'Cut-off', category: 'Close', definition: 'Making sure transactions land in the correct period. Weak cut-off is a common reason reported results swing between months.' },
];

export const GLOSSARY_CATEGORIES = ['Oracle Fusion', 'Reporting', 'Finance', 'Close'] as const;
