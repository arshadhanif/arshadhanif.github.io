-- ============================================================================
-- OTBI catalogue, rebuilt from the OTBI MetadataService extract.
--
-- Supabase is the source of truth. Oracle's release workbooks and the manual
-- Advanced XML captures are no longer part of the model. The pre-rebuild data
-- was snapshotted to schema otbi_archive_20260923 before this ran.
--
-- Applied to project ztmidhgqtqyzqkunbtbu as migration
-- otbi_catalogue_from_metadata_api on 2026-09-23.
-- ============================================================================

create table otbi_meta.otbi_sources (
  source_key          text primary key,
  source_type         text not null default 'metadata_api',
  environment         text not null,
  pod_host            text,
  title               text,
  captured_by         text,
  captured_at         timestamptz,
  subject_area_count  integer,
  folder_count        integer,
  column_count        integer,
  notes               text,
  created_at          timestamptz default now()
);

create table otbi_meta.otbi_subject_areas (
  environment           text not null,
  subject_area          text not null,
  pillar                text,
  group_name            text,
  folder_count          integer,
  column_count          integer,
  visible_column_count  integer,
  hidden_column_count   integer,
  measure_count         integer,
  source_key            text references otbi_meta.otbi_sources(source_key) on delete set null,
  notes                 text,
  updated_at            timestamptz default now(),
  primary key (environment, subject_area)
);

create table otbi_meta.otbi_folders (
  environment    text not null,
  subject_area   text not null,
  folder_name    text not null,
  parent_folder  text,
  hidden         boolean,
  column_count   integer,
  source_key     text references otbi_meta.otbi_sources(source_key) on delete set null,
  updated_at     timestamptz default now(),
  primary key (environment, subject_area, folder_name),
  foreign key (environment, subject_area)
    references otbi_meta.otbi_subject_areas(environment, subject_area) on delete cascade
);

create table otbi_meta.otbi_columns (
  environment    text not null,
  subject_area   text not null,
  folder_name    text not null,
  column_name    text not null,
  display_name   text,
  description    text,
  data_type      text,
  aggregatable   boolean,
  aggr_rule      text,
  hidden         boolean,
  ordinal        integer,
  source_key     text references otbi_meta.otbi_sources(source_key) on delete set null,
  updated_at     timestamptz default now(),
  primary key (environment, subject_area, folder_name, column_name),
  foreign key (environment, subject_area, folder_name)
    references otbi_meta.otbi_folders(environment, subject_area, folder_name) on delete cascade
);

create index otbi_columns_name_idx     on otbi_meta.otbi_columns (column_name);
create index otbi_columns_sa_idx       on otbi_meta.otbi_columns (environment, subject_area);
create index otbi_columns_measure_idx  on otbi_meta.otbi_columns (environment, subject_area) where aggregatable;
create index otbi_columns_visible_idx  on otbi_meta.otbi_columns (environment, subject_area) where not hidden;
create index otbi_folders_sa_idx       on otbi_meta.otbi_folders (environment, subject_area);

grant select, insert, update, delete on otbi_meta.otbi_sources        to authenticated, service_role;
grant select, insert, update, delete on otbi_meta.otbi_subject_areas  to authenticated, service_role;
grant select, insert, update, delete on otbi_meta.otbi_folders        to authenticated, service_role;
grant select, insert, update, delete on otbi_meta.otbi_columns        to authenticated, service_role;
