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

    # derive the parent rows from the column rows
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

    copy_in('otbi_meta.otbi_subject_areas',
            ['environment','subject_area','folder_count','column_count',
             'visible_column_count','hidden_column_count','measure_count','source_key'],
            ((env, sa, len(a['folders']), a['cols'], a['cols']-a['hidden'],
              a['hidden'], a['measures'], source_key) for (env, sa), a in areas.items()))

    copy_in('otbi_meta.otbi_folders',
            ['environment','subject_area','folder_name','parent_folder','hidden',
             'column_count','source_key'],
            ((env, sa, fo, f['parent_folder'], f['hidden'], f['column_count'], source_key)
             for (env, sa, fo), f in folders.items()))

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


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('mode', choices=['summary','load'])
    ap.add_argument('files', nargs='+')
    ap.add_argument('--source-key', default=None)
    ap.add_argument('--captured-by', default='Arshad')
    ap.add_argument('--notes', default=None)
    ap.add_argument('--pod-host', default=None)
    ap.add_argument('--carry-pillars-from', default='otbi_archive_20260923',
                    help='schema holding the pre-rebuild subject areas, for pillar and group')
    args = ap.parse_args()

    rows, stats = scan(args.files)
    report(stats, rows)

    if args.mode == 'load':
        if not args.source_key:
            raise SystemExit('--source-key is required when loading, e.g. api_hnlprod_2026_09_23')
        envs = [e for e in stats['env'] if e]
        if len(envs) != 1:
            raise SystemExit('expected exactly one environment in the files, found %s' % envs)
        load(rows, stats, args.source_key, envs[0], args.captured_by, args.notes,
             args.pod_host, args.carry_pillars_from)


if __name__ == '__main__':
    main()
