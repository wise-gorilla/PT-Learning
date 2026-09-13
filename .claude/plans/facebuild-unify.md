# FACEBUILD-UNIFY — collapsing the 9-builder face chain into one construction model

*s79. Researched fresh at HEAD `f96218f` per the user's instruction to trust neither memory
nor comments. Five parallel investigations (builder anatomy ×2, CADEx decompile, spec,
OCCT 7.9.3 natives) + both censuses re-run from scratch + a fresh Winters profile.
Regression bar: the 187-model bundle (user-authorized 2026-08-05) per increment; the 221
extended bar + born-valid at stage boundaries.*

---

## 1. VERDICT

**YES — the collapse is possible, and it is worth doing for all four goals (LOC,
performance, maintainability, faithfulness/born-valid). But the mechanism is NOT "make
each builder more spec-faithful so rungs disappear."** The fresh censuses reconfirm the
chain is a disjoint SWITCH: zero accepted-but-null over 221 models — no builder ever
fails after its predicate accepts, so there is no failing rung to fix away.

The mechanism is a **unified construction model**: one face path in which seams, poles,
periods and ring placement are per-loop *properties computed once from stated data*,
not rival builders chosen by measuring predicates. Four independent lines of evidence
say this is sound:

1. **The spec states exactly one construction algorithm.** The only branches the FILE
   makes are the three stated loop forms (isolated vertex / single-fin ring / fin ring,
   `xt_v35:1232-1236`) and the tolerant/accurate dichotomy (`xt_v35:1245`). A seam needs
   no detection — it is an edge whose two fins are both on this face (`xt_v35:1216,
   1379`), stated data. **Polar cap, cone apex cap and torus V-seam exist nowhere in the
   file** — the pole is only the surface's v-range end (`xt_35_fd:4203`), the loop
   taxonomy is a PK *query* (`xt_35_fd:1182`), not data. All cap/seam specialisation is
   target-representation work, decidable uniformly from surface periodicity+singularity.
   The one thing the file genuinely under-determines: which loop is outer
   (`xt_35_fd:1094`) — a universal post-step, not a special case.

2. **CADEx is the existence proof on our own library.** One `GTopo_FACEDriver::Paste`,
   one loop/fin walker, one coedge/pcurve routine. Its only branches: naturally-bounded
   vs wired (topology, not surface class), blend→B-spline approximation (geometry
   substitution), one pole repair on revolution surfaces (geometry fix). Seam = edge
   seen twice on one surface → `ShapeAnalysis_Curve::SelectForwardSeam` + the
   two-pcurve `UpdateEdge` (`BRep_CurveOnClosedSurface`). Pole = coedge with no owning
   curve → the stock degenerate-edge idiom. Period = `ElCLib::AdjustPeriodic` in one
   shared routine. **Caveat that shapes our whole design: CADEx is NOT born-valid — it
   ships raw output into a whole-body `ShapeFix_Shape` (default ON; 11/187 valid
   without it).** We carry the born-valid burden ourselves (190/221, no heal). So the
   collapse target is CADEx's *shape* with our builders' *content*: the seam-mint,
   degen-mint and window-placement work stays; only its 5–9× duplication dies.

3. **Our own builders already agree.** Every builder ends in the same raw
   `BRep_Builder::MakeFace` + `Add` of wires from the shared `ctx.edge_cache`. They
   differ only in: (a) which pcurve author runs, (b) seam stated vs minted, (c) which
   shared-edge mutations they may make (rotate/split/reseat), (d) where the sense law
   lands. **~70–80% of the ~10,945 lines is duplicated infrastructure**: the
   whole-period chain-unwrap in ≥9 hand-inlined copies; seam-pair minting under 5
   different slot-order conventions; 3 degenerate-edge minters; 3 slit-droppers; the
   trimmed-basis periodicity trap solved 5×; walkUv ×5; pinned-interpolate pcurve
   author ×4; the balloon guard as 2 laws in 4 of 6 places. The cap family is ONE
   abstract recipe instantiated 6× over 7 axes (only one axis — the closing element —
   is OCCT-forced). `analyticSeamRingRaw` and `torusVSeamRaw` are each other transposed
   (u↔v) with independently evolved guards.

4. **OCCT 7.9.3 ships native, EXACT replacements for our hand-rolled math** (§5), and
   its own STEP translator is an in-house generic face path (`StepToTopoDS_Translate*`).

5. **Datakit (non-OCCT, decompiled `CrossCadWare_split`) is the third witness — and the
   sharpest.** Its kernel-neutral model matches Parasolid ONE-TO-ONE (fin carries sense +
   optional SP-curve; loop = ordered fin list, no outer mark; vertexless ring edges fine;
   `Dtk_Coedge`/`Dtk_Loop`/`Dtk_Face` layouts read from the decompile), and its Parasolid
   reader does **NONE of the five OCCT chores at read time**: no seam minting, no
   degenerate pole edges, no period-window placement, no outer-loop determination, and
   **no pcurve derivation at all** (pcurves are lazy 2D∘surface compositions; accurate
   edges simply have none). No healing, no sew, no check. Where such work exists in
   Datakit at all, it is on the WRITE side, per target format (`PsWriter` holds the 2π
   handling; the Rhino exporter holds `NewOuterLoop`). **So all five chores are
   OCCT-representation demands, not XT-inherent — independently confirming that our
   builders' per-face-class dispatch dimension is artificial.** ⚠ Caveats: Datakit's
   output quality is unverified (user has no Datakit-produced files); its SP-curve
   tolerance is a coarse 1e-3; and it can defer because its model IS Parasolid-shaped —
   we cannot (OCCT BRep is our only representation), so the five chores stay in our
   reader. What transfers is their PLACEMENT: one uniform XT-graph→OCCT mapping layer,
   branched on properties (seam-needed / pole-present / window), never on face class.
   The write-side follow-up confirms the boundary principle from the other direction:
   Datakit's Parasolid WRITER is where the chores appear when the TARGET demands them —
   it mints a seam edge + vertex on closed faces (`DtkParasolidWriter.cpp:1395-1708`),
   applies per-face ±2π UV remaps to every pcurve, and emits poles as Parasolid
   VERTEX-LOOPS (single self-linked fin, sense 2 — never a degenerate edge), while its
   STEP writer emits `FACE_OUTER_BOUND` from a stored `Dtk_Loop::IsOuter` flag it never
   computes. Chores live at the representation boundary, once per target — exactly
   where Stage E puts ours.

## 2. THE PERFORMANCE CASE (measured at HEAD, this session)

- `face.build` is now the **largest block**: 2,210 ms of a 5,654 ms profiled Winters
  build (~39%), ahead of blend prebuild (1,824 ms). `face.wires` 1,531 ms,
  `edge.attach_pcurve` 1,069 ms / 19,452 calls inside it.
- **4,208 `face.build` calls for 1,048 unique faces = 4.01×.** The settle fixpoint
  (`XtTopoDS_Body.cpp:1315-1409`) rebuilds every face until ring rotations/splits stop,
  keeping only the last pass: **~75% of the top profile block is discarded work**
  (~1,650 ms on Winters). Root cause: `tryRotate`/`trySplit` mutate shared ring edges
  *during* face assembly; the settle loop is the workaround, and it is also the root of
  the face-order dependence class (144/187 byte-unstable under `FACE_ORDER=rev`).
- Measuring predicates: `isPolarCapFace` projects every loop vertex via
  `ShapeAnalysis_Surface::ValueOfUV` (iterative) before a cap is even chosen;
  `isRingCapFace`/`isRevRingCapFace` sample 7 points per candidate. `ElSLib::Parameters`
  is closed-form; loop-winding classification computes the same answer once.
- Boundary pcurves are built by 12/24/64-sample `Geom2dAPI_Interpolate` where ProjLib
  gives an exact `gp_Lin2d`/conic — cheaper AND smaller (the 1105 vs 471 bytes/pcurve
  gap vs CADEx is exactly this signature) AND more accurate.

Expected (to be measured per increment, never banked from this table):
settle-kill ≈ −1.0…−1.6 s on Winters; predicate + exact-pcurve wins on top; LOC
Face family 10,945 → ~4,000–5,000.

## 3. TARGET ARCHITECTURE — the unified model

For each face: **classify → plan → build once.** Module boundary (per the three-witness
triangulation — spec, CADEx, Datakit): the XT side stays file-shaped (fins/loops/senses
consumed raw); the five OCCT chores (seam mint, degenerate pole edge, period window,
outer-loop pick, pcurve derivation) live in ONE mapping layer, branched on per-loop
properties, never on surface/face class.

1. **CLASSIFY (per loop, stated data + one cheap derived quantity):** the three stated
   loop forms; tolerant/accurate per edge; and the loop's winding vector (Δu,Δv) in
   whole periods — (±1,0)/(0,±1) = period-spanning boundary needing a seam or closing
   element, (0,0) = ordinary/hole. This single derived classification replaces the 9
   predicates (four of which measure today).
2. **PLAN (per body, BEFORE any face is assembled):** decide every shared-edge fact the
   builders currently discover mid-build — ring vertex/origin azimuth (`tryRotate`'s
   target), ring splits (`trySplit`'s parameters), seam azimuths constrained by hole
   occupancy, window placement anchors. Licence ladder (existing joint → rotate
   vertexless ring → split) becomes a planner over stated data. **This kills the settle
   loop and the order-dependence class in one move.**
3. **BUILD (once):** one wire assembler over `ctx.edge_cache`; one pcurve author
   (stated SP-curve → exact analytic inverse/iso → projection fallback, provenance
   fixed before numerics); one seam minter (axis-parameterised, one slot-order law);
   one degenerate-edge minter (STEP recipe); one window/recadre kit; one outer-loop
   post-step; one self-check/guard law. `face.sense` applied once.

## 4. STAGES

### Stage A — extract-and-dedupe (provable no-ops; sha256 187-bundle per commit)
- A1 period/window kit: one chain-unwrap + placeChain on `ShapeAnalysis::AdjustByPeriod`
  / `ElCLib::AdjustPeriodic` (replaces ≥9 copies: Face.cpp 320-356, 541-641, 149-181;
  Loops.cpp 1808-1893, 2157-2176, 2804-2820, 3820-3893, 4222-4260, 4649-4684, torusV
  1247-1266/1307-1323/1510-1548).
- A2 seam-mint kit: iso edge + two pcurves one period apart + `SameRange/Param(false)`;
  slot order parameterised (unify the 5 conventions in Stage C, not here).
- A3 degen-mint kit (3 copies), A4 slit-drop (3), A5 basis-unwrap (5), A6 walkUv (5),
  A7 ring-splits consumer under one helper (2 flags today), A8 pinned-interp pcurve
  author (4 copies; parameterise sample count).
- Where copies genuinely differ (guard laws, slot conventions): parameterise, preserve
  per-site behaviour exactly. Behaviour unification is Stage C.
- Expected: −2,500…−3,500 lines, hash-identical.

### Stage B — the plan pass kills the settle loop (behaviour-changing; the perf lever)
- B1 planner: rotations/splits/seam azimuths decided from stated data + hole occupancy
  before face assembly; `settle_rings_first/_fixpoint` and `ctx.settle_pass` deleted;
  face assembly runs once.
- Bars: 187 census + born-valid model-for-model + edge_dev; `FACE_ORDER=rev` must
  become byte-stable (the order-dependence dies or the increment is not done); timing
  interleaved min-of-3 profiler OFF. 221 + born-valid at stage end.

### Stage C — collapse the builders
- C1 `torusVSeamRaw` + `analyticSeamRingRaw` → one axis-parameterised seam-band
  constructor (they are transposes; reconcile guard sets by measurement — the v-builder
  has a BRepCheck self-gate, the u-builder has rotate/reseat/pin/holes).
- C2 cap family → one cap constructor over the 7 measured axes (closing element / pole
  source / anchor policy / chain source / orientation law / guard law / minting
  contract). ⚠ The orientation law is the hard axis — RINGWIND measured the fin-sense
  law and the pole-edge-pcurve law as NON-interchangeable (`Face_PolarCap.cpp:957-1007`);
  give it its own increment and its own census.
- C3 `periodicSeamRingRaw` folds into the stated-seam path (closeDoubleFinSeams +
  iso-mint when pcurve-less — same event, one handler).
- C4 dispatch → loop classification: the 9 predicates die; `periodicRingRaw` (already
  purely subtractive) becomes the trivial case of the unified path.

### Stage D — exact-pcurve upgrade (accuracy + LOC + bytes/pcurve)
- D1 ProjLib exact projections where `GetType()` proves exactness (analytic curve on
  analytic surface → `gp_Lin2d`/conic); keep the interpolate author as fallback. Gate:
  edge_dev holds-or-improves + b/pc oracle + census.
- D2 `ElSLib::Parameters` replaces `ValueOfUV` on analytic surfaces (predicates + caps);
  `ShapeAnalysis_Surface::ProjectDegenerated` for pole-UV completion — **this is the
  native fix shape for the P.5.1.3/null-marker completion defect.**
- D3 same-parameter: replace prove-by-sampling-then-stamp with `BRepLib_ValidateEdge`
  (read-only, has the closed-surface second-pcurve pass). Never `BRepLib::SameParameter`
  (moves geometry). ⚠ `ShapeConstruct_ProjectCurveOnSurface` (behind `FixAddPCurve`,
  today's generic fallback) is APPROXIMATE for non-planes (`ProjectAnalytic` is
  plane-only, `.cxx:484-486`) — routing analytic cases to ProjLib is an accuracy win.

### Stage E — one face path
- Generic path absorbs the unified constructors; `XtTopoDS_Face*.cpp` reorganised
  around classify/plan/build. Target ~4,000–5,000 lines total.

## 5. THE OCCT-NATIVE MAP (from `external/occt`, 7.9.3)

| our hand-rolled problem | native replacement | exactness |
|---|---|---|
| point→UV on analytic | `ElSLib::Parameters(gp_Pln/Cylinder/Cone/Sphere/Torus, P, U, V)` | closed-form; U∈[0,2π), sphere V∈[−π/2,π/2] |
| analytic curve → pcurve | `ProjLib::Project(gp_*, gp_Lin/Circ)`, `ProjLib_ProjectedCurve` + `GetType()` | exact for iso/generator cases; else approx — check GetType |
| period unwrap/recadre | `ElCLib::AdjustPeriodic`, `ShapeAnalysis::AdjustByPeriod/ToPeriod` | exact |
| seam slot pairing | `ShapeAnalysis_Curve::SelectForwardSeam` + `TopAbs::Compose` (STEP's exact sequence, TranslateEdgeLoop.cxx:644-669) | replaces our 5 conventions |
| seam authoring | `BRep_Builder::UpdateEdge(E, C1, C2, F, tol)` → `BRep_CurveOnClosedSurface`; PCurve=FORWARD, PCurve2=REVERSED (`BRep_Tool.cxx:338`) | native |
| degenerate edge | `Degenerated(true)` + straight `Geom2d_Line` pcurve, `Range[0,|Δuv|]`, no 3D curve (`ShapeFix_Wire.cxx:1851-1860`) | the BRepCheck-valid recipe |
| pole UV completion | `ShapeAnalysis_Surface::ProjectDegenerated` | fills the indeterminate coordinate from a neighbour |
| ring edges | OCCT has NO vertexless edge — closed edge = ONE vertex FWD+REV (`TranslateEdge.cxx:473-495`); exact ring geometry `ElSLib::*UIso/*VIso` → `gp_Circ` | native pattern |
| wire order | `ShapeAnalysis_WireOrder` (2D/3D, reversal detection); `ShapeExtend_WireData::IsSeam` | read-only |
| same-param verify | `BRepLib_ValidateEdge`, `ShapeAnalysis_Edge::CheckSameParameter` | read-only, no geometry moved |
| pcurve acceptance gate | `XSAlgo_ShapeProcessor::CheckPCurve` (¾-span + endpoint tests) | OCCT's own shipping gate |

## 6. RISK LEDGER — measured refutations this plan must respect

- ⛔⛔ **USER CONSTRAINT (2026-08-05, verbatim intent): do NOT copy CADEx as-is.** CADEx
  relies on OCCT healing (`ShapeFix_Shape` post-pass) and its faces are not born valid
  (11/187 with healing off). Ours are born valid BY CONSTRUCTION (190/221, no heal in
  the tree). CADEx contributes only the *architectural shape* (one path, data-driven
  seam/pole/period handling); every piece of born-valid content our builders carry —
  seam minting, window placement, degenerate-edge authoring, orientation derivation —
  survives the collapse. Any increment that trades born-valid count for uniformity
  auto-rejects.

- ⛔ Raw `MakeFace`+`Add` vs `BRepBuilderAPI_MakeFace(surf, wire, true)` on torus:
  144 vs 117 defects — the Inside flag is protective TODAY. The unified path keeps a
  containment post-step until the planner provably makes winding correct by
  construction. Gate per-increment; never assume.
- ⛔ s75: merging the two torus builders at dispatch level measured WORSE — merging
  without unifying construction only adds branching. This plan unifies construction
  first (A, B), collapses second (C).
- ⛔ Cap orientation laws are measured non-interchangeable (RINGWIND). C2's law gets
  its own increment.
- ⛔ No builder is dead (fresh census: all 9 fire; 0.7% tail is real coverage). Nothing
  is deleted until its case is absorbed and verified.
- ⛔ File senses alone are worse than what we build (blade: 61/216 vs 1/216 failing) —
  the derived wire orientation must survive into the unified path.
- OCCT traps carried forward: pcurves keyed by surface HANDLE (stable surface per
  face); `BRepBuilderAPI_MakeWire/MakeFace` copies sever TShape sharing; WireExplorer
  compares UV absolutely (recadre first); `BRep_Builder::Range` default stamps all
  representations.

## 7. VERIFICATION (standing)

- Provable no-op → 187-bundle sha256 IDENTICAL (user authorized 187 for regression).
- Behaviour-changing → census + born-valid (190/221 baseline, model-for-model diff) +
  edge_dev + b/pc; 221 bar at stage boundaries. sha256 is NEVER the bar for B–E.
- Timing: interleaved, min-of-3, profiler OFF; Winters noise floor ~200 ms.
- A change that cannot be verified is reverted, not banked.
- Hard stops unchanged: no push; no threading/PARALLEL_BAKE; never commit
  `.claude/settings.json` / `example_settings.ini`.
