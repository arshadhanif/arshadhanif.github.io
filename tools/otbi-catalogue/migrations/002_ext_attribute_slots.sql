-- ============================================================================
-- Record unconfigured extension attribute slots as a count, not as rows.
--
-- The Production extract returns 1,124,239 hidden columns named
-- "Extension Attribute <Type> <NNN>". These are the empty DFF slots Oracle
-- ships with every CRM object, roughly 975 per folder across 1,176 folders.
-- None of them is configured: every one that carries a description carries
-- the raw internal token (for example ActivityPVO_EXTNATTRIBUTECLOB001_LABEL)
-- rather than a business label, and not one appears as a visible column.
--
-- Banking them as rows would take otbi_columns from 449,491 rows to
-- 1,573,730 and the database past the plan's disk limit, for no information
-- a consultant can use. So the loader sets them aside and records how many
-- each folder has here. If a slot is ever configured it stops matching the
-- placeholder shape and arrives as an ordinary column in the next extract.
--
-- column_count, visible_column_count and hidden_column_count therefore count
-- banked columns only. ext_attribute_slots is the count that was set aside.
-- ============================================================================

alter table otbi_meta.otbi_folders
  add column if not exists ext_attribute_slots integer not null default 0;

alter table otbi_meta.otbi_subject_areas
  add column if not exists ext_attribute_slots integer not null default 0;

alter table otbi_meta.otbi_sources
  add column if not exists ext_attribute_slot_count integer;

comment on column otbi_meta.otbi_folders.ext_attribute_slots is
  'Unconfigured "Extension Attribute <Type> <NNN>" slots in this folder. Counted, not banked as rows.';
comment on column otbi_meta.otbi_subject_areas.ext_attribute_slots is
  'Sum of otbi_folders.ext_attribute_slots across this subject area.';
comment on column otbi_meta.otbi_sources.ext_attribute_slot_count is
  'Placeholder columns the extract returned that were counted rather than banked.';
