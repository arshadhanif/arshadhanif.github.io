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

Pending. To be run on `Costing - Cost Accounting Real Time SQL.txt` (212,707
bytes) and recorded here in the same shape, then diffed against run 1.

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

## Standing conclusion

From the earlier paired comparison on two other subject areas, the logical SQL
was a strict subset of the XML: 411 columns against 413, and 458 against 475,
with nothing in the SQL that the XML lacked. Since both files come from one
saved analysis with everything selected, the SQL is dropping real presentation
columns. Most are the code half of a coded and display pair, which the SQL
folds into a `DESCRIPTOR_IDOF()` wrapper so the name is unrecoverable.

Capture the XML.
