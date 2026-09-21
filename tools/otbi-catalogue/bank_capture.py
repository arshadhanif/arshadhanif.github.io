#!/usr/bin/env python3
"""Turn an OTBI subject-area capture into idempotent SQL for the otbi_meta schema.

A junior captures a subject area by building an analysis in OTBI, selecting every
column of every presentation folder, then copying from the Advanced tab into a
.txt file named after the subject area. Two capture formats exist:

  sql  the logical SQL (preferred). Every selected column is one anchored line,
       "Subject Area"."Folder"."Column" s_N, in projection order, and the file
       carries kind signals (.Count, DESCRIPTOR_IDOF, IDOF, SORTKEY).
  xml  the analysis XML. Used when no SQL capture exists for the subject area.

The script auto-detects the format, parses it, and emits UPSERT statements for
otbi_meta.otbi_folders and otbi_meta.otbi_columns plus an UPDATE for the
otbi_meta.otbi_subject_areas row.

Usage:
    python3 bank_capture.py CAPTURE.txt [CAPTURE2.txt ...] [options]

Options:
    --out DIR             write one .sql file per capture into DIR (default: stdout)
    --chunk N             columns per INSERT statement (default 200)
    --engagement NAME     engagement tag for the rows (default HNL)
    --captured-by NAME    who captured it (default: leave whatever is banked)
    --include-hierarchies bank presentation hierarchies too. Off by default, which
                          matches the folder column counts already banked.
    --verify              also print the checksum query and the expected md5
    --format sql|xml      force a format instead of auto-detecting

The SQL is safe to run repeatedly: every statement upserts on the table's primary
key, so re-banking a capture updates rows instead of duplicating them. Nothing is
deleted, so hand-curated fields such as database_object and database_column
survive a re-run. The subject-area row is updated, never inserted, so the seeded
pillar and group are never overwritten with a guess. A subject area that is not
seeded fails loudly on the folder and column foreign keys.
"""

import argparse
import hashlib
import html
import os
import re
import sys

# --- XML capture ------------------------------------------------------------
CRITERIA_RE = re.compile(r'<saw:criteria\b(?P<attrs>[^>]*)>(?P<body>.*?)</saw:criteria>', re.S)
COLUMNS_RE = re.compile(r'<saw:columns\b[^>]*>(?P<body>.*?)</saw:columns>', re.S)
COLUMN_RE = re.compile(r'<saw:column\b(?P<attrs>[^>]*)>(?P<body>.*?)</saw:column>', re.S)
EXPR_RE = re.compile(r'<sawx:expr[^>]*>(?P<expr>.*?)</sawx:expr>', re.S)
ATTR_RE = re.compile(r'([\w:.-]+)="([^"]*)"')
SIMPLE_RE = re.compile(r'^"((?:[^"]|"")*)"\."((?:[^"]|"")*)"$')
# Reading a capture through Google Drive escapes markdown-significant characters.
MD_ESCAPE_RE = re.compile(r'\\([<>&"\'`*_\[\]()#+\-.!~|{}])')

# --- SQL capture ------------------------------------------------------------
# A plain top-level projection: "Subject Area"."Folder"."Column" s_N
SQL_PLAIN_RE = re.compile(r'^\s*"([^"]+)"\."([^"]+)"\."([^"]+)"\s+s_(\d+)\s*,?\s*$')
# A wrapped projection: FUNC("Subject Area"."Folder"."Column"[."Level"]) s_N
SQL_WRAPPED_RE = re.compile(
    r'^\s*(DESCRIPTOR_IDOF|IDOF|SORTKEY)\(\s*"([^"]+)"((?:\."[^"]+")+)\s*\)\s+s_(\d+)\s*,?\s*$')
SQL_QUOTED_RE = re.compile(r'"([^"]+)"')
SQL_LITERAL_RE = re.compile(r"^\s*'[^']*'\s+s_\d+\s*,?\s*$")
SQL_ZERO_RE = re.compile(r'^\s*0\s+s_0\s*,?\s*$')
SQL_ISLEAF_RE = re.compile(r'^\s*CASE\s+WHEN\s+ISLEAF\(', re.I)
SQL_TAIL_RE = re.compile(r'^\s*(FROM|WHERE|ORDER\s+BY|FETCH\s+FIRST)\b', re.I)
SQL_HEAD_RE = re.compile(r'^\s*(SET\s+VARIABLE\b.*?)?SELECT\s*$', re.I)

DELIM = '~'
MEASURE_COLUMN = 'Count'


class CaptureError(Exception):
    pass


def unescape_markdown(text):
    """Undo the backslash escaping added when a capture is read through Google Drive."""
    if '\\<saw:' in text or '\\&quot;' in text or '\\_0,' in text or ' s\\_1' in text:
        return MD_ESCAPE_RE.sub(r'\1', text)
    return text


def detect_format(text):
    if '<saw:report' in text or '<saw:criteria' in text:
        return 'xml'
    if re.search(r'"\s+s_\d+\s*,', text) or text.lstrip().upper().startswith('SET VARIABLE'):
        return 'sql'
    raise CaptureError('cannot tell whether this is an XML or a SQL capture')


def parse_xml_capture(text, path):
    criteria = list(CRITERIA_RE.finditer(text))
    if not criteria:
        raise CaptureError('%s: no <saw:criteria> block found' % path)

    subject_areas, columns, hierarchies, unparsed = set(), [], [], []
    for crit in criteria:
        attrs = dict(ATTR_RE.findall(crit.group('attrs')))
        sa = html.unescape(attrs.get('subjectArea', '')).strip().strip('"')
        if sa:
            subject_areas.add(sa)
        for block in COLUMNS_RE.finditer(crit.group('body')):
            for col in COLUMN_RE.finditer(block.group('body')):
                cattrs = dict(ATTR_RE.findall(col.group('attrs')))
                if cattrs.get('xsi:type') == 'saw:hierarchicalColumn':
                    folder = html.unescape(cattrs.get('tableName', '')).strip().strip('"')
                    name = html.unescape(cattrs.get('hierarchyID', '')).strip()
                    if folder and name:
                        hierarchies.append((folder, name, None))
                    continue
                expr_match = EXPR_RE.search(col.group('body'))
                if not expr_match:
                    unparsed.append(col.group(0)[:160])
                    continue
                expr = html.unescape(expr_match.group('expr')).strip()
                simple = SIMPLE_RE.match(expr)
                if not simple:
                    # A formula column (CASE, SUM, a saved calculation) is not a
                    # presentation-layer column, so it does not belong in the catalogue.
                    unparsed.append(expr[:160])
                    continue
                columns.append((simple.group(1).replace('""', '"'),
                                simple.group(2).replace('""', '"'), None))
    return subject_areas, columns, hierarchies, unparsed


def parse_sql_capture(text, path):
    """Parse the logical SQL capture.

    Only the anchored top-level projection lines become columns. Wrapped
    projections are read for their signals instead: DESCRIPTOR_IDOF marks a
    column that has a coded and display pair, SORTKEY marks a sort column, and
    IDOF names a presentation hierarchy level. IDOF carries a four-part name,
    so a regex over every quoted triple in the file would mistake a hierarchy
    level for a folder. That is why each line is matched whole.
    """
    subject_areas, columns, hierarchies, unparsed = set(), [], [], []
    signals = {}

    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        if SQL_TAIL_RE.match(line):
            break                       # FROM / WHERE / ORDER BY / FETCH FIRST onward
        if SQL_HEAD_RE.match(line) or line.strip().upper().startswith('SET VARIABLE'):
            continue
        if SQL_ZERO_RE.match(line) or SQL_LITERAL_RE.match(line) or SQL_ISLEAF_RE.match(line):
            continue                    # the s_0 dummy, literal totals, leaf markers

        plain = SQL_PLAIN_RE.match(line)
        if plain:
            subject_areas.add(plain.group(1))
            folder, name = plain.group(2), plain.group(3)
            columns.append((folder, name, 'measure' if name == MEASURE_COLUMN else None))
            continue

        wrapped = SQL_WRAPPED_RE.match(line)
        if wrapped:
            func = wrapped.group(1).upper()
            subject_areas.add(wrapped.group(2))
            parts = SQL_QUOTED_RE.findall(wrapped.group(3))
            if func == 'IDOF':
                # "SA"."Folder"."Hierarchy"."Level": a presentation hierarchy.
                hierarchies.append((parts[0], parts[1] if len(parts) > 1 else '', None))
            elif len(parts) >= 2:
                signals.setdefault((parts[0], parts[1]), set()).add(func)
            continue

        unparsed.append(line[:160])

    # Fold the signals onto the plain columns they annotate.
    kinds = {'DESCRIPTOR_IDOF': 'coded', 'SORTKEY': 'sort'}
    annotated = []
    for folder, name, kind in columns:
        if kind is None:
            found = signals.get((folder, name), set())
            for func in ('DESCRIPTOR_IDOF', 'SORTKEY'):
                if func in found:
                    kind = kinds[func]
                    break
        annotated.append((folder, name, kind))
    return subject_areas, annotated, hierarchies, unparsed


def parse_capture(path, include_hierarchies=False, fmt=None):
    text = unescape_markdown(open(path, encoding='utf-8-sig').read())
    fmt = fmt or detect_format(text)
    parser = parse_xml_capture if fmt == 'xml' else parse_sql_capture
    subject_areas, columns, hierarchies, unparsed = parser(text, path)

    if len(subject_areas) != 1:
        raise CaptureError('%s: expected exactly one subject area, found %s'
                           % (path, sorted(subject_areas) or 'none'))
    subject_area = subject_areas.pop()

    if include_hierarchies:
        columns = columns + [(f, n, 'hierarchy') for f, n, _ in hierarchies]

    # De-duplicate while keeping capture order: a junior can select a column twice.
    seen, ordered = set(), []
    for folder, name, kind in columns:
        if (folder, name) in seen:
            continue
        seen.add((folder, name))
        ordered.append((folder, name, kind))

    for folder, name, _ in ordered:
        if DELIM in folder or DELIM in name:
            raise CaptureError('%s: name contains the %r delimiter: %r'
                               % (path, DELIM, folder + '.' + name))

    return {
        'path': path,
        'format': fmt,
        'subject_area': subject_area,
        'columns': ordered,
        'hierarchies': hierarchies,
        'unparsed': unparsed,
        'duplicates': len(columns) - len(ordered),
    }


def q(value):
    """Quote a value as a SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def by_folder(capture):
    folders = {}
    for folder, name, kind in capture['columns']:
        folders.setdefault(folder, []).append((name, kind))
    return folders


def canonical(capture):
    """The checksum payload: folder~column, ordered the way the DB can reproduce it."""
    folders = by_folder(capture)
    return '\n'.join('%s%s%s' % (folder, DELIM, name)
                     for folder in sorted(folders)
                     for name, _ in folders[folder])


def build_sql(capture, chunk_size, engagement, captured_by, verify):
    sa = capture['subject_area']
    folders = by_folder(capture)
    total = len(capture['columns'])
    source = 'advanced_sql' if capture['format'] == 'sql' else 'advanced_xml'
    who = q(captured_by) if captured_by else 'null'

    out = ['-- OTBI capture: %s' % sa,
           '-- source file: %s (%s capture)' % (os.path.basename(capture['path']), capture['format']),
           '-- folders: %d, columns: %d' % (len(folders), total),
           '-- Safe to re-run: every statement upserts on the primary key.',
           'begin;', '']

    # The subject-area row is only updated. The 348 subject areas are seeded with
    # their real pillar and group, and a capture file cannot tell us those.
    out += ['update otbi_meta.otbi_subject_areas set',
            '  capture_filename = %s,' % q(os.path.basename(capture['path'])),
            '  folder_count = %d,' % len(folders),
            '  column_count = %d,' % total,
            '  capture_status = %s,' % q('Captured'),
            '  captured_by = coalesce(%s, captured_by),' % who,
            '  updated_at = now()',
            'where subject_area = %s;' % q(sa), '']

    folder_lines = '\n'.join('%s%s%d' % (f, DELIM, len(v)) for f, v in sorted(folders.items()))
    out += ['insert into otbi_meta.otbi_folders (subject_area, folder_name, column_count, engagement, updated_at)',
            'select %s, split_part(line, %s, 1), split_part(line, %s, 2)::int, %s, now()'
            % (q(sa), q(DELIM), q(DELIM), q(engagement)),
            'from unnest(string_to_array($folders$\n%s\n$folders$, chr(10))) as line' % folder_lines,
            "where line <> ''",
            'on conflict (subject_area, folder_name, engagement) do update set',
            '  column_count = excluded.column_count,',
            '  updated_at = now();', '']

    # The ordinal is the column's position inside its own folder, which is what
    # is already banked. updated_at stays out of the insert list: it defaults to
    # now(), and the on-conflict branch sets it explicitly.
    flat = [(folder, name, kind, ordinal)
            for folder in sorted(folders)
            for ordinal, (name, kind) in enumerate(folders[folder], start=1)]

    for start in range(0, len(flat), chunk_size):
        part = flat[start:start + chunk_size]
        payload = '\n'.join('%s%s%s%s%s%s%d' % (f, DELIM, n, DELIM, k or '', DELIM, o)
                            for f, n, k, o in part)
        out += ['-- columns %d to %d of %d' % (start + 1, start + len(part), len(flat)),
                'insert into otbi_meta.otbi_columns (subject_area, folder_name, column_name, '
                'presentation_path, column_kind, source, engagement, captured_by, ordinal)',
                'select %s,' % q(sa),
                '       split_part(line, %s, 1),' % q(DELIM),
                '       split_part(line, %s, 2),' % q(DELIM),
                '       %s || \'."\' || split_part(line, %s, 1) || \'"."\' || split_part(line, %s, 2) || \'"\','
                % (q('"' + sa + '"'), q(DELIM), q(DELIM)),
                '       nullif(split_part(line, %s, 3), \'\'),' % q(DELIM),
                '       %s, %s, %s,' % (q(source), q(engagement), who),
                '       split_part(line, %s, 4)::int' % q(DELIM),
                'from unnest(string_to_array($cols$\n%s\n$cols$, chr(10))) as line' % payload,
                "where line <> ''",
                'on conflict (subject_area, folder_name, column_name, engagement) do update set',
                '  presentation_path = excluded.presentation_path,',
                '  column_kind = coalesce(excluded.column_kind, otbi_meta.otbi_columns.column_kind),',
                '  source = excluded.source,',
                '  captured_by = coalesce(excluded.captured_by, otbi_meta.otbi_columns.captured_by),',
                '  ordinal = excluded.ordinal,',
                '  updated_at = now();', '']

    out.append('commit;')

    if verify:
        digest = hashlib.md5(canonical(capture).encode('utf-8')).hexdigest()
        # collate "C" so the ordering matches Python's: the database default
        # collation sorts a leading "- " differently and would change the digest.
        out += ['',
                '-- Verification. This must return %d and %s.' % (total, digest),
                'select count(*) as columns_banked,',
                '       md5(string_agg(folder_name || %s || column_name, chr(10) '
                'order by folder_name collate "C", ordinal)) as checksum' % q(DELIM),
                'from otbi_meta.otbi_columns',
                'where subject_area = %s and engagement = %s;' % (q(sa), q(engagement))]

    return '\n'.join(out) + '\n'


def main():
    ap = argparse.ArgumentParser(description='Bank an OTBI subject-area capture into otbi_meta.')
    ap.add_argument('captures', nargs='+')
    ap.add_argument('--out', help='directory to write .sql files into (default: stdout)')
    ap.add_argument('--chunk', type=int, default=200)
    ap.add_argument('--engagement', default='HNL')
    ap.add_argument('--captured-by', default=None)
    ap.add_argument('--include-hierarchies', action='store_true')
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--format', choices=['sql', 'xml'], default=None)
    args = ap.parse_args()

    if args.out:
        os.makedirs(args.out, exist_ok=True)

    for path in args.captures:
        capture = parse_capture(path, args.include_hierarchies, args.format)
        sql = build_sql(capture, args.chunk, args.engagement, args.captured_by, args.verify)
        sys.stderr.write('%s [%s]: %d folders, %d columns, %d hierarchies %s, '
                         '%d duplicates dropped, %d unparsed\n'
                         % (capture['subject_area'], capture['format'], len(by_folder(capture)),
                            len(capture['columns']), len(capture['hierarchies']),
                            'banked' if args.include_hierarchies else 'skipped',
                            capture['duplicates'], len(capture['unparsed'])))
        for item in capture['unparsed']:
            sys.stderr.write('  unparsed: %s\n' % item)
        if args.out:
            dest = os.path.join(args.out, re.sub(r'[^\w.-]+', '_', capture['subject_area']) + '.sql')
            open(dest, 'w', encoding='utf-8').write(sql)
            sys.stderr.write('  wrote %s\n' % dest)
        else:
            sys.stdout.write(sql)


if __name__ == '__main__':
    main()
