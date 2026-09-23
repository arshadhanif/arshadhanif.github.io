#!/usr/bin/env python3
"""Validate and load a MetadataService extract into otbi_meta.

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

TARGET_COLS = ['source_key','environment','subject_area','folder_name','parent_folder',
               'folder_hidden','column_name','display_name','description','data_type',
               'aggregatable','aggr_rule','hidden']


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


def load(rows, stats, source_key, environment, captured_by, notes):
    try:
        import psycopg2
    except ImportError:
        raise SystemExit('psycopg2 is needed to load. Install it with: pip install psycopg2-binary')
    dsn = os.environ.get('SUPABASE_DB_URL')
    if not dsn:
        raise SystemExit('SUPABASE_DB_URL is not set in the environment.')

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        insert into otbi_meta.otbi_sources
          (source_key, source_type, environment, title, captured_by, captured_at,
           subject_area_count, folder_count, column_count, notes)
        values (%s, 'metadata_api', %s, %s, %s, now(), %s, %s, %s, %s)
        on conflict (source_key) do update set
          environment=excluded.environment, title=excluded.title,
          captured_by=excluded.captured_by, captured_at=excluded.captured_at,
          subject_area_count=excluded.subject_area_count,
          folder_count=excluded.folder_count, column_count=excluded.column_count,
          notes=excluded.notes
    """, (source_key, environment, 'OTBI MetadataService extract', captured_by,
          len(stats['subject_areas']), len(stats['folders']), len(rows), notes))

    # replace this source's rows rather than accumulating them
    cur.execute('delete from otbi_meta.otbi_api_columns where source_key = %s', (source_key,))

    buf = io.StringIO()
    w = csv.writer(buf, quoting=csv.QUOTE_MINIMAL)
    for d in rows:
        w.writerow([source_key] + [d[c] if d[c] is not None else '\\N'
                                   for c in TARGET_COLS[1:]])
    buf.seek(0)
    cur.copy_expert(
        "copy otbi_meta.otbi_api_columns (%s) from stdin with (format csv, null '\\N')"
        % ', '.join(TARGET_COLS), buf)
    conn.commit()

    cur.execute('select count(*) from otbi_meta.otbi_api_columns where source_key = %s', (source_key,))
    banked = cur.fetchone()[0]
    cur.close(); conn.close()
    print()
    print('  loaded %s rows under source_key %s' % (format(banked, ','), source_key))
    if banked != len(rows):
        print('  WARNING: expected %s, the database holds %s' % (format(len(rows), ','), format(banked, ',')))
    return banked


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('mode', choices=['summary','load'])
    ap.add_argument('files', nargs='+')
    ap.add_argument('--source-key', default=None)
    ap.add_argument('--captured-by', default='Arshad')
    ap.add_argument('--notes', default=None)
    args = ap.parse_args()

    rows, stats = scan(args.files)
    report(stats, rows)

    if args.mode == 'load':
        if not args.source_key:
            raise SystemExit('--source-key is required when loading, e.g. api_hnlprod_2026_09_23')
        envs = [e for e in stats['env'] if e]
        if len(envs) != 1:
            raise SystemExit('expected exactly one environment in the files, found %s' % envs)
        load(rows, stats, args.source_key, envs[0], args.captured_by, args.notes)


if __name__ == '__main__':
    main()
