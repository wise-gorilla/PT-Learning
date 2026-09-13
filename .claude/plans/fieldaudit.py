"""WHAT DOES THE FILE STATE THAT WE NEVER READ? -- with each field's SCHEMA SPAN.

Five of s17's fixes came from exactly one shape -- a field the XT schema
declares, the file fills in, and our extractor never asks for:
`base_parameter`/`base_scale`, `point_1`/`point_2`, a shell's `edge`/`vertex`
chains, `chordal_error`, `front_face`. Each was worth validity, accuracy, or
both, and none needed a new algorithm.

That class is mechanically enumerable rather than a research task. The schema
files declare every field of every node type; `getField(node, "name")` is the
only way the reader can ask for one. So the set difference IS the work list.

⚠ It is a CANDIDATE list, not a defect list: many fields are genuinely derived,
obsolete (the spec says so of SHELL_s::body), or plumbing (`next`/`previous`).
It exists to be triaged, and the triage is the point.

⛔ THERE IS NO "RECOMMENDED SCHEMA VERSION" TO DIFF AGAINST, AND ASKING FOR ONE
IS THE WRONG QUESTION. Three DISTINCT roles are easy to conflate:

  * 12103  -- what our writer and CAD Exchanger EMIT (CLAUDE.md pins the writer
              to Parasolid major 12 / schema key 12103). It says nothing about
              what we READ: only 4 of the 217-model bar declare it.
  * 13006  -- the CDI BASE. `XtFile_Load.cpp:41` detects CDI by a fourth header
              token and `:138` then forces SCH_13006. Reachable only via a CDI
              file (exactly ONE in the bar: Mülltonne_BG).
  * whatever the file declares -- 24 families across the bar, spanning 10004 to
              37102, dispatched per file by `loadSchemaForVersion`.

The reader already dispatches per file and does so correctly, so the useful
property is not a version but each FIELD'S SPAN: which schemas declare it, the
earliest that does, and how many corpus models it therefore covers. That turns
"read the stated value, compute a fallback for older files" from a guess into a
trigger condition read straight off this table.

  usage: python fieldaudit.py <repo-root> [<schema-census.csv>]

    <schema-census.csv> is optional, `SCH_<a>_<fam>[_<cdi>],<model>` per line
    (see /c/tmp/schcensus2/all.csv). Without it the span is reported against the
    schemas on disk only, and the corpus columns are omitted.
"""
import os
import re
import sys
import collections

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SCHEMA = os.path.join(ROOT, 'src/formats/xt/schemas')
SRC = os.path.join(ROOT, 'src/formats/xt')
CENSUS = sys.argv[2] if len(sys.argv) > 2 else '/c/tmp/schcensus2/all.csv'

# ── what each schema declares: schema key -> node type -> {field: type-char} ──
# A node line is `<n> <NAME>; <Title>; ...`; a field line is `<name>; <t>; ...`.
node_re = re.compile(r'^\s*\d+\s+([A-Z_0-9]+);\s*[^;]*;')
# ⛔⛔⛔ THE MIDDLE DIGIT IS THE TRANSMIT FLAG, AND IGNORING IT INFLATED THIS
# AUDIT BY A THIRD. A field line is `<name>; <type>; <xmt> <count> <c>`, and
# `XtFile_Schema.cpp:141-143` acts on `xmt` explicitly:
#
#     const int xmt = std::stoi(m[3].str());
#     if (xmt == 0) {
#         // not transmitted -> not in stream
#     }
#
# An `xmt == 0` field is NEVER WRITTEN TO THE FILE, so it cannot be a field we
# "drop" -- it was never there. Measured over 217 models: **183 of 185 xmt=0
# fields never appear in a single node**, against 380 xmt=1 fields that do.
#
# This is what `BLENDED_EDGE.approx_spine` turned out to be. It was ranked
# ⭐⭐ on the strength of its schema line -- "a stated blend-spine approximation
# with its tolerance, so the blend baker may not need to construct what the file
# already states" -- and it is `approx_spine; p; 0 1008 0`. Flag zero. Parasolid
# never transmits it. Same for `face_box`, `edge_box`, `body_box`, `pbox`,
# `tree`, `polyline`, `safe_u_range` and the rest of the "PERF: stated bounding
# boxes we recompute" row of the old triage table.
field_re = re.compile(r'^\s*([a-z_0-9]+);\s*([a-z]);\s*(\d+)')

per_schema = {}
notxmt = set()     # (node, field) declared with xmt=0 -- never in any stream
for fn in sorted(os.listdir(SCHEMA)):
    if not fn.endswith('.sch_txt'):
        continue
    key = fn[len('sch_'):-len('.sch_txt')]
    d = collections.defaultdict(dict)
    cur = None
    for line in open(os.path.join(SCHEMA, fn), encoding='latin-1'):
        m = node_re.match(line)
        if m:
            cur = m.group(1)
            d[cur]  # a node with no fields still exists in this schema
            continue
        m = field_re.match(line)
        if m and cur:
            if m.group(3) == '0':
                notxmt.add((cur, m.group(1)))   # never written to the file
                continue
            d[cur].setdefault(m.group(1), m.group(2))
    per_schema[key] = d

# Union across every schema -- the full candidate universe.
decl = collections.defaultdict(dict)
for d in per_schema.values():
    for node, fields in d.items():
        for f, t in fields.items():
            decl[node].setdefault(f, t)


def schema_rank(key):
    """Sort schemas oldest-first. Keys are `<n>` or `<n>_<m>`; both are numeric
    but `100_1000` must not sort as 1001000 beside 10004, so compare tuples."""
    return tuple(int(p) for p in key.split('_'))


ORDER = sorted(per_schema, key=schema_rank)


def span(node, field):
    """Every schema key declaring `node.field`, oldest first."""
    return [k for k in ORDER
            if field in per_schema[k].get(node, {})]


# ── the corpus: which schema FAMILIES the measured models actually declare ────
# A header reads `SCH_<modeller>_<family>` or, for CDI, `SCH_<m>_<family>_13006`
# -- so the family is the 3rd token, and a 4th token means CDI (base 13006).
corpus_models = collections.Counter()   # family -> models declaring it
cdi_models = 0
if os.path.exists(CENSUS):
    for line in open(CENSUS, encoding='utf-8', errors='replace'):
        line = line.strip()
        if not line or ',' not in line:
            continue
        tok = line.split(',')[0].split('_')
        if tok[0] != 'SCH' or len(tok) < 3:
            continue
        corpus_models[tok[2]] += 1
        if len(tok) >= 4:
            cdi_models += 1
    # A CDI file resolves its base fields through SCH_13006, so that schema is
    # reachable too -- but only by those files.
    if cdi_models:
        corpus_models['13006'] += 0
CORPUS = {k: v for k, v in corpus_models.items() if k in per_schema}
CORPUS_MODELS = sum(CORPUS.values())
UNKNOWN_FAM = sorted(k for k in corpus_models if k not in per_schema)

# ── what the reader asks for ─────────────────────────────────────────────────
# ⛔⛔ ENUMERATING THE HELPERS THAT TAKE A FIELD NAME IS THE WRONG DESIGN, AND IT
# PUT A FALSE POSITIVE AT THE TOP OF THIS LIST TWICE IN ONE SESSION:
#
#   HALFEDGE.forward   #1 by population (221,867 nodes, 100% live) -- READ, via
#                      iterChain(view, start, "forward", node::HALFEDGE)
#                      (XtIR_Extractor.cpp:134).
#   FACE.next_front    45,812 live -- READ, via buildFaces(..., "next_front")
#                      (XtIR_Extractor.cpp:338), an ordinary parameter.
#
# Both were "unread" only because the name reached the DOM through a helper I
# had not thought to list, and each one cost a detour before the code disproved
# it. Any C++ identifier can forward a field name, so the helper list can never
# be complete.
#
# So DO NOT CLASSIFY ON THE HELPER. Take every lowercase string literal in the
# XT sources as "mentioned" and report two confidence tiers:
#
#   ASKED     the literal appears inside a known field-reading helper
#             -> definitely read
#   MENTIONED the literal appears anywhere in src/formats/xt
#             -> probably read; verify at the call site before ranking it
#   UNSEEN    the name appears nowhere at all
#             -> the high-confidence work list
#
# The asymmetry is deliberate. A false "unread" sends a session chasing code
# that already exists; a false "read" only hides a candidate. Over-approximate
# what counts as read.
# ⛔⛔⛔ AND THE SCAN MUST EXCLUDE THE WRITER. `GEOMETRIC_OWNER.shared_geometry`
# (24,701 nodes, 100% live) was suppressed as "mentioned" because it appears in
# XtWriteNodes_Edge.cpp:189 and four sibling write sites -- the writer EMITS the
# field, which says nothing about whether the reader consumes it. Scanning the
# whole XT tree hides exactly the read-side gaps this audit exists to find.
WRITE_PKGS = ('XtWrite', 'XtWriteNodes', 'XtWriteShape')


def read_side(dirpath):
    rel = os.path.relpath(dirpath, SRC).replace(os.sep, '/')
    return not any(rel == p or rel.startswith(p + '/') for p in WRITE_PKGS)

ASKERS = ('getField', 'iterChain', 'fieldOf', 'buildFaces')
asked = set()
mentioned = set()
for dirpath, _dirs, files in os.walk(SRC):
    for fn in files:
        if not fn.endswith(('.cpp', '.h')):
            continue
        text = open(os.path.join(dirpath, fn), encoding='utf-8',
                    errors='replace').read()
        if read_side(dirpath):
            mentioned.update(re.findall(r'"([a-z][a-z_0-9]{2,})"', text))
        for helper in ASKERS if read_side(dirpath) else ():
            for call in re.findall(helper + r'\s*\(([^;]{0,200}?)\)', text):
                asked.update(re.findall(r'"([a-z_0-9]+)"', call))
        # a few sites name the field through a local constant
        asked.update(re.findall(r'"([a-z_0-9]+)"\s*\)\s*;\s*//\s*field', text))
seen = asked | mentioned

# Structural plumbing every reader walks by other means, and the chain fields
# the extractor follows positionally rather than by name.
PLUMBING = {'next', 'previous', 'owner', 'node_id', 'attributes_features',
            'geometric_owner', 'body', 'shell', 'face', 'loop', 'fin', 'edge',
            'vertex', 'region', 'ws'}

GEOM = ('SURFACE', 'CURVE', 'PLANE', 'CYLINDER', 'CONE', 'SPHERE', 'TORUS',
        'BLEND', 'BLENDED_EDGE', 'INTERSECTION', 'CHART', 'TRIMMED_CURVE',
        'SP_CURVE', 'PE_CURVE', 'B_CURVE', 'B_SURFACE', 'OFFSET', 'SWEPT',
        'SPUN', 'LIMIT', 'FIN', 'EDGE', 'FACE', 'LOOP', 'SHELL', 'REGION',
        'BODY', 'VERTEX', 'POINT', 'LINE', 'CIRCLE', 'ELLIPSE', 'PARABOLA',
        'HYPERBOLA', 'NURBS')

rows = []
for node, fields in sorted(decl.items()):
    if not any(g in node for g in GEOM):
        continue
    missing = [f for f in fields if f not in seen and f not in PLUMBING]
    if missing:
        rows.append((node, len(fields), missing))

rows.sort(key=lambda r: -len(r[2]))
total = sum(len(r[2]) for r in rows)

print('node types carrying UNREAD fields: %d   unread fields: %d' % (len(rows), total))
print('excluded as NOT TRANSMITTED (schema xmt=0, %s:141-143): %d (node,field) pairs'
      % ('XtFile_Schema.cpp', len(notxmt)))
print('schemas on disk: %d   (%s .. %s)' % (len(ORDER), ORDER[0], ORDER[-1]))
if CORPUS:
    print('corpus: %d models, %d schema families (%s .. %s), %d CDI' % (
        CORPUS_MODELS, len(CORPUS),
        min(CORPUS, key=schema_rank), max(CORPUS, key=schema_rank), cdi_models))
else:
    print('corpus: no census supplied (%s) -- span reported against disk only'
          % CENSUS)
if UNKNOWN_FAM:
    print('⚠ corpus declares schema families with NO table on disk: %s'
          % ' '.join(UNKNOWN_FAM))
print()

# ── section 1: the node summary (unchanged shape) ─────────────────────────────
for node, n, missing in rows:
    print('%-26s %2d/%-2d unread   %s' % (node, len(missing), n,
                                          ' '.join(sorted(missing))))

# ── section 2: per-field SPAN -- the column that decides stated-vs-fallback ───
#   ALWAYS      declared in every schema on disk -> read it, no fallback ever
#   CORPUS-ALL  declared by every corpus family  -> safe today; a fallback is
#               needed only for files older than `first`
#   PARTIAL     some corpus families lack it     -> needs a fallback NOW
#   ABSENT      no corpus family declares it     -> unreachable by the bar
print()
print('=' * 78)
print('PER-FIELD SCHEMA SPAN -- read "stated value vs computed fallback" off this')
print('=' * 78)
print('%-22s %-22s %6s %9s %8s  %s' % (
    'node', 'field', 'disk', 'earliest', 'models', 'verdict'))

detail = []
for node, _n, missing in rows:
    for f in sorted(missing):
        have = span(node, f)
        first = have[0] if have else '-'
        cov = sum(CORPUS.get(k, 0) for k in have if k in CORPUS)
        fams = [k for k in have if k in CORPUS]
        if len(have) == len(ORDER):
            verdict = 'ALWAYS'
        elif not CORPUS:
            verdict = 'span %d/%d' % (len(have), len(ORDER))
        elif not fams:
            verdict = 'ABSENT from corpus'
        elif len(fams) == len(CORPUS):
            verdict = 'CORPUS-ALL (fallback < %s)' % first
        else:
            verdict = 'PARTIAL %d/%d families' % (len(fams), len(CORPUS))
        detail.append((cov, node, f, len(have), first, verdict))

# Most-covered first: those are the ones a change can be measured on today.
detail.sort(key=lambda r: (-r[0], r[1], r[2]))
for cov, node, f, nhave, first, verdict in detail:
    print('%-22s %-22s %3d/%-3d %9s %5d/%-3d  %s' % (
        node, f, nhave, len(ORDER), first, cov, CORPUS_MODELS, verdict))

# ── section 3: the counts that decide where the work is ──────────────────────
byv = collections.Counter(r[5].split(' (')[0].split(' ')[0] for r in detail)
print()
print('verdict counts: ' + '  '.join('%s=%d' % kv for kv in sorted(byv.items())))
