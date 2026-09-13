"""FIELD POPULATION -- the gate the unread-field audit was missing.

`fieldaudit.py` answers "what does the SCHEMA DECLARE that we never read?" and
returns ~296 fields. It CANNOT answer "does any real file actually fill it in?",
and ranking its candidates without asking that is how a session gets spent on
fields no file states. Measured 2026-08-19, the first census killed BOTH of the
audit's ⭐⭐⭐ picks outright:

    SU_DEGENERACY        stated ZERO times across 217 models
    CURVE_DATA.tint      stated ZERO times across 5,294 CURVE_DATA nodes
    HELIX_SU/CU_FORM     stated ZERO times
    'D' degenerate bnd   2 boundaries, in 1 model

⭐⭐ A SCHEMA DECLARATION IS NOT A FILE STATEMENT. Batching the MEASUREMENT is
right -- it is batching the IMPLEMENTATION that is banned. One sweep prunes the
candidate list to the fields some file actually states, and only then is there
anything to rank.

Input is the assembled output of `/c/tmp/fieldpop.sh`, which runs
`cadi_direct --fieldpop` 20-way over the model list and emits, per model:

    FIELDPOP <node_type_number> <field> <live_nodes> <total_nodes>

"live" = present, not null, not the null-float sentinel (-3.14158e13), and not
an empty/all-null vector -- i.e. the file said something.

  usage: python fieldpop.py <repo-root> [<all.txt>]
"""
import os
import re
import sys
import collections

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
POP = sys.argv[2] if len(sys.argv) > 2 else 'C:/tmp/fieldpop/all.txt'
SD = os.path.join(ROOT, 'src/formats/xt/schemas')
SRC = os.path.join(ROOT, 'src/formats/xt')

# node type number -> name (numbers are stable across schemas)
name = {}
nre = re.compile(r'^\s*(\d+)\s+([A-Z_0-9]+);')
for fn in os.listdir(SD):
    if fn.endswith('.sch_txt'):
        for line in open(os.path.join(SD, fn), encoding='latin-1'):
            m = nre.match(line)
            if m:
                name.setdefault(int(m.group(1)), m.group(2))

pop = collections.defaultdict(lambda: [0, 0])
models = 0
for line in open(POP, encoding='utf-8', errors='replace'):
    p = line.split()
    if len(p) != 5 or p[0] != 'FIELDPOP':
        continue
    pop[(name.get(int(p[1]), 'NODE%s' % p[1]), p[2])][0] += int(p[3])
    pop[(name.get(int(p[1]), 'NODE%s' % p[1]), p[2])][1] += int(p[4])

# ⛔⛔ TWO CONFIDENCE TIERS, BECAUSE THE HELPER LIST CAN NEVER BE COMPLETE --
# any C++ identifier can forward a field name, and enumerating helpers put a
# false positive at the TOP of this very list twice in one session:
#
#   HALFEDGE.forward   #1 by population (221,867 nodes, 100%) -- READ, via
#                      iterChain(view, start, "forward", ...)
#   FACE.next_front    45,812 live -- READ, via buildFaces(..., "next_front"),
#                      an ordinary function parameter
#
# So `asked` (inside a known helper) is only the strong tier; `mentioned` (the
# literal appears anywhere under src/formats/xt) is treated as read too, and
# the difference is reported separately for eyeballing. Over-approximate what
# counts as read: a false "unread" costs a session chasing existing code, a
# false "read" only hides a candidate. Keep ASKERS in sync with fieldaudit.py.
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
for dp, _d, fs in os.walk(SRC):
    for fn in fs:
        if not fn.endswith(('.cpp', '.h')):
            continue
        t = open(os.path.join(dp, fn), encoding='utf-8', errors='replace').read()
        if read_side(dp):
            mentioned.update(re.findall(r'"([a-z][a-z_0-9]{2,})"', t))
        for helper in ASKERS if read_side(dp) else ():
            for call in re.findall(helper + r'\s*\(([^;]{0,200}?)\)', t):
                asked.update(re.findall(r'"([a-z_0-9]+)"', call))
seen = asked | mentioned

PLUMB = {'next', 'previous', 'owner', 'node_id', 'attributes_features',
         'geometric_owner', 'body', 'shell', 'face', 'loop', 'fin', 'edge',
         'vertex', 'region', 'ws'}

unread = [(k, v) for k, v in pop.items()
          if k[1] not in seen and k[1] not in PLUMB]
# Reported separately: named somewhere in the sources but not inside a known
# reader helper. Probably read through a parameter -- verify before ranking.
maybe = sorted([(k, v) for k, v in pop.items()
                if k[1] in mentioned and k[1] not in asked
                and k[1] not in PLUMB and v[0] > 0],
               key=lambda r: -r[1][0])
live = sorted([(k, v) for k, v in unread if v[0] > 0], key=lambda r: -r[1][0])
dead = [(k, v) for k, v in unread if v[0] == 0]

print('(node,field) pairs OBSERVED in the corpus : %d' % len(pop))
print('  UNREAD by our extractor                 : %d' % len(unread))
print('    LIVE somewhere (a file states it)     : %d   <- the real work list' % len(live))
print('    never live in any model               : %d   <- declared, file-silent' % len(dead))
print()
print('UNREAD *AND* STATED, by nodes carrying a value:')
print('  %-22s %-24s %>9s' % ('node', 'field', '') if False else
      '  %-22s %-24s %9s %9s %6s' % ('node', 'field', 'live', 'of', 'pct'))
for (n, f), (l, t) in live:
    print('  %-22s %-24s %9d %9d %5.0f%%' % (n, f, l, t, 100.0 * l / t))
print()
print('MENTIONED IN THE SOURCES BUT NOT VIA A KNOWN READER HELPER --')
print('VERIFY AT THE CALL SITE BEFORE RANKING (this tier held 2 false positives):')
for (n, f), (l, t) in maybe[:25]:
    print('  %-22s %-24s %9d %9d %5.0f%%' % (n, f, l, t, 100.0 * l / t))
print()
print('DECLARED BUT NEVER STATED (do not spend a session on these):')
for (n, f), (_l, t) in sorted(dead, key=lambda r: -r[1][1]):
    print('  %-22s %-24s 0 of %d' % (n, f, t))
