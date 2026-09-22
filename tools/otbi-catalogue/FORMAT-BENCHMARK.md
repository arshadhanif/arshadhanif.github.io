# XML vs SQL capture: measured comparison

A controlled comparison of the two capture formats, run on identical input.
Both formats are exported from the same saved OTBI analysis in one sitting,
selecting all columns with Ctrl+A, so the two files describe exactly the same
column selection. That rules out selection drift as an explanation for any
difference between them.

## Run 1: XML, "Costing - Cost Accounting Real Time"

File: `Costing - Cost Accounting Real Time XML.txt`, 524,847 bytes
Date: 2026-09-22

| Measure | Value |
| --- | --- |
| Folders found | 135 |
| Columns found | 1,497 |
| Presentation hierarchies | 18 (skipped by default) |
| Duplicate selections dropped | 0 |
| Lines the parser could not read | 0 |
| Decode and save | 0.005 s |
| Parse | 0.036 s |
| Compute total | **0.041 s** |
| Drive round trips | 1 |
| Bytes over the wire (base64) | 699,929 |
| Wall clock, start to parsed | 16.3 s |

Column set checksum: `96f48214565a55eb8027df64fda54769`
(md5 over the sorted `folder~column` pairs, so it is independent of ordering.)

## Run 2: SQL, same subject area

File: `Costing - Cost Accounting Real Time SQL.txt`, 212,707 bytes
Date: 2026-09-22

| Measure | XML (run 1) | SQL (run 2) |
| --- | --- | --- |
| Folders found | 135 | 135 |
| Columns found | **1,497** | 1,453 |
| Presentation hierarchies | 18 | 18 |
| Duplicate selections dropped | 0 | 0 |
| Lines the parser could not read | 0 | 0 |
| Column kind flags recovered | 0 | **297** (290 coded, 7 sort) |
| Decode and save | 0.005 s | 0.003 s |
| Parse | 0.036 s | 0.009 s |
| Compute total | 0.041 s | **0.012 s** |
| Drive round trips | 1 | 1 |
| Wall clock, start to parsed | 16.3 s | 12.0 s |

SQL column set checksum: `b63a4bd19862c084aefe649783e05b35`

### The diff

| | |
| --- | --- |
| In the XML only | **44 columns** |
| In the SQL only | **0 columns** |
| Loss rate | 2.94% of the XML column set |
| Folders affected | 30 of 135 |
| Explained by a coded and display pair | 28 of 44 (64%) |

The remaining 16 are absent outright, with no wrapper in the SQL to hint that
they exist: `Inventory Item`, `Item Transactable`, `Task Key`,
`Enabled Flag` and `Summary Flag` on both GL Account folders,
`Billable Flag` and `Capitalizable Flag` on Task Indicator Attributes, and
others.

## Results across all three paired subject areas

| Subject area | XML | SQL | Missing from SQL | In SQL only |
| --- | --- | --- | --- | --- |
| Procurement Implemented Change Orders Real Time | 413 | 411 | 2 | 0 |
| Costing Cost Accounting Period Close Real Time | 475 | 458 | 17 | 0 |
| Costing Cost Accounting Real Time | 1,497 | 1,453 | 44 | 0 |
| **Total** | **2,385** | **2,322** | **63** | **0** |

Three for three, the SQL is a strict subset. Across 2,385 columns it has never
once found something the XML missed, and it has dropped 63.

## Verdict

**The speed question is settled and it does not matter.** The SQL parses 3.4
times faster, which on the largest capture so far means 29 milliseconds. The
wall clock difference of about 4 seconds is round trip latency, not work. The
real cost is banking the rows, which scales with the column count, so the XML
is marginally *more* work precisely because it finds more.

**The completeness question is settled and it decides the matter.** Since both
files come from one saved analysis with Ctrl+A, the 63 missing columns are not
selection drift. The logical SQL simply does not emit them.

**Capture the XML.** It is the only one of the two that is complete.

**If capturing both is cheap, capture both.** The second export is one more
copy and paste on the same page, and the SQL is worth having for one reason:
it recovers column kind flags the XML cannot express. It found 297 on this
subject area alone. Bank the XML first as the spine, then bank the SQL on top.
The upsert preserves existing kinds and never deletes, so the two compose with
no rework. That is how the Procurement and Costing Period Close rows already
reached their present state.

## Lessons so far

**Parsing is not the bottleneck and never will be.** 1,497 columns parsed in 36
milliseconds. Even if the SQL parses twice as fast, it saves 18 milliseconds.
Any argument for one format over the other on "speed of reading" is measuring a
rounding error.

**The real cost is banking, and it scales with the column count.** Loading rows
into Supabase is the slow part, and it is proportional to how many columns the
capture yields. The XML finds more columns, so the XML is slightly *more* work
to bank. Completeness and speed pull in opposite directions here, and it is
worth being explicit that they do.

**The parser did not need changing for a file 2.3 times larger than anything
before it.** 525 KB, 135 folders, 1,497 columns, zero unparsed lines, zero
duplicates. No new XML constructs appeared at this size, which is a good
robustness signal.

**Large captures spill to disk rather than into the conversation.** At 525 KB
the download exceeded the inline result limit and was written to a file
instead. That is what makes captures this size practical to handle at all, and
it means file size has little effect on the real cost.

**The raw file contains no backslashes.** Backslashes seen in a capture, such
as `JE\_POZ\_SUPPLIERS\_`, come from the Drive text rendering escaping markdown,
not from Oracle. The parser strips them when present.

## Background: the earlier paired comparison

From the earlier paired comparison on two other subject areas, the logical SQL
was a strict subset of the XML: 411 columns against 413, and 458 against 475,
with nothing in the SQL that the XML lacked. Since both files come from one
saved analysis with everything selected, the SQL is dropping real presentation
columns. Most are the code half of a coded and display pair, which the SQL
folds into a `DESCRIPTOR_IDOF()` wrapper so the name is unrecoverable.

Capture the XML.
