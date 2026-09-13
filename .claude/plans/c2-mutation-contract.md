# C2 MUTATION CONTRACT — cap/band face-builder family (s80, agent-extracted, OCCT-verified)

*The boundary spec for Stage C2 (decide/assemble split of the cap/band builders), extracted
by a dedicated read of PolarCap/Caps/Bands/Kit + OCCT's BRep_Builder.cxx. Every claim
carries file:line. This document gates the C2 refactor AND the B2.4 settle-kill retry.*

## 0. Ground truths (verified in external/occt/src/BRep/BRep_Builder.cxx)

| Call | What it mutates | Evidence |
|---|---|---|
| `UpdateEdge(E, pc, S, L, Tol)` | The **TEdge**: replaces-or-appends the curve rep keyed by (surface handle, location) via `UpdateCurves`, then **widen-only** `TE->UpdateTolerance(Tol)` | BRep_Builder.cxx:640-657 |
| `UpdateVertex(V, par, E, Tol)` | If V sits FORWARD/REVERSED on E: writes `GC->First/Last` on **E's** curve reps (edge-side); otherwise appends a point rep to the **TVertex**. Always **widen-only** `TV->UpdateTolerance(Tol)` on the vertex TShape | BRep_Builder.cxx:1194-1274 (branch 1245-1264, tol 1272) |
| `BRepBuilderAPI_MakeEdge(curve, V1, V2)` | Does **NOT** call `UpdateVertex` — minting an edge on a shared vertex does not mutate the vertex TShape | BRepLib_MakeEdge.cxx: zero UpdateVertex hits |
| `BRepLib::SameParameter(face, tol, true)` | Walks **every edge in the face** — cached/shared included — re-approximating pcurves, flipping SameParameter/SameRange flags, widening edge/vertex tolerances in place | call sites per builder below |

Tolerance movement in this family is **exclusively widen-only** — no direct `->Tolerance(x)`
setter anywhere in the four files.

**The wireFromLoop trap (every builder):** each opens with `wireFromLoop(ctx, …)` "for its
side effect". Cache MISS populates edge/vertex/orientation caches (guarded emplace,
first-writer-wins). Cache HIT is *not* a no-op: `edgeForFin` calls
`attachPcurveToEdge(ctx, cached->second, faceSurface, …)` (XtTopoDS_Edge.cpp:346-350) — the
"populate" call already **mutates the shared cached TShape** before the builder's body runs.
`wireFromLoop` also reads `ctx.ring_splits` to expand split rings (XtTopoDS_Loop.cpp:760-780).

**Registries this family NEVER touches:** seam_rotated_rings / seam_rotated_ring_tshapes
(written only in Face_Loops.cpp:2704, 2710, 3793-3794) and minted_seam_edges (only
Face_Loops.cpp:4159). ⚠ Contract gap: cap/band builders **mint seam edges holding shared
vertices and never register them** — the tryRotate holder-scan blind spot
(Context.h:231-240, the ucf-209 class). A refactor must NOT silently "fix" this
(behaviour change); carry as-is or gate.

## 1. sphericalPolarCapFaceRaw — PolarCap.cpp:157-767 — **HARD** (degradable to MEDIUM)

Runs when `gates.polar_cap_raw && isPolarCapFace(...)`, after the seam-ring builders
declined (Face.cpp:1566-1588).

Registry writes: wireFromLoop population (:188); `ring_splits[ce.edge_key] → 2 minted
halves` at :444-445 (`splitAtSeamAzimuth`; :346 skips already-split; gated
`polar_cap_pole_from_loop && northByFile && polar_cap_seam_split` :306/:468). Write-once
per key, but the half TShapes are **freshly minted per invocation** — a replay produces
different TShapes.

Shared-TShape mutations: :188 pcurve attach on every cached loop edge (hit path); :425/:428
widen-only vertex tol on the cached ring's shared vertices ov1/ov2 (:407); :657
`UpdateEdge(pcurve)` on every cached chain edge; :725 `BRepLib::SameParameter(occFace)`.

Order-dependent reads: edge_cache (:199-200); ring_splits (:211-220, :346); cached-edge
curve/range (:248-250, :347-348); **`BRep_Tool::SameRange/SameParameter(base)` :437-438**
(halves inherit flags a neighbour's SameParameter pass may have flipped);
**`CopyPCurves(e, base)` :435** (copies whatever pcurves are attached AT THAT MOMENT);
`BRep_Tool::Tolerance(base)` :414 + captol scan :741-745; chain-head vertex :661-663.

Classification: ring_splits+halves = MINT with cross-face ALIGNMENT effect; :657 pcurve
author = ALIGNMENT (on an aliased surface object it REPLACES a neighbour's pcurve,
Context.h:154-166); :425/:428 = IDENTITY-PRESERVING (widen-only); :725 = MIXED (tol widen
identity-preserving; flag flips + re-approx on shared edges = ALIGNMENT).

Mutate-then-bail: :470 (splits committed :444 + vertex tols widened, then pickStart failed —
splits stay for every later face); :656 mid-loop (edges 0..i-1 re-pcurved); :738 bare null
on BRepCheck fail (no declineReport — chain logs accepted-but-null at Face.cpp:1584-1587);
:756 bare null on captol.

Degrading HARD→MEDIUM: the file itself states the cut set makes the post-split outcome
"predictable read-only" (:331-337) — cycle (i) can be predicted into a plan struct. Cycle
(ii) = §8.

## 2. ringCapSharedRingFace — PolarCap.cpp:787-1051 — **MEDIUM (near-EASY)**

Called only from ringCapFaceRawImpl :1128 (flag polar_cap_share_ring). Registry writes:
wireFromLoop only (:811). Mints a seam edge on the shared ring vertex :898-900 —
UNREGISTERED (ucf-209 blind spot).

Shared mutations: :811 hit-path pcurve attach; :864 `UpdateEdge` full-period interp pcurve
on the cached ring; :979 `BRepLib::SameParameter` inside `assemble`.
⚠ :998-999 **TRACE-ONLY DOUBLE-ASSEMBLE**: under CADI_XT_DBG_SEAMFACE, assemble() runs a
SECOND time with opposite winding — a second SameParameter pass over the shared ring. A
behaviour-affecting trace; the refactor must not inherit it into the commit path.

Order-dependent reads: edge_cache :812-814; **TopExp::Vertices(ring) :816-818** — the ring
vertex is exactly the TShape tryRotate moves in place, so the minted seam's anchor is
order-dependent; ring curve/range :822-837.

Mutate-then-bail: :891 seam-run-degenerate AFTER the :864 UpdateEdge; :1048
self-check-invalid after :864+:979 (discarded face leaves pcurve+SameParameter effects on
the shared ring). Pre-write declines are clean: :814, :818, :841-847, :863.

Split shape: every decision up to :864 is read-only; the one decision between :864 and
assemble (:891) reads pre-computed values and can precede the write. Residual: §8 + the
trace double-assemble.

## 3. ringCapFaceRawImpl :1053-1164 + wrappers :1168-1195 — **EASY** (own tail)

Own tail write-free. Delegates to §2 (and ⚠ if the delegate declines AFTER its :864
mutation, the impl continues to the natural-bounds path anyway — the :1141-1143 comment is
NOT true of shared state). Natural-bounds path (:1147-1152): MakeFace on a trimmed copy,
every boundary edge minted inside OCCT, unregistered, no ctx writes.
**Call-site registry write: `++ctx.ring_cap_trim_count` at Face.cpp:1595** — feeds the
body-level trim re-close sewing gate = ALIGNMENT-class write living at the CALL SITE; the
C2 boundary must own it.

## 4. encirclingApexCapFaceRaw — Caps.cpp:63-319 — **MEDIUM with a small plan struct**

Runs when `gates.cone_apex_cap_raw && isConeApexCapFace(...)` (Face.cpp:1613-1627).
Registry: wireFromLoop only (:107); READS ring_splits (:131-137, cap_use_ring_split), never
writes. Shared mutations: :107 hit-path attach; :254 `UpdateEdge(pinnedInterpPcurve)` on
every cached chain edge (incl. ring_splits halves) — the file's own header :13-14 states
the mutation; :292 SameParameter.

Order-dependent reads: edge_cache :110-111; ring_splits :132; walkChainUv :147/:174/:225
(read-only); **preMtol = max chain tolerance :163-166 → the balloon bar :307 is
`max(100·tol, 5e-5·lf, 2·preMtol)` — a neighbour's earlier widening LOOSENS this builder's
acceptance bar** (decision-changing read); chain-head vertex :262-264.

Mutate-then-bail: :253 interp-fail mid-loop; :299/:307/:311/:318 all after :254/:292.
Chain-level: under cap_with_holes an ACCEPTED face is nullified at Face.cpp:1656-1661 when
capAddHoleWires fails — after all shared writes (and capAddHoleWires ran its own
wireFromLoop population, Face_Loops.cpp:528).

Plan struct: {ordered chain + senses, edgeUv, anchor index, uHi/uLo, vApex, fitted
pcurves}. All decisions (chain flip :167-178, seam-anchor rotation :220-236, bounds
:239-243) complete read-only before the first shared write at :254.

## 5. cylBandFaceRaw — Bands.cpp:70-471 — **MEDIUM with a small plan struct**

Runs from the RESCUE site Face.cpp:3182-3197: only when the built generic face is
BRepCheck-INVALID. On success caller re-applies face.sense (:3192-3193); **on decline the
caller KEEPS the invalid generic face (:3191-3195) — which now sits over chain edges this
builder already re-pcurved** (see bails).

Registry: wireFromLoop for the chain loop only (:117). Does NOT consult ring_splits. The
ring is rebuilt from the IR curve (:142-151), not the cache (s44 note :371-394).

Shared mutations: :117 hit-path attach; :288 `UpdateEdge(pinnedInterpPcurve, base, …)` on
every cached chain edge — **keyed on `base` (untrimmed cylinder :84-89), a different pcurve
key than the face surface**; :442 SameParameter. Minted (face-local): vertRing+ringNew
:395-406, seam :422-427.

Order-dependent reads: edge_cache :120-123; walkChainUv :131/:189/:260; preMtol :135-139 →
balloon bar :455 (same loosening as §4); **BRep_Tool::Pnt(vertSeam) :411-416** — the seam
line's 3D anchor moves if a neighbour moved that shared vertex.

Mutate-then-bail (all return null while the KEPT generic face's chain edges carry the
band's re-authored pcurves on base): :287 mid-loop; :303; :320; :419; :449; :456; :463;
:470. Pre-write declines (clean): :80-81, :92, :113, :122, :134, :164, :179, :193, :271.

Plan struct: {chain order+senses, edgeUv, uEntry/uExit/uLine, vCircle, ringBelow, circle
frame, pcurves}. Must preserve caller-keeps-invalid-face-on-decline semantics bit-for-bit.

## 6. Kit helpers (writes count as the caller's)

walkChainUv :34-66 read-only · pinnedInterpPcurve :68-108 read-only ·
attachSeamIsoPcurves :110-126 mutates the PASSED edge only (SameRange(false) :120,
SameParameter(false) :121, two-pcurve UpdateEdge :122, Range :123, flags again :124-125) —
every current caller passes a same-call minted seam ⇒ face-local. **If a refactor ever
routes a CACHED edge through it, those stamps become shared ALIGNMENT writes — the contract
line to hold.** · mintDegeneratePoleEdge :128-146 fully face-local, no ctx param.

## 7. Grep completeness sweep

PolarCap: UpdateVertex :425 :428 only; UpdateEdge :657 :864; SameParameter :725 :979;
Range/SameRange/SameParameter(bld) :431 :436 :437 :438; CopyPCurves :435; tol reads :148
:414 :743. Caps: UpdateEdge :254; SameParameter :292; no UpdateVertex; tol reads :165 :302.
Bands: UpdateEdge :288 (shared) :403 (minted); SameParameter :442; no UpdateVertex; tol
reads :138 :452. Kit: UpdateEdge :122 :139; Range :123 :144; SameRange :120 :124;
SameParameter :121 :125. No `->Tolerance(` setter anywhere. declineReport/mint*Trace are
print-only; no build_events writes from the family. Predicate side effect: isPolarCapFace
calls vertexFor (Face_Loops.cpp:306) ⇒ vertex_cache emplace even when the builder never
runs. Prologue side effect upstream: splitEdgesCrossingPole under pole_split
(Face.cpp:1440-1441) writes ring_splits before any builder.

## 8. THE FAMILY-WIDE BLOCKER the C2 split must design around

Every builder that mutates shared chain edges decides accept-vs-decline only AFTER
`BRepLib::SameParameter` has mutated them (PolarCap :725→:729/:746; ringCapShared
:979→:993; Caps :292→:298/:307/:311; Bands :442→:448/:455/:462). A DECLINED build is not
side-effect-free — pcurves, SameParameter flags and widened tolerances persist, and the
settle loop launders them into a fixpoint. This is why B2.4's decide-only planner regressed
Mülltonne_BG / electrolytic-capacitor-radial-1 / gs-14-kaplin-1: the plan replayed decisions
but not these build-time shared writes. A faithful split must either
(a) run the acceptance probe on CLONED TShapes and commit mutations only on accept — a
behaviour change at every mutate-then-bail site above (each currently leaves state later
faces consume), or
(b) keep the probe on live TShapes and accept that "decide" includes today's mutations —
the commit point moves, the writes don't.

**Difficulty summary:** ringCapFaceRawImpl+wrappers EASY · ringCapSharedRingFace MEDIUM
(near-EASY) · encirclingApexCapFaceRaw MEDIUM · cylBandFaceRaw MEDIUM ·
sphericalPolarCapFaceRaw HARD (degradable to MEDIUM via the :331-337 predictable-cut fact).
