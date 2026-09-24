-- ============================================================================
-- Load entry points callable over HTTPS.
--
-- The session that loads the catalogue reaches Supabase through a proxy that
-- carries HTTPS on port 443 only. Its documentation lists raw-TCP databases
-- and non-443 ports as unsupported, so a Postgres connection on 5432 cannot
-- work from there whatever the network policy allows. These functions let the
-- same load run through the Data API instead.
--
-- otbi_meta stays unexposed. The functions live in public, which the Data API
-- already exposes, and are security definer so they can write to otbi_meta.
-- Execute is revoked from everyone and granted to service_role alone, so a
-- publishable or anon key cannot reach them.
--
-- Applied to project ztmidhgqtqyzqkunbtbu as migration otbi_load_over_https.
-- The client is push_over_https.py.
-- ============================================================================

create or replace function public.otbi_load_begin(p_source jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into otbi_meta.otbi_sources
    (source_key, source_type, environment, pod_host, title, captured_by, captured_at,
     subject_area_count, folder_count, column_count, ext_attribute_slot_count, notes)
  select p_source->>'source_key', 'metadata_api', p_source->>'environment',
         p_source->>'pod_host', p_source->>'title', p_source->>'captured_by', now(),
         (p_source->>'subject_area_count')::int, (p_source->>'folder_count')::int,
         (p_source->>'column_count')::int, (p_source->>'ext_attribute_slot_count')::int,
         p_source->>'notes'
  on conflict (source_key) do update set
    environment = excluded.environment, pod_host = excluded.pod_host,
    captured_by = excluded.captured_by, captured_at = excluded.captured_at,
    subject_area_count = excluded.subject_area_count,
    folder_count = excluded.folder_count, column_count = excluded.column_count,
    ext_attribute_slot_count = excluded.ext_attribute_slot_count,
    notes = excluded.notes;

  -- replace this environment's rows; the cascades clear folders and columns
  delete from otbi_meta.otbi_subject_areas where environment = p_source->>'environment';
end $$;

create or replace function public.otbi_load_subject_areas(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  insert into otbi_meta.otbi_subject_areas
    (environment, subject_area, folder_count, column_count, visible_column_count,
     hidden_column_count, measure_count, ext_attribute_slots, source_key)
  select r.environment, r.subject_area, r.folder_count, r.column_count,
         r.visible_column_count, r.hidden_column_count, r.measure_count,
         r.ext_attribute_slots, r.source_key
    from jsonb_populate_recordset(null::otbi_meta.otbi_subject_areas, p_rows) r
  on conflict (environment, subject_area) do update set
    folder_count = excluded.folder_count, column_count = excluded.column_count,
    visible_column_count = excluded.visible_column_count,
    hidden_column_count = excluded.hidden_column_count,
    measure_count = excluded.measure_count,
    ext_attribute_slots = excluded.ext_attribute_slots,
    source_key = excluded.source_key, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.otbi_load_folders(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  insert into otbi_meta.otbi_folders
    (environment, subject_area, folder_name, parent_folder, hidden, column_count,
     ext_attribute_slots, source_key)
  select r.environment, r.subject_area, r.folder_name, r.parent_folder, r.hidden,
         r.column_count, r.ext_attribute_slots, r.source_key
    from jsonb_populate_recordset(null::otbi_meta.otbi_folders, p_rows) r
  on conflict (environment, subject_area, folder_name) do update set
    parent_folder = excluded.parent_folder, hidden = excluded.hidden,
    column_count = excluded.column_count,
    ext_attribute_slots = excluded.ext_attribute_slots,
    source_key = excluded.source_key, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.otbi_load_columns(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  insert into otbi_meta.otbi_columns
    (environment, subject_area, folder_name, column_name, display_name, description,
     data_type, aggregatable, aggr_rule, hidden, ordinal, source_key)
  select r.environment, r.subject_area, r.folder_name, r.column_name, r.display_name,
         r.description, r.data_type, r.aggregatable, r.aggr_rule, r.hidden,
         r.ordinal, r.source_key
    from jsonb_populate_recordset(null::otbi_meta.otbi_columns, p_rows) r
  on conflict (environment, subject_area, folder_name, column_name) do update set
    display_name = excluded.display_name, description = excluded.description,
    data_type = excluded.data_type, aggregatable = excluded.aggregatable,
    aggr_rule = excluded.aggr_rule, hidden = excluded.hidden,
    ordinal = excluded.ordinal, source_key = excluded.source_key, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.otbi_load_finish(p_environment text, p_archive text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare carried integer := 0; result jsonb;
begin
  -- the API does not return pillar or group; carry the curated values across
  if p_archive is not null then
    execute format(
      'update otbi_meta.otbi_subject_areas t
          set pillar = a.pillar, group_name = a.group_name
         from %I.otbi_subject_areas a
        where a.subject_area = t.subject_area and t.environment = $1', p_archive)
      using p_environment;
    get diagnostics carried = row_count;
  end if;

  select jsonb_build_object(
    'subject_areas', (select count(*) from otbi_meta.otbi_subject_areas where environment = p_environment),
    'folders',       (select count(*) from otbi_meta.otbi_folders        where environment = p_environment),
    'columns',       (select count(*) from otbi_meta.otbi_columns        where environment = p_environment),
    'ext_attribute_slots', (select coalesce(sum(ext_attribute_slots),0) from otbi_meta.otbi_folders where environment = p_environment),
    'pillars_carried', carried)
  into result;
  return result;
end $$;

revoke all on function public.otbi_load_begin(jsonb)          from public, anon, authenticated;
revoke all on function public.otbi_load_subject_areas(jsonb)  from public, anon, authenticated;
revoke all on function public.otbi_load_folders(jsonb)        from public, anon, authenticated;
revoke all on function public.otbi_load_columns(jsonb)        from public, anon, authenticated;
revoke all on function public.otbi_load_finish(text, text)    from public, anon, authenticated;

grant execute on function public.otbi_load_begin(jsonb)         to service_role;
grant execute on function public.otbi_load_subject_areas(jsonb) to service_role;
grant execute on function public.otbi_load_folders(jsonb)       to service_role;
grant execute on function public.otbi_load_columns(jsonb)       to service_role;
grant execute on function public.otbi_load_finish(text, text)   to service_role;
