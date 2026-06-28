'use client';

import { useMemo, useState } from 'react';

interface Field {
  name: string;
  label: string;
  placeholder: string;
  default: string;
}

interface Task {
  key: string;
  label: string;
  blurb: string;
  fields: Field[];
  build: (v: Record<string, string>) => string;
  explain: (v: Record<string, string>) => string;
}

const TASKS: Task[] = [
  {
    key: 'xlookup',
    label: 'Look up a value (XLOOKUP)',
    blurb: 'Find a value in one column and return the matching value from another.',
    fields: [
      { name: 'lookupValue', label: 'Look up this', placeholder: 'A2', default: 'A2' },
      { name: 'lookupArray', label: 'In this column', placeholder: 'Sheet2!A:A', default: 'Sheet2!A:A' },
      { name: 'returnArray', label: 'Return from this column', placeholder: 'Sheet2!B:B', default: 'Sheet2!B:B' },
    ],
    build: (v) =>
      `=XLOOKUP(${v.lookupValue}, ${v.lookupArray}, ${v.returnArray}, "Not found")`,
    explain: () =>
      'XLOOKUP is the modern lookup. It can look left or right and returns "Not found" instead of an error when there is no match.',
  },
  {
    key: 'vlookup',
    label: 'Look up a value (VLOOKUP)',
    blurb: 'Classic lookup for older workbooks that do not have XLOOKUP.',
    fields: [
      { name: 'lookupValue', label: 'Look up this', placeholder: 'A2', default: 'A2' },
      { name: 'tableRange', label: 'In this table', placeholder: 'Sheet2!A:D', default: 'Sheet2!A:D' },
      { name: 'colIndex', label: 'Return column number', placeholder: '2', default: '2' },
    ],
    build: (v) => `=VLOOKUP(${v.lookupValue}, ${v.tableRange}, ${v.colIndex}, FALSE)`,
    explain: () =>
      'FALSE forces an exact match, which is almost always what you want in finance.',
  },
  {
    key: 'sumifs',
    label: 'Sum with conditions (SUMIFS)',
    blurb: 'Total a column where one or more conditions are met.',
    fields: [
      { name: 'sumRange', label: 'Sum this column', placeholder: 'C:C', default: 'C:C' },
      { name: 'critRange', label: 'Where this column', placeholder: 'A:A', default: 'A:A' },
      { name: 'criterion', label: 'Matches this', placeholder: '"North" or B2', default: '"North"' },
    ],
    build: (v) => `=SUMIFS(${v.sumRange}, ${v.critRange}, ${v.criterion})`,
    explain: () =>
      'Put text criteria in quotes ("North"). For a cell reference use it without quotes (B2). Add more range/criteria pairs for extra conditions.',
  },
  {
    key: 'countifs',
    label: 'Count with conditions (COUNTIFS)',
    blurb: 'Count rows where one or more conditions are met.',
    fields: [
      { name: 'critRange', label: 'Count where this column', placeholder: 'A:A', default: 'A:A' },
      { name: 'criterion', label: 'Matches this', placeholder: '"Open" or B2', default: '"Open"' },
    ],
    build: (v) => `=COUNTIFS(${v.critRange}, ${v.criterion})`,
    explain: () => 'Text criteria go in quotes. Cell references go without quotes.',
  },
  {
    key: 'averageifs',
    label: 'Average with conditions (AVERAGEIFS)',
    blurb: 'Average a column where conditions are met.',
    fields: [
      { name: 'avgRange', label: 'Average this column', placeholder: 'C:C', default: 'C:C' },
      { name: 'critRange', label: 'Where this column', placeholder: 'A:A', default: 'A:A' },
      { name: 'criterion', label: 'Matches this', placeholder: '"North" or B2', default: '"North"' },
    ],
    build: (v) => `=AVERAGEIFS(${v.avgRange}, ${v.critRange}, ${v.criterion})`,
    explain: () => 'Same rules as SUMIFS for quoting text vs cell references.',
  },
  {
    key: 'iferror',
    label: 'Hide errors (IFERROR)',
    blurb: 'Wrap a fragile formula so it shows a clean value instead of an error.',
    fields: [
      { name: 'formula', label: 'Your formula (without the =)', placeholder: 'A2/B2', default: 'A2/B2' },
      { name: 'fallback', label: 'Show this on error', placeholder: '0', default: '0' },
    ],
    build: (v) => `=IFERROR(${v.formula}, ${v.fallback})`,
    explain: () =>
      'Great for dashboards: a divide-by-zero or missing lookup shows your fallback instead of #DIV/0! or #N/A.',
  },
  {
    key: 'eomonth',
    label: 'Month-end date (EOMONTH)',
    blurb: 'Get the last day of the month for any date.',
    fields: [
      { name: 'date', label: 'Start date', placeholder: 'A2', default: 'A2' },
      { name: 'monthsAhead', label: 'Months ahead (0 = this month)', placeholder: '0', default: '0' },
    ],
    build: (v) => `=EOMONTH(${v.date}, ${v.monthsAhead})`,
    explain: () =>
      'Use 0 for the current month-end, 1 for next month, -1 for last month. The backbone of any close calendar.',
  },
  {
    key: 'pctchange',
    label: 'Percentage change',
    blurb: 'Variance between a new and an old value, as a percentage.',
    fields: [
      { name: 'newValue', label: 'New value', placeholder: 'B2', default: 'B2' },
      { name: 'oldValue', label: 'Old value', placeholder: 'A2', default: 'A2' },
    ],
    build: (v) => `=IFERROR((${v.newValue}-${v.oldValue})/${v.oldValue}, "")`,
    explain: () =>
      'Format the cell as a percentage. The IFERROR keeps it clean when the old value is zero or blank.',
  },
  {
    key: 'text',
    label: 'Format a number as text (TEXT)',
    blurb: 'Turn a number or date into formatted text, for titles and labels.',
    fields: [
      { name: 'value', label: 'Value', placeholder: 'A2', default: 'A2' },
      { name: 'format', label: 'Number format', placeholder: '#,##0.00', default: '#,##0.00' },
    ],
    build: (v) => `=TEXT(${v.value}, "${v.format}")`,
    explain: () =>
      'Examples: "#,##0" for thousands, "0.0%" for a percentage, "mmm yyyy" for a month label.',
  },
];

export default function ExcelFormulaGenerator() {
  const [taskKey, setTaskKey] = useState(TASKS[0].key);
  const task = TASKS.find((t) => t.key === taskKey)!;

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(task.fields.map((f) => [f.name, f.default]))
  );
  const [copied, setCopied] = useState(false);

  function selectTask(key: string) {
    const t = TASKS.find((x) => x.key === key)!;
    setTaskKey(key);
    setValues(Object.fromEntries(t.fields.map((f) => [f.name, f.default])));
    setCopied(false);
  }

  const formula = useMemo(() => task.build(values), [task, values]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(formula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <label htmlFor="task" className="block text-sm font-medium text-muted">
        What do you want to do?
      </label>
      <select
        id="task"
        value={taskKey}
        onChange={(e) => selectTask(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {TASKS.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-muted">{task.blurb}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {task.fields.map((f) => (
          <div key={f.name}>
            <label
              htmlFor={f.name}
              className="block text-sm font-medium text-foreground/90"
            >
              {f.label}
            </label>
            <input
              id={f.name}
              type="text"
              value={values[f.name] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
              }
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Your formula</span>
          <button
            type="button"
            onClick={copy}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent-dim"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background p-4 text-sm">
          <code className="text-accent">{formula}</code>
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-muted">{task.explain(values)}</p>
      </div>
    </div>
  );
}
