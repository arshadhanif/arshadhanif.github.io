# OTBI subject area catalogue

Tooling for banking the Oracle Fusion OTBI presentation layer (subject area,
folder, column) into the `otbi_meta` schema of the `oracle-fusion-meta` Supabase
project (ref `ztmidhgqtqyzqkunbtbu`).

The instance tree is the source of truth. SOAP `describeSubjectArea` is dead on
the HNL Prod pod, and the Oracle database mapping workbooks give only a physical
column floor with no derived measures, so they are a cross-check, never the source.

## How a junior captures a subject area

1. In OTBI, create an analysis on the subject area.
2. Select every column of every presentation folder.
3. Open the Advanced tab and copy out **one** of these:
   * the **logical SQL** (preferred), or
   * the **analysis XML** (fallback, when the SQL is not available).
4. Save it as a `.txt` named after the subject area, and drop it in the Drive
   folder for that format ("OTBI Subject Area SQLs" or "OTBI Subject Area XMLs").

**Capture the XML.** It is the complete record. See "Which format to capture"
below for the evidence: the logical SQL silently omits presentation columns.

## Which format to capture

Capture the **XML**. Two subject areas were captured in both formats and banked
from each, which settled it.

| | Procurement Implemented Change Orders | Costing Cost Accounting Period Close |
| --- | --- | --- |
| XML columns | 413 | 475 |
| SQL columns | 411 | 458 |
| In XML only | 2 | 17 |
| In SQL only | 0 | 0 |

The SQL is a strict subset in both cases. Nothing appears in the SQL that the
XML misses, and the SQL loses 0.5% and 3.6% of the columns respectively.

Most of the loss has a clear mechanism. When a presentation column has a coded
and display pair, the logical SQL emits only the display column as a plain
projection and represents the code column as a `DESCRIPTOR_IDOF()` wrapper
around it. The code column's own name never appears, so it cannot be recovered
from the SQL. That accounts for 13 of the 19 missing columns, for example
`Ledger Category Code` next to `Ledger Category Name`, and
`Suspense Posting Allowed Flag` next to `Suspense Posting Allowed Flag Meaning`.
The other 6 are simply absent from the SQL with no wrapper to hint at them.

The loss is silent. The SQL parses cleanly with no unparsed lines and no
warning, so a SQL-only catalogue looks complete while quietly missing columns.
That is the deciding factor: a catalogue that is quietly wrong is worse than one
that lacks a convenience field.

What the XML costs: files are roughly twice the size (127 KB and 151 KB against
88 KB and 59 KB), and it carries no `column_kind` signals, so that field stays
null. Neither is a real obstacle. Banking time is driven by the column count,
not the format, and both formats parse with zero failures.

If kind flags are wanted for a given subject area later, capture its SQL as
well and bank it on top. The upsert preserves existing kinds and never deletes,
so the two captures compose without rework. That is exactly how the Procurement
and Costing rows reached their present state: columns from the XML, kind flags
from the SQL.

## Banking a capture

```
python3 bank_capture.py "Some Subject Area SQL.txt" --out ./sql --captured-by Uzair --verify
```

That writes one `.sql` file per capture. Run it against the database with psql,
or paste it into the Supabase SQL editor. The format is detected from the file
contents, so the same command handles both capture types.

Useful flags:

| Flag | Effect |
| --- | --- |
| `--out DIR` | write `.sql` files instead of printing to stdout |
| `--verify` | append the row count and md5 checksum query |
| `--captured-by NAME` | record who captured it |
| `--engagement NAME` | engagement tag (default `HNL`) |
| `--chunk N` | columns per INSERT statement (default 200) |
| `--include-hierarchies` | also bank presentation hierarchies (off by default) |
| `--format sql\|xml` | force a format instead of detecting it |

### Verifying a load

With `--verify`, the generated file ends with a query and the expected answer,
for example:

```
-- Verification. This must return 458 and 9098fd2894ba0845f623030166fd46f0.
```

The checksum covers every folder and column name character by character, so a
match means the banked rows are exactly the capture. The query uses
`collate "C"` on purpose: the database default collation sorts a leading `- `
differently from Python and would change the digest.

### Re-running is safe

Every statement upserts on the table's primary key, so re-banking a capture
updates rows instead of duplicating them. Nothing is ever deleted, so
hand-curated fields such as `database_object` and `database_column` survive a
re-run. The subject area row is only ever updated, never inserted, so the
seeded pillar and group cannot be overwritten with a guess from a filename. A
subject area that was never seeded fails loudly on the folder and column
foreign keys rather than banking orphan rows.

## What gets banked

`otbi_meta.otbi_subject_areas` (one row per subject area, all 348 pre-seeded)
: `capture_filename`, `folder_count`, `column_count`, `capture_status`,
  `captured_by` are refreshed from the capture.

`otbi_meta.otbi_folders` (subject_area, folder_name, engagement)
: `column_count` per folder.

`otbi_meta.otbi_columns` (subject_area, folder_name, column_name, engagement)
: `presentation_path` (`"Subject Area"."Folder"."Column"`), `ordinal` (position
  within its own folder), `source` (`advanced_sql` or `advanced_xml`),
  `column_kind`, `captured_by`.

### column_kind

Only the SQL capture carries kind signals:

| Value | Signal in the capture |
| --- | --- |
| `measure` | the column is `."Count"` |
| `coded` | the column is wrapped in `DESCRIPTOR_IDOF(...)`, so it has a coded and display pair |
| `sort` | the column is wrapped in `SORTKEY(...)` |
| null | a plain attribute, or an XML capture, which carries no signal |

### What is deliberately dropped

* Literal string totals (`'All'`, `'Total'`, `'Dim - ... Total'`).
* The `s_0` dummy `0` projection.
* `CASE WHEN ISLEAF(...)` leaf markers.
* Everything from `FROM`, `WHERE`, `ORDER BY` or `FETCH FIRST` onward, and the
  leading `SET VARIABLE` line.
* Formula columns in an XML capture (a `CASE`, a `SUM`, a saved calculation).
  These are analysis authoring, not presentation layer objects.
* Presentation hierarchies, unless `--include-hierarchies` is passed. Leaving
  them out is what makes the banked folder counts match Oracle's.

A parsing trap worth knowing: `IDOF(...)` references a four part hierarchy name,
for example `..."Supplier Site"."Supplier Sites"."Supplier Name"`. A regex over
every quoted triple in the file would read the hierarchy level as a folder, so
the parser matches whole anchored lines instead.

## Reading a capture out of Google Drive

A capture read through the Drive text representation comes back with markdown
escaping, so `s_1` arrives as `s\_1` and `<saw:report` as `\<saw:report`. Those
backslashes are not in the file. `bank_capture.py` strips them when it sees
them. To be certain of the raw bytes, download the file rather than reading its
text representation. No OTBI folder or column name in the captures banked so far
contains a backslash, a quote or a `~`.

## Banking a MetadataService extract

The manual capture route above is the fallback. The primary route is the
PowerShell extractor, which reads the presentation layer straight out of the
pod over the BI SOAP MetadataService and writes one CSV per window (zipped).

`load_api_extract.py` takes those files and has three modes:

```
summary FILE...                          validate and report, no database needed
prepare FILE... --source-key K --out DIR  write the table files plus load.sql
load    FILE... --source-key K            stream straight into the tables
```

`prepare` is the one to reach for when the extract is large. It does the
parsing, de-duplication and ordinal numbering once, then writes
`subject_areas.csv`, `folders.csv`, `columns.csv` and a `load.sql`. The load
itself is then three plain `COPY` statements, which `psql` can run from
anywhere:

```
cd DIR && psql "$SUPABASE_DB_URL" -f load.sql
```

Both `prepare` and `load` are idempotent per environment: the script deletes
that environment's subject areas first and lets the cascades clear the folders
and columns, so re-running replaces rather than duplicates.

The API does not return the pillar or the functional group, so the last step
carries those across from the archived snapshot schema for any subject area
whose name still matches.
