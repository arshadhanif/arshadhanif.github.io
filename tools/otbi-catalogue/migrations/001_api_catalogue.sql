-- ============================================================================
-- OTBI catalogue: provenance registry and the MetadataService extract
--
-- Three sources describe the OTBI presentation layer and none of them
-- replaces the others:
--
--   metadata_api      what a given pod actually exposes right now, with data
--                     types, aggregation rules, hidden flags and descriptions
--   instance_capture  the manual Advanced XML and SQL captures
--   oracle_mapping    Oracle's release workbooks, the only source of the
--                     physical table and column behind a presentation column
--
-- They are kept apart on purpose. Merging them would destroy the signal that
-- started this exercise: a column present in the instance but absent from
-- Oracle's documentation.
-- ============================================================================

create table if not exists otbi_meta.otbi_sources (
  source_key          text primary key,
  source_type         text not null
                      check (source_type in ('metadata_api','instance_capture','oracle_mapping')),
  environment         text,                 -- HNLPROD, HNLTEST; null for release documents
  release             text,                 -- e.g. 'R13 26B' for Oracle workbooks
  title               text,
  file_name           text,
  captured_by         text,
  captured_at         timestamptz,
  subject_area_count  integer,
  folder_count        integer,
  column_count        integer,
  notes               text,
  created_at          timestamptz default now()
);

comment on table otbi_meta.otbi_sources is
  'One row per extract. Every catalogue row points back to the thing it came from.';

-- ---------------------------------------------------------------------------
-- The MetadataService extract. One row per column, per source.
-- ---------------------------------------------------------------------------
create table if not exists otbi_meta.otbi_api_columns (
  source_key      text not null references otbi_meta.otbi_sources(source_key) on delete cascade,
  environment     text not null,
  subject_area    text not null,
  folder_name     text not null,
  parent_folder   text,                     -- Oracle's own nesting, not inferred from "- " prefixes
  folder_hidden   boolean,
  column_name     text not null,
  display_name    text,
  description     text,                     -- Oracle's description, available nowhere else
  data_type       text,                     -- varchar, double, date, timestamp, integer, ...
  aggregatable    boolean,                  -- true marks a real measure
  aggr_rule       text,                     -- sum, complex, none
  hidden          boolean,                  -- true = invisible in the UI tree
  loaded_at       timestamptz default now(),
  primary key (source_key, subject_area, folder_name, column_name)
);

create index if not exists otbi_api_columns_sa_idx
  on otbi_meta.otbi_api_columns (subject_area, folder_name);
create index if not exists otbi_api_columns_col_idx
  on otbi_meta.otbi_api_columns (column_name);
create index if not exists otbi_api_columns_env_idx
  on otbi_meta.otbi_api_columns (environment, subject_area);
create index if not exists otbi_api_columns_measure_idx
  on otbi_meta.otbi_api_columns (subject_area) where aggregatable;

-- ---------------------------------------------------------------------------
-- Oracle's release workbooks. One presentation column maps to MANY physical
-- columns, so this is deliberately a separate, finer-grained table.
-- ---------------------------------------------------------------------------
create table if not exists otbi_meta.otbi_oracle_columns (
  source_key        text not null references otbi_meta.otbi_sources(source_key) on delete cascade,
  subject_area      text not null,
  folder_name       text not null,
  column_name       text not null,
  physical_table    text,
  physical_column   text,
  vo_definition     text,
  -- not null with an empty-string default so they can sit in the primary key:
  -- Postgres does not allow expressions such as coalesce() in a key constraint.
  database_object   text not null default '',
  database_column   text not null default '',
  indexed           boolean,
  loaded_at         timestamptz default now(),
  primary key (source_key, subject_area, folder_name, column_name,
               database_object, database_column)
);

create index if not exists otbi_oracle_columns_sa_idx
  on otbi_meta.otbi_oracle_columns (subject_area, folder_name, column_name);

-- ---------------------------------------------------------------------------
-- Reconciliation. Answers both directions of the question that started this:
--   instance_only  in the pod, absent from Oracle's documentation
--   oracle_only    documented by Oracle, not found in the pod
-- ---------------------------------------------------------------------------
create or replace view otbi_meta.v_column_reconciliation as
with api as (
  select distinct environment, subject_area, folder_name, column_name, hidden
  from otbi_meta.otbi_api_columns
),
ora as (
  select distinct subject_area, folder_name, column_name
  from otbi_meta.otbi_oracle_columns
),
cap as (
  select distinct subject_area, folder_name, column_name
  from otbi_meta.otbi_columns
)
select
  coalesce(a.environment, 'n/a')                             as environment,
  coalesce(a.subject_area, o.subject_area, c.subject_area)   as subject_area,
  coalesce(a.folder_name,  o.folder_name,  c.folder_name)    as folder_name,
  coalesce(a.column_name,  o.column_name,  c.column_name)    as column_name,
  (a.column_name is not null)                                as in_api,
  (o.column_name is not null)                                as in_oracle_doc,
  (c.column_name is not null)                                as in_manual_capture,
  a.hidden                                                   as api_hidden,
  case
    when a.column_name is not null and o.column_name is not null then 'both'
    when a.column_name is not null and o.column_name is null     then 'instance_only'
    when a.column_name is null     and o.column_name is not null then 'oracle_only'
    else 'capture_only'
  end                                                        as status
from api a
full outer join ora o
  on  o.subject_area = a.subject_area
  and o.folder_name  = a.folder_name
  and o.column_name  = a.column_name
full outer join cap c
  on  c.subject_area = coalesce(a.subject_area, o.subject_area)
  and c.folder_name  = coalesce(a.folder_name,  o.folder_name)
  and c.column_name  = coalesce(a.column_name,  o.column_name);

comment on view otbi_meta.v_column_reconciliation is
  'Column-level comparison across the API extract, Oracle mapping workbooks and manual captures.';

grant select, insert, update, delete on otbi_meta.otbi_sources        to authenticated, service_role;
grant select, insert, update, delete on otbi_meta.otbi_api_columns    to authenticated, service_role;
grant select, insert, update, delete on otbi_meta.otbi_oracle_columns to authenticated, service_role;
grant select on otbi_meta.v_column_reconciliation                     to authenticated, service_role;
