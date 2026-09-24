#!/usr/bin/env python3
"""Push a prepared catalogue into Supabase over HTTPS.

The session that runs this reaches Supabase through a proxy that carries HTTPS
on port 443 only, so psql on 5432 is not an option. This posts the same rows to
the otbi_load_* functions through the Data API instead.

Input is a directory written by `load_api_extract.py prepare`: subject_areas.csv,
folders.csv and columns.csv. Parents go first so the foreign keys hold.

Needs two values in the environment:

    SUPABASE_URL                https://<ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY   the secret key, not the publishable one

Re-running is safe. otbi_load_begin clears the environment's rows first, and
every batch upserts, so a run that dies partway can simply be run again.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request

BOOL_COLS = {'hidden', 'aggregatable'}
INT_COLS = {'folder_count', 'column_count', 'visible_column_count',
            'hidden_column_count', 'measure_count', 'ext_attribute_slots', 'ordinal'}


def typed(name, value):
    if value == '\\N':
        return None
    if name in BOOL_COLS:
        return value == 'True'
    if name in INT_COLS:
        return int(value)
    return value


def read_csv(path):
    csv.field_size_limit(10 ** 7)
    with open(path, encoding='utf-8', newline='') as fh:
        for row in csv.DictReader(fh):
            yield {k: typed(k, v) for k, v in row.items()}


def rpc(base, key, fn, payload, timeout=180, attempts=5):
    url = '%s/rest/v1/rpc/%s' % (base.rstrip('/'), fn)
    body = json.dumps(payload).encode('utf-8')
    last = None
    for attempt in range(1, attempts + 1):
        req = urllib.request.Request(url, data=body, method='POST', headers={
            'apikey': key,
            'Authorization': 'Bearer %s' % key,
            'Content-Type': 'application/json',
            'Content-Profile': 'public',
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                text = r.read().decode('utf-8', 'replace').strip()
                return json.loads(text) if text else None
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'replace')[:400]
            # a 4xx is our mistake and will not fix itself; stop now
            if 400 <= e.code < 500 and e.code not in (408, 429):
                raise SystemExit('%s failed: HTTP %s %s' % (fn, e.code, detail))
            last = 'HTTP %s %s' % (e.code, detail)
        except Exception as e:                     # timeouts, resets, DNS
            last = '%s: %s' % (type(e).__name__, e)
        if attempt < attempts:
            wait = 2 ** attempt
            print('     %s attempt %d failed (%s), retrying in %ds'
                  % (fn, attempt, last, wait), file=sys.stderr)
            time.sleep(wait)
    raise SystemExit('%s failed after %d attempts: %s' % (fn, attempts, last))


def push(base, key, fn, rows, batch, label):
    sent = 0
    started = time.time()
    buf = []
    for row in rows:
        buf.append(row)
        if len(buf) >= batch:
            rpc(base, key, fn, {'p_rows': buf})
            sent += len(buf)
            buf = []
            rate = sent / max(time.time() - started, 0.001)
            print('     %-14s %9s rows  %6.0f rows/s' % (label, format(sent, ','), rate))
    if buf:
        rpc(base, key, fn, {'p_rows': buf})
        sent += len(buf)
    print('     %-14s %9s rows  done in %.0fs' % (label, format(sent, ','), time.time() - started))
    return sent


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('directory', help='directory written by prepare')
    ap.add_argument('--source-key', required=True)
    ap.add_argument('--environment', required=True)
    ap.add_argument('--pod-host', default=None)
    ap.add_argument('--captured-by', default='Arshad')
    ap.add_argument('--notes', default=None)
    ap.add_argument('--ext-attribute-slot-count', type=int, default=None)
    ap.add_argument('--carry-pillars-from', default='otbi_archive_20260923')
    ap.add_argument('--batch', type=int, default=2000)
    args = ap.parse_args()

    base = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not base or not key:
        raise SystemExit('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set '
                         'in the environment.')

    d = args.directory
    paths = {n: os.path.join(d, n + '.csv')
             for n in ('subject_areas', 'folders', 'columns')}
    for n, p in paths.items():
        if not os.path.exists(p):
            raise SystemExit('%s not found. Run load_api_extract.py prepare first.' % p)

    counts = {n: sum(1 for _ in open(p, encoding='utf-8')) - 1 for n, p in paths.items()}
    slots = args.ext_attribute_slot_count
    if slots is None:
        slots = sum(r['ext_attribute_slots'] or 0 for r in read_csv(paths['folders']))

    print('pushing %s subject areas, %s folders, %s columns (%s slots counted)'
          % (format(counts['subject_areas'], ','), format(counts['folders'], ','),
             format(counts['columns'], ','), format(slots, ',')))

    rpc(base, key, 'otbi_load_begin', {'p_source': {
        'source_key': args.source_key, 'environment': args.environment,
        'pod_host': args.pod_host, 'title': 'OTBI MetadataService extract',
        'captured_by': args.captured_by,
        'subject_area_count': counts['subject_areas'],
        'folder_count': counts['folders'],
        'column_count': counts['columns'],
        'ext_attribute_slot_count': slots,
        'notes': args.notes}})
    print('     begin          source row written, environment cleared')

    push(base, key, 'otbi_load_subject_areas', read_csv(paths['subject_areas']),
         args.batch, 'subject areas')
    push(base, key, 'otbi_load_folders', read_csv(paths['folders']),
         args.batch, 'folders')
    push(base, key, 'otbi_load_columns', read_csv(paths['columns']),
         args.batch, 'columns')

    result = rpc(base, key, 'otbi_load_finish',
                 {'p_environment': args.environment,
                  'p_archive': args.carry_pillars_from})
    print()
    print('  in the database now:')
    for k in ('subject_areas', 'folders', 'columns', 'ext_attribute_slots', 'pillars_carried'):
        print('     %-20s %s' % (k, format(result.get(k, 0), ',')))

    bad = [(k, counts[k], result.get(k)) for k in counts if counts[k] != result.get(k)]
    for k, want, got in bad:
        print('  WARNING: %s expected %s, database holds %s'
              % (k, format(want, ','), format(got or 0, ',')))
    if not bad:
        print()
        print('  every count matches the prepared files.')


if __name__ == '__main__':
    main()
