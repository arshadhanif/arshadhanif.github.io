# 5-Day Oracle Fusion Reporting Crash Course

A free email course delivered through Beehiiv. It nurtures new subscribers,
shows your expertise, and drives traffic back to the articles, resources, and
store on ERP Finance Pro.

## How it runs in Beehiiv

Create an automation named **5-Day Oracle Fusion Reporting Crash Course**,
triggered on **signup**, with this shape:

1. Wait 1 day (so the welcome email and starter kit land first)
2. Send Email 1
3. Wait 1 day, Send Email 2
4. Wait 1 day, Send Email 3
5. Wait 1 day, Send Email 4
6. Wait 1 day, Send Email 5

Then publish the automation. (Claude will build this automatically once the
Beehiiv MCP tools are reachable.)

---

## Email 1

**Subject:** Day 1: read any Oracle Fusion instance in minutes

**Preview text:** The one query that maps the whole enterprise structure.

**Body:**

Welcome to the crash course. Over the next five days you will go from staring at
an unfamiliar Oracle Fusion instance to pulling clean, portable reports out of
it.

Day 1 is the foundation: the enterprise structure. Almost every reporting error
traces back to it. Query the wrong business unit and you get the wrong invoices.
Miss the corporate book filter and your asset counts double. Join to a secondary
ledger and balances duplicate.

The fix is to map the structure first: ledgers, legal entities, business units,
Fixed Assets books, and inventory organisations, and how they connect.

There is a single validated query that pulls all of it in one run. Read the
walkthrough and grab the query here:

- Article: https://arshadhanif.github.io/myvault/blog/oracle-fusion-enterprise-structure/
- Download the SQL: https://arshadhanif.github.io/myvault/downloads/oracle-fusion-enterprise-structure-query.sql

Today's action: run it on an instance you have access to and save the output as
your reference sheet. Tomorrow we use it.

From everyone at ERP Finance Pro

---

## Email 2

**Subject:** Day 2: stop guessing where to start in OTBI

**Preview text:** Subject areas, and the ones finance reaches for most.

**Body:**

Yesterday you mapped the structure. Today you start reporting.

OTBI revolves around subject areas: curated, business-friendly views of the
data. Ninety percent of OTBI frustration comes from starting in the wrong one.
Pick the right subject area and a trial balance is a few drag-and-drops away.

Here is the practical mental model and a simple first analysis:

- Article: https://arshadhanif.github.io/myvault/blog/getting-started-with-oracle-fusion-otbi/
- Cheat sheet of the subject areas finance uses most: https://arshadhanif.github.io/myvault/resources/

Today's action: build one analysis on the General Ledger Transactional Balances
subject area and filter it to the current period. That is a working trial
balance, live.

From everyone at ERP Finance Pro

---

## Email 3

**Subject:** Day 3: reports that work on every instance

**Preview text:** Filter by the right keys, not hardcoded IDs.

**Body:**

The most common reason a report breaks when you move it is hardcoded values:
an ORG_ID or a book code baked into the query that only exists on one instance.

The fix is to filter by the keys from your enterprise structure sheet, and to
make them runtime parameters. A quick map:

- GL journals: filter on LEDGER_ID
- AP, AR, Procurement, Expenses: filter on ORG_ID (the business unit)
- Fixed Assets: filter on BOOK_TYPE_CODE (the corporate book)
- Receivings and Inventory: filter on ORGANIZATION_ID (the inventory org)

Build a report on parameters that read from the enterprise structure, and the
same report runs on a single-entity client in Riyadh and a multi-entity group
anywhere else, with no rework.

Full detail and the query are in Day 1's article:
https://arshadhanif.github.io/myvault/blog/oracle-fusion-enterprise-structure/

Today's action: take one report you have and replace any hardcoded ID with a
parameter.

From everyone at ERP Finance Pro

---

## Email 4

**Subject:** Day 4: tag accounts for budget reporting

**Preview text:** The Value Set Values DFF, done the clean way.

**Body:**

Reporting often needs an attribute that belongs to the account, not the
transaction: a budget category, a reporting group. Put it on the transaction and
people classify the same account differently across entries. Put it on the
segment value and it is set once and inherited everywhere.

Oracle gives you the Value Set Values DFF for exactly this. It feeds OTBI
directly once deployed. Two things cost people time: the context code must equal
the value set code exactly, and the import column header must be the API name of
the segment, not the prompt name.

The full walkthrough, including the bulk upload format and the gotchas:
https://arshadhanif.github.io/myvault/blog/oracle-fusion-value-set-dff-budget-attributes/

Today's action: pick one segment (say Natural Account) and sketch the two or
three attributes you would tag it with.

From everyone at ERP Finance Pro

---

## Email 5

**Subject:** Day 5: from here

**Preview text:** You have the foundations. Here is where to go next.

**Body:**

That is the crash course. In five days you have covered how to read any Fusion
instance, where to start in OTBI, how to make reports portable, and how to add
reporting attributes cleanly. That is most of what separates slow, error-prone
reporting from fast, reliable reporting.

If you want a head start rather than building from scratch, two things will save
you the most time:

- The Oracle Fusion reporting hub, with the report packs across GL, AP, AR and
  FA: https://arshadhanif.github.io/myvault/solutions/oracle-fusion-reporting/
- The store, for the OTBI and BI Publisher report packs:
  https://arshadhanif.github.io/myvault/store/

And if you would rather have an expert on the problem with you, the advisory and
consulting options are here:
https://arshadhanif.github.io/myvault/services/

Thanks for spending the week with me. Just reply if you have a question, I read
every one.

From everyone at ERP Finance Pro
