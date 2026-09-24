#!/usr/bin/env python3
"""Validate and load a MetadataService extract into otbi_meta.

Supabase is the source of truth for the OTBI catalogue. This loads the extract
into otbi_sources, otbi_subject_areas, otbi_folders and otbi_columns, deriving
the subject area and folder rows from the column rows.

The extractor (otbi-prod-extract.ps1) writes one CSV per window, optionally
zipped. This reads them, checks them, and either reports on them or loads them.

Two modes:

    python3 load_api_extract.py summary FILE [FILE ...]
        Reads the files and prints what is in them. Needs no database, so it
        works the moment the files arrive.

    python3 load_api_extract.py prepare FILE [FILE ...] --source-key KEY --out DIR
        Writes subject_areas.csv, folders.csv, columns.csv and a load.sql that
        loads them with psql. Needs no database either, so the heavy parsing is
        done once and the load itself is a plain COPY from anywhere.

    python3 load_api_extract.py load FILE [FILE ...] --source-key KEY
        Streams the rows into otbi_meta.otbi_api_columns with COPY, and
        registers the extract in otbi_meta.otbi_sources.
        Needs SUPABASE_DB_URL in the environment.

Loading is idempotent at the source level: re-running the same source key
replaces that source's rows rather than duplicating them.
"""

import argparse
import csv
import io
import os
import sys
import zipfile
from collections import Counter, defaultdict

EXPECTED = ['environment','subject_area','folder','parent_folder','folder_hidden',
            'column','display_name','description','data_type','aggregatable','aggr_rule','hidden']

COL_TARGET = ['environment','subject_area','folder_name','column_name','display_name',
              'description','data_type','aggregatable','aggr_rule','hidden','ordinal','source_key']

SA_TARGET = ['environment','subject_area','folder_count','column_count',
             'visible_column_count','hidden_column_count','measure_count','source_key']

FOLDER_TARGET = ['environment','subject_area','folder_name','parent_folder','hidden',
                 'column_count','source_key']


def unquote(s):
    """Oracle returns names wrapped in double quotes; strip one balanced pair."""
    s = (s or '').strip()
    if len(s) > 1 and s[0] == '"' and s[-1] == '"':
        return s[1:-1]
    return s


def to_bool(s):
    v = (s or '').strip().lower()
    if v in ('true','t','1','yes'):  return True
    if v in ('false','f','0','no'):  return False
    return None


def open_rows(path):
    """Yield dict rows from a .csv or a .zip containing one .csv."""
    if path.lower().endswith('.zip'):
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.lower().endswith('.csv')]
            if not names:
                raise SystemExit('%s: no .csv inside the zip' % path)
            for name in names:
                with z.open(name) as fh:
                    text = io.TextIOWrapper(fh, encoding='utf-8-sig', newline='')
                    for r in csv.DictReader(text):
                        yield r
    else:
        with open(path, encoding='utf-8-sig', newline='') as fh:
            for r in csv.DictReader(fh):
                yield r


def normalise(r):
    return {
        'environment':   unquote(r.get('environment','')),
        'subject_area':  unquote(r.get('subject_area','')),
        'folder_name':   unquote(r.get('folder','')),
        'parent_folder': unquote(r.get('parent_folder','')) or None,
        'folder_hidden': to_bool(r.get('folder_hidden')),
        'column_name':   unquote(r.get('column','')),
        'display_name':  r.get('display_name','') or None,
        'description':   r.get('description','') or None,
        'data_type':     r.get('data_type','') or None,
        'aggregatable':  to_bool(r.get('aggregatable')),
        'aggr_rule':     r.get('aggr_rule','') or None,
        'hidden':        to_bool(r.get('hidden')),
    }


def scan(paths):
    """Read every file once, de-duplicate on the primary key, and collect stats."""
    seen = set()
    rows = []
    stats = {
        'files': {}, 'dupes': 0, 'blank_key': 0,
        'env': Counter(), 'dtype': Counter(),
        'hidden': 0, 'measures': 0, 'described': 0,
        'folders': set(), 'subject_areas': set(),
        'per_sa': defaultdict(lambda: [0,0]),   # subject area -> [folders, columns]
        'sa_folders': defaultdict(set),
    }
    for p in paths:
        n = 0
        header_checked = False
        for r in open_rows(p):
            if not header_checked:
                missing = [c for c in EXPECTED if c not in r]
                if missing:
                    raise SystemExit('%s: missing expected columns: %s' % (p, ', '.join(missing)))
                header_checked = True
            d = normalise(r)
            if not (d['subject_area'] and d['folder_name'] and d['column_name']):
                stats['blank_key'] += 1
                continue
            key = (d['subject_area'], d['folder_name'], d['column_name'])
            if key in seen:
                stats['dupes'] += 1
                continue
            seen.add(key)
            rows.append(d)
            n += 1
            stats['env'][d['environment']] += 1
            stats['dtype'][d['data_type'] or '(none)'] += 1
            if d['hidden']: stats['hidden'] += 1
            if d['aggregatable']: stats['measures'] += 1
            if d['description']: stats['described'] += 1
            stats['subject_areas'].add(d['subject_area'])
            stats['folders'].add((d['subject_area'], d['folder_name']))
            stats['sa_folders'][d['subject_area']].add(d['folder_name'])
            stats['per_sa'][d['subject_area']][1] += 1
        stats['files'][p] = n
    for sa, folders in stats['sa_folders'].items():
        stats['per_sa'][sa][0] = len(folders)
    return rows, stats


def report(stats, rows):
    print('=' * 68)
    print('MetadataService extract')
    print('=' * 68)
    for p, n in stats['files'].items():
        print('  %-52s %s rows' % (os.path.basename(p)[:51], format(n, ',')))
    print()
    print('  subject areas     : %s' % format(len(stats['subject_areas']), ','))
    print('  folders           : %s' % format(len(stats['folders']), ','))
    print('  columns           : %s' % format(len(rows), ','))
    print('  hidden columns    : %s' % format(stats['hidden'], ','))
    print('  measures          : %s' % format(stats['measures'], ','))
    print('  with a description: %s' % format(stats['described'], ','))
    print('  duplicates dropped: %s' % format(stats['dupes'], ','))
    print('  rows missing a key: %s' % format(stats['blank_key'], ','))
    print('  environments      : %s' % dict(stats['env']))
    print()
    print('  data types        : %s' % dict(stats['dtype'].most_common(8)))
    print()
    big = sorted(stats['per_sa'].items(), key=lambda kv: -kv[1][1])[:10]
    print('  largest subject areas:')
    for sa, (f, c) in big:
        print('     %-54s %3d folders %7s columns' % (sa[:53], f, format(c, ',')))


def derive(rows):
    """Build the subject area and folder rows from the column rows.

    Also stamps each column with its ordinal inside its folder, so the order
    Oracle returned the columns in survives into the table.
    """
    folders = {}
    areas = {}
    ordinals = defaultdict(int)
    for d in rows:
        fk = (d['environment'], d['subject_area'], d['folder_name'])
        f = folders.setdefault(fk, {'parent_folder': d['parent_folder'],
                                    'hidden': d['folder_hidden'], 'column_count': 0})
        f['column_count'] += 1
        ordinals[fk] += 1
        d['ordinal'] = ordinals[fk]
        a = areas.setdefault((d['environment'], d['subject_area']),
                             {'folders': set(), 'cols': 0, 'hidden': 0, 'measures': 0})
        a['folders'].add(d['folder_name'])
        a['cols'] += 1
        if d['hidden']: a['hidden'] += 1
        if d['aggregatable']: a['measures'] += 1
    return areas, folders


def area_records(areas, source_key):
    return ((env, sa, len(a['folders']), a['cols'], a['cols'] - a['hidden'],
             a['hidden'], a['measures'], source_key)
            for (env, sa), a in areas.items())


def folder_records(folders, source_key):
    return ((env, sa, fo, f['parent_folder'], f['hidden'], f['column_count'], source_key)
            for (env, sa, fo), f in folders.items())


def load(rows, stats, source_key, environment, captured_by, notes, pod_host=None,
         carry_pillars_from=None):
    """Load into the four tables, parents first so the foreign keys hold."""
    try:
        import psycopg2
    except ImportError:
        raise SystemExit('psycopg2 is needed to load. Install it with: pip install psycopg2-binary')
    dsn = os.environ.get('SUPABASE_DB_URL')
    if not dsn:
        raise SystemExit('SUPABASE_DB_URL is not set in the environment.')

    areas, folders = derive(rows)

    conn = psycopg2.connect(dsn); conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        insert into otbi_meta.otbi_sources
          (source_key, source_type, environment, pod_host, title, captured_by, captured_at,
           subject_area_count, folder_count, column_count, notes)
        values (%s,'metadata_api',%s,%s,%s,%s,now(),%s,%s,%s,%s)
        on conflict (source_key) do update set
          environment=excluded.environment, pod_host=excluded.pod_host,
          captured_by=excluded.captured_by, captured_at=excluded.captured_at,
          subject_area_count=excluded.subject_area_count,
          folder_count=excluded.folder_count, column_count=excluded.column_count,
          notes=excluded.notes
    """, (source_key, environment, pod_host, 'OTBI MetadataService extract', captured_by,
          len(areas), len(folders), len(rows), notes))

    # replace this environment's rows; the cascades clear folders and columns
    cur.execute('delete from otbi_meta.otbi_subject_areas where environment = %s', (environment,))

    def copy_in(table, cols, it):
        buf = io.StringIO(); w = csv.writer(buf, quoting=csv.QUOTE_MINIMAL)
        for rec in it:
            w.writerow(['\\N' if v is None else v for v in rec])
        buf.seek(0)
        cur.copy_expert("copy %s (%s) from stdin with (format csv, null '\\N')"
                        % (table, ', '.join(cols)), buf)

    copy_in('otbi_meta.otbi_subject_areas', SA_TARGET, area_records(areas, source_key))

    copy_in('otbi_meta.otbi_folders', FOLDER_TARGET, folder_records(folders, source_key))

    for d in rows:
        d['source_key'] = source_key
    copy_in('otbi_meta.otbi_columns', COL_TARGET,
            ([d[c] for c in COL_TARGET] for d in rows))

    # the API does not return pillar or group; carry the curated values across
    if carry_pillars_from:
        cur.execute("""
            update otbi_meta.otbi_subject_areas t
               set pillar = a.pillar, group_name = a.group_name
              from %s.otbi_subject_areas a
             where a.subject_area = t.subject_area
               and t.environment = %%s
        """ % carry_pillars_from, (environment,))
        carried = cur.rowcount
    else:
        carried = 0

    conn.commit()
    cur.execute("""select
        (select count(*) from otbi_meta.otbi_subject_areas where environment=%s),
        (select count(*) from otbi_meta.otbi_folders        where environment=%s),
        (select count(*) from otbi_meta.otbi_columns        where environment=%s)""",
        (environment, environment, environment))
    sa_n, f_n, c_n = cur.fetchone()
    cur.close(); conn.close()

    print()
    print('  loaded under source_key %s' % source_key)
    print('     subject areas : %s' % format(sa_n, ','))
    print('     folders       : %s' % format(f_n, ','))
    print('     columns       : %s' % format(c_n, ','))
    if carry_pillars_from:
        print('     pillars carried over from %s: %s' % (carry_pillars_from, format(carried, ',')))
    if c_n != len(rows):
        print('  WARNING: expected %s columns, the database holds %s'
              % (format(len(rows), ','), format(c_n, ',')))


def prepare(rows, source_key, environment, captured_by, notes, pod_host, outdir,
            carry_pillars_from=None):
    """Write the three table files plus a psql script that loads them.

    This needs no database, so it can run wherever the extract lands. The
    output directory is self contained: hand it to psql and the catalogue is
    built, with no Python on the far side.
    """
    os.makedirs(outdir, exist_ok=True)
    areas, folders = derive(rows)
    for d in rows:
        d['source_key'] = source_key

    # COPY reads an unquoted field equal to NULL_MARK as NULL, so a real value
    # that happened to equal it would load as NULL instead of as text. No OTBI
    # name does today, but fail loudly rather than corrupt a future extract.
    NULL_MARK = '\\N'

    def write(name, cols, it):
        path = os.path.join(outdir, name)
        n = 0
        with open(path, 'w', encoding='utf-8', newline='') as fh:
            w = csv.writer(fh, quoting=csv.QUOTE_MINIMAL)
            w.writerow(cols)
            for rec in it:
                out = []
                for v in rec:
                    if v is None:
                        out.append(NULL_MARK)
                        continue
                    if isinstance(v, str) and v == NULL_MARK:
                        raise SystemExit(
                            '%s row %d: a value equals the NULL marker %r, so it would '
                            'load as NULL. Change NULL_MARK in prepare().'
                            % (name, n + 1, NULL_MARK))
                    out.append(v)
                w.writerow(out)
                n += 1
        return path, n

    sa_path, sa_n = write('subject_areas.csv', SA_TARGET, area_records(areas, source_key))
    f_path,  f_n  = write('folders.csv', FOLDER_TARGET, folder_records(folders, source_key))
    c_path,  c_n  = write('columns.csv', COL_TARGET,
                          ([d[c] for c in COL_TARGET] for d in rows))

    def lit(v):
        if v is None:
            return 'null'
        return "'" + str(v).replace("'", "''") + "'"

    copy_opts = "with (format csv, header true, null '\\N')"
    carry = ''
    if carry_pillars_from:
        carry = """
-- the API does not return pillar or group; carry the curated values across
update otbi_meta.otbi_subject_areas t
   set pillar = a.pillar, group_name = a.group_name
  from {schema}.otbi_subject_areas a
 where a.subject_area = t.subject_area
   and t.environment = {env};
""".format(schema=carry_pillars_from, env=lit(environment))

    sql = """\\set ON_ERROR_STOP on
begin;

insert into otbi_meta.otbi_sources
  (source_key, source_type, environment, pod_host, title, captured_by, captured_at,
   subject_area_count, folder_count, column_count, notes)
values ({key}, 'metadata_api', {env}, {pod}, 'OTBI MetadataService extract',
        {by}, now(), {sa_n}, {f_n}, {c_n}, {notes})
on conflict (source_key) do update set
  environment = excluded.environment, pod_host = excluded.pod_host,
  captured_by = excluded.captured_by, captured_at = excluded.captured_at,
  subject_area_count = excluded.subject_area_count,
  folder_count = excluded.folder_count, column_count = excluded.column_count,
  notes = excluded.notes;

-- replace this environment's rows; the cascades clear folders and columns
delete from otbi_meta.otbi_subject_areas where environment = {env};

\\copy otbi_meta.otbi_subject_areas ({sa_cols}) from 'subject_areas.csv' {opts}
\\copy otbi_meta.otbi_folders ({f_cols}) from 'folders.csv' {opts}
\\copy otbi_meta.otbi_columns ({c_cols}) from 'columns.csv' {opts}
{carry}
commit;

select
  (select count(*) from otbi_meta.otbi_subject_areas where environment = {env}) as subject_areas,
  (select count(*) from otbi_meta.otbi_folders        where environment = {env}) as folders,
  (select count(*) from otbi_meta.otbi_columns        where environment = {env}) as columns;
""".format(key=lit(source_key), env=lit(environment), pod=lit(pod_host),
           by=lit(captured_by), notes=lit(notes),
           sa_n=sa_n, f_n=f_n, c_n=c_n,
           sa_cols=', '.join(SA_TARGET), f_cols=', '.join(FOLDER_TARGET),
           c_cols=', '.join(COL_TARGET), opts=copy_opts, carry=carry)

    sql_path = os.path.join(outdir, 'load.sql')
    with open(sql_path, 'w', encoding='utf-8') as fh:
        fh.write(sql)

    print()
    print('  prepared in %s' % outdir)
    for path, n in ((sa_path, sa_n), (f_path, f_n), (c_path, c_n)):
        print('     %-20s %10s rows  %8.1f MB'
              % (os.path.basename(path), format(n, ','),
                 os.path.getsize(path) / 1024.0 / 1024.0))
    print('     load.sql')
    print()
    print('  run it with:  cd %s && psql "$SUPABASE_DB_URL" -f load.sql' % outdir)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('mode', choices=['summary','prepare','load'])
    ap.add_argument('files', nargs='+')
    ap.add_argument('--source-key', default=None)
    ap.add_argument('--captured-by', default='Arshad')
    ap.add_argument('--notes', default=None)
    ap.add_argument('--pod-host', default=None)
    ap.add_argument('--out', default=None,
                    help='output directory for prepare mode')
    ap.add_argument('--carry-pillars-from', default='otbi_archive_20260923',
                    help='schema holding the pre-rebuild subject areas, for pillar and group')
    args = ap.parse_args()

    rows, stats = scan(args.files)
    report(stats, rows)

    if args.mode == 'summary':
        return

    if not args.source_key:
        raise SystemExit('--source-key is required, e.g. api_hnlprod_2026_09_24')
    envs = [e for e in stats['env'] if e]
    if len(envs) != 1:
        raise SystemExit('expected exactly one environment in the files, found %s' % envs)

    if args.mode == 'prepare':
        if not args.out:
            raise SystemExit('--out is required in prepare mode')
        prepare(rows, args.source_key, envs[0], args.captured_by, args.notes,
                args.pod_host, args.out, args.carry_pillars_from)
    else:
        load(rows, stats, args.source_key, envs[0], args.captured_by, args.notes,
             args.pod_host, args.carry_pillars_from)


if __name__ == '__main__':
    main()
