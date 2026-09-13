# C1 TRANSPOSE CONTRACT — analyticSeamRingFaceRaw (u) vs torusVSeamFaceRaw (v) (s86, agent-extracted)

*The boundary spec for Stage C1 (folding the two seam-band builders into one
axis-parameterised constructor). Extracted by a dedicated read of
XtTopoDS_Face_Loops.cpp / Face.cpp / Body.cpp / Context.h at HEAD; every claim
carries file:line, verified against code (comments distrusted per CLAUDE.md).
Abbreviations: FL = src/formats/xt/XtTopoDS/XtTopoDS_Face_Loops.cpp,
F = XtTopoDS_Face.cpp, B = XtTopoDS_Body.cpp, C = XtTopoDS_Context.h,
I = XtTopoDS_Internal.h, O = XtCommon/XtCommon_Opts.h.*

## 1. Function inventory

| function | signature | range |
|---|---|---|
| `torusVSeamFaceRaw` | `TopoDS_Face torusVSeamFaceRaw(XtTopoDS_Context& ctx, const ir::IR_Face& face, const Handle(Geom_Surface)& faceSurface, const ir::IR_Body& body, double tolerance)` | FL:1150-1700 (decl I:881-883) |
| `seamRingDecide` | `std::optional<SeamRingPlan> seamRingDecide(ctx, face, faceSurface, body, tolerance)` | FL:1707-3832 (decl I:753-757) |
| `seamRingAssemble` | `TopoDS_Face seamRingAssemble(ctx, face, faceSurface, body, tolerance, SeamRingPlan& plan)` | FL:3838-4475 (decl I:762-765) |
| `analyticSeamRingFaceRaw` (wrapper) | `TopoDS_Face analyticSeamRingFaceRaw(ctx, face, faceSurface, body, tolerance)` | FL:4477-4550 (decl I:872-875) |
| `isAnalyticSeamRingFace` (u predicate) | FL:988-1136; period helper `seamRingUPeriod` FL:963-986 | — |
| `splitEdgeHalf` (shared split helper) | FL:102-152, `pcurveRangeByFraction` parameterises the u/v drift | — |
| `SeamRingPlan` | C:119-138 (`Ring{e, pc, rest, v, uFrom, uTo}` C:120-126); cache `ctx.seam_plans` C:144 (keyed by IR-face ADDRESS) | — |

**Candidacy / builder-chain order (build pass, F):** periodicRingRaw F:1967 →
periodicSeamRingRaw F:1981 → **analyticSeamRingRaw** F:1997-2000 (gate
`opts().seam_ring_analytic && isAnalyticSeamRingFace`) → **torusVSeamRaw**
F:2035-2038 (gate `opts().torus_v_seam && DynamicType() ==
STANDARD_TYPE(Geom_ToroidalSurface)` — the predicate moved into the caller
guard, s75, F:2025-2034) → polarCap F:2057 → apex/rev caps F:2109/2125. So the
v-builder only ever sees torus faces the u-builder declined. Both, on success,
take the raw-ring early return **F:3413-3419: `face.sense` reversal applied to
the FACE FLAG only, then return** — this is the ONLY sense application torusV
ever gets (see §2 row 9).

**Planner-sweep order (B:1441-1586):** `cand.seam = seam_ring_analytic &&
isAnalyticSeamRingFace` B:1507-1508; `cand.torus = torus_v_seam && Toroidal`
B:1513-1515 — deliberately **NOT else-if** (stacked candidacy, B:1509-1512);
fixpoint (kMaxPlan=8) runs `seamRingDecide` B:1543 and, **only when that
declined**, the whole `torusVSeamFaceRaw` build B:1554-1556 (discarded, kept
for registry side effects); convergence metric = `ring_splits.size() +
seam_rotated_rings.size()` B:1538-1539/1566-1568; final decides cached into
`ctx.seam_plans` B:1571-1584.

**u-surface gate:** u-periodic OR (`seam_ring_trimmed`, O:2757) trimmed basis
covering the full period, FL:963-986; IR type Cylinder/Cone (+Torus/Sphere
under seam_ring_trimmed) FL:1059-1065. **v-surface gate:** exact
`Geom_ToroidalSurface` (a trim-wrapped torus NEVER reaches torusV — no basis
unwrap; in-builder assert FL:1168-1169), `IsVPeriodic()` FL:1170, exactly 2
loops FL:1171.

**Flags (all verified default-true):** `seam_ring_analytic` O:2736,
`seam_ring_trimmed` O:2757, `seam_ring_vertexed` O:3205, `torus_v_seam`
O:3362, `torusv_split_align` O:3426, `torusv_multiarc` O:3472.

**Trace envs:** `CADI_XT_DBG_SEAMFACE` — all sites, but PARSE DIFFERS:
u-side + wrapper + predicate require `[0]=='1'` (FL:998-999, 1717-1718,
4480-4481; F:2044-2047), torusV accepts any first char ≠ '0' (FL:1154-1157).
`CADI_XT_DBG_DECLINE` (declineReport, I:126-133; sites "SEAMRING",
"SEAMRING_BAIL", "TORUSV"), `CADI_XT_DBG_MINTEDGE` (splitRegTrace,
B:448-455), `CADI_XT_DBG_TOLSTAMP` / `CADI_XT_DBG_PCSHIFT` (Face_Kit.cpp:56,
166 — all print-only), `CADI_XT_DBG_NO_PLANNER` B:1441,
`CADI_XT_DBG_NO_PLAN_FIXPOINT` B:1533-1536, `CADI_XT_DBG_NO_PLAN_CACHE`
FL:4487.

## 2. Side-by-side phase map (the transpose table)

| # | phase | u-builder | v-builder | verdict |
|---|---|---|---|---|
| 1 | candidacy | standalone predicate FL:988-1136; admits vertexed rings (`seam_ring_vertexed` FL:1095-1110) and multi-fin chains FL:1111-1118; trim unwrap via seamRingUPeriod FL:963-986 | caller guard F:2035-2036 + asserts FL:1168-1171; single-fin ring with a STATED vertex declines `ring-vertex-is-stated` FL:1302-1303; chains only under `torusv_multiarc` FL:1211; NO trim support | TRANSPOSE-WITH-PARAM — gate sets differ by name: vertexed-ring admission, trimmed-basis admission, hole-loop admission are u-only |
| 2 | wireFromLoop populate | with a SCRATCH refFace FL:1742-1747, 1775 → `ShapeFix_Edge::FixAddPCurve` authors missing pcurves in place (stated FL:1732-1741, measured "21 of 21 bail ring-has-no-pcurve" without it) | with a NULL refFace FL:1214, 1304 → no pcurve authoring; missing pcurve = decline FL:1256, 1324 | TRANSPOSE-WITH-PARAM — refFace null-vs-scratch is a real authoring difference, not cosmetics |
| 3 | ring identification | classify the WIRE by measurement: single-edge FL:1784-1816 (constant-v + one-u-period FL:1793-1797); chain walk in stored insertion order FL:1843-1845, v-meet mod v-period FL:1879-1893, u-gap whole-period FL:1910-1918, u-span + v-close FL:1925-1931 | classify raw cache edges per fin: constant-u FL:1259-1261/1327-1328, traversal contiguity mod vPer FL:1276-1291/1341-1347, one-v-period FL:1292-1293/1349-1350; fin sense applied manually FL:1230, 1250 | TRANSPOSE-WITH-PARAM — same measurement transposed, but the ring SOURCE differs (wire objects with composed orientation vs edge_cache + hand-applied fin sense) and the contiguity bars differ (u-chain: 1e-7·period FL:1912 / v-multiarc 1e-7 FL:1279 vs v-single-fin 1e-9 FL:1344) |
| 4 | ring_splits consumption | implicit — `wireFromLoop` expands registered halves (Loop.cpp:760-780), decide sees them as chains | explicit lookup per fin FL:1239-1246 (multiarc) / FL:1311-1317 (single-fin), `torusv_split_align` | TRANSPOSE-WITH-PARAM — same registry, different mechanism |
| 5 | chain re-seat onto a joint | `reseat` FL:2790-2893 (rotates edge-list, re-reads run, updates Ring::v FL:2883) + pin-block reseat calls FL:3530-3535 | `std::rotate` of both piece lists to the matched joint FL:1528-1535 | TRANSPOSE-EXACT in shape (pure bookkeeping rotation, no writes) — u adds run-revalidation FL:2851-2867 the v-side does with its cursor-close FL:1577-1578 |
| 6 | joint choice / alignment target | hole-occupancy grid FL:3152-3338 (2048 bins, vertical-arc + hole marks), SEAMPIN candidate ladder FL:3339-3551 (shared joint → one-sided joint → gap midpoint), HOLEROT FL:3556-3567, then rotate/split ladder FL:3582-3611 | single azEq scan for a joint both rings carry mod vPer FL:1374-1386 (off `torusv_split_align`: both rings must START at one v FL:1369-1372) | TRANSPOSE-WITH-PARAM core (shared-joint-first law) + a large u-ONLY superstructure (grid/pin/holerot) — DIVERGENT beyond the first rung |
| 7 | vertex rotate | `tryRotate` FL:2480-2753 — moves the shared ring vertex IN PLACE (`tv->Pnt` FL:2726), re-Ranges every representation FL:2730, claims `seam_rotated_rings`/`_tshapes` FL:2716-2725 | NONE — deliberately (O:3424-3425: a v-rotate would move a vertex a neighbour placed; the v-split PRESERVES the existing vertex FL:1414-1417) | DIVERGENT — u-only machinery; its absence on the v side is a design decision backed by measurement, not a gap to fill |
| 8 | ring split | `trySplit` FL:2894-3151: aim = pinnedU/holeFreeU/other-ring FL:2921-2923, monotone-u bisection FL:3003-3021, ownGap vertex FL:3073-3110, halves via `splitEdgeHalf(..., pcurveRangeByFraction=TRUE)` FL:3111-3117, register FL:3119, **tail-recurse decide** FL:3590, 3609; runs in ANY pass | v-split FL:1412-1523: aim = the other ring's joint FL:1446-1448, cut-target law `si` (split/claimed/default-1) FL:1424-1432, chain targets refused FL:1441-1442, monotone-v bisection FL:1457-1477, ownGap vertex FL:1495-1501, `splitEdgeHalf(..., pcurveRangeByFraction=FALSE)` FL:1506-1513 (drift recorded FL:1502-1505), register FL:1514, **then DECLINE** `v-split-registered` FL:1523; **plan_pass-gated** FL:1423 | TRANSPOSE-WITH-PARAM — same construction, four named parameter differences: pcurveRangeByFraction (true/false), aim law, re-enter (recurse) vs decline, pass gating (any vs plan_pass-only) |
| 9 | whole-period window shifts | decide ARCMOD FL:2027-2052 (u AND v shifts, UpdateEdge FL:2043); PCORIGIN re-origin translate FL:2286-2334 (u-only, vertex-anchored); loshift FL:3748-3803; assemble placeChain FL:3933-4010 (anchor-on-seam-end law FL:3957-3986, clash list `written` FL:3932/3987-3996, UpdateEdge FL:4004) | one cursor pass FL:1538-1580: per-ring direction `rUp` FL:1552-1553, whole-period check FL:1556-1559, UpdateEdge FL:1567 **plus a per-surface `bld.Range` restamp FL:1570 that no u-side shift site performs**, cursor-close FL:1577-1578 | TRANSPOSE-WITH-PARAM — v fuses ARCMOD+placeChain into one pass; extra Range restamp v-only; clash detection u-only; PCORIGIN has no v counterpart |
| 10 | band/window pick | STATED law: material-left-of-traversal ∘ face.sense picks which v-band (vpatch complement translate FL:2336-2418, basis-ask FL:2361-2372); orientation from the file with `mirrored = (!hiPlus) != faceRev` FL:4074-4090 | MEASURED law: window follows the rings' own pcurve direction `up` FL:1392-1400, per-ring under multiarc FL:1401-1411; face.sense NEVER consulted in construction (only in a trace print FL:1663-1664) | DIVERGENT — stated-sense law vs measured-span law; the C2 risk ledger already measured orientation laws non-interchangeable in the cap family (facebuild-unify.md:227-228) |
| 11 | seam mint | u-iso FL:4093; endpoints = ring vertices (chain-aware pick FL:4109-4119); maker error interrogated FL:4130-4150; **registered in `minted_seam_edges` FL:4182**; slot order = `pcRev = mirrored` FL:4219, 4227; Range both all-rep AND per-surface FL:4229-4230; SameRange/SameParameter **proven then stamped TRUE** FL:4267-4285 | v-iso FL:1585 + parameter-is-u proof FL:1587-1590; endpoints = the two `vStart` joint vertices FL:1591-1594; `.Edge()` taken directly (throws instead of IsDone, caught at FL:1695-1698); **NOT registered anywhere**; slot order FIXED (isoV(vA) forward) FL:1603; Range per-surface only FL:1604; SameRange/SameParameter stamped **FALSE** twice FL:1599-1600, 1605-1606 | TRANSPOSE-WITH-PARAM with three DIVERGENT parameters that are behaviour: registration (u yes / v no — v carries the ucf-209 holder-scan blind spot, C:231-240), flag law (proven-TRUE vs FALSE), slot-order law (mirrored vs fixed) |
| 12 | tolerance stamps | `stateMeasured` widen-only UpdateVertex on the seam's shared ring vertices FL:4240-4255 | NONE on shared vertices; only splitEdgeHalf's widen-only UpdateVertex on the split's vertices FL:111-112 (both sides share this) | DIVERGENT (seam-vertex stamps u-only) / TRANSPOSE-EXACT (split halves) |
| 13 | holes | carried through decide (holeWires FL:1772, 1969) → assemble unwrap+place+wind FL:4299-4422 (declines computed before writes FL:4333-4336) | none — `face.loops.size() != 2` declines FL:1171 | DIVERGENT — u-only |
| 14 | slit drop | assemble `dropSlits` on both chains FL:4039-4073 (uses `edgeSlotsAgree` FL:5136) | none | DIVERGENT — u-only |
| 15 | self-gate / acceptance | NONE in the commit path — assemble returns unconditionally FL:4473; Closed2d check is trace-only FL:4430-4472 | `BRepLib::SameParameter(f, tol, true)` FL:1645 then `BRepCheck_Analyzer(occFace).IsValid()` FL:1652 gates the return FL:1685; under trace a SECOND `assemble(true)` runs (second SameParameter pass over shared edges) FL:1657 — same trace-only double-assemble hazard as C2 §2 | DIVERGENT — the v-builder's BRepCheck self-gate named by facebuild-unify §C1; the u-side compensates with its alignment superstructure (rows 6-7) |
| 16 | registry writes | decide: `seam_rotated_rings` claim FL:2716-2718 + success-claim FL:3812-3813; `seam_rotated_ring_tshapes` FL:2722-2725 + FL:3814; `ring_splits` FL:3119. assemble: `minted_seam_edges` FL:4182 | `ring_splits` FL:1514 (plan_pass only). READS `seam_rotated_rings` FL:1424-1425; never writes any claim registry, never writes `minted_seam_edges` | DIVERGENT — the v-builder never claims; its split "cannot be rotated again" only because tryRotate refuses chains FL:2485 |
| 17 | decline reporting | `declineReport("SEAMRING"/"SEAMRING_BAIL", …)` FL:1020, 1723, 3860; accepted-but-null at F:2016-2019 | `declineReport("TORUSV", …)` FL:1162; chain logs `declined-no-predicate` F:2052-2055 | TRANSPOSE-EXACT in mechanism, names differ |

## 3. Shared-TShape mutation table — torusVSeamFaceRaw

Every write to a shared or cross-face-visible TShape, in execution order.
"probe" = happens before the builder's own accept/decline verdict is known.

| site | write | shared? | probe/commit | same write in decide or assemble? |
|---|---|---|---|---|
| FL:1214, 1304 | `wireFromLoop(…, TopoDS_Face(), …)` — hit path runs `attachPcurveToEdge` on the cached TShape (XtTopoDS_Edge.cpp:346-350, the C2 §0 trap) | SHARED | commit (pre-classify) | decide FL:1775 — but WITH a scratch refFace (row 2 above): NOT the same write |
| FL:1501 | `MakeVertex(nv, pStar, max(etol, ownGap))` — the v-split vertex | mint, cross-face via registry | commit (plan_pass only) | decide trySplit FL:3110 — DECIDE side |
| FL:1511-1513 → FL:108-150 | `splitEdgeHalf` ×2: new edges; `UpdateVertex(a/b, t, e, etol)` FL:111-112 — **widen-only tol on the SHARED ring vertex ov1** + edge-side param on the minted half | SHARED vertex (widen-only) | commit (plan_pass only) | decide trySplit FL:3116-3117, same helper — DECIDE side; only `pcurveRangeByFraction` differs (v FALSE FL:1509, u TRUE FL:3114) |
| FL:1514 | `ctx.ring_splits.emplace(tgt.key, {e1,e2})` | registry | commit (plan_pass only, FL:1423) | decide trySplit FL:3119 — DECIDE side (ungated there) |
| FL:1567 | `UpdateEdge(piece.e, moved, faceSurface, loc, tolerance)` — whole-v-period pcurve shift on the cached ring edge / registered half | SHARED | **probe** — later bails FL:1577 (`ring-does-not-close-at-joint`), FL:1586, 1590, 1595, 1685 leave it in place | decide ARCMOD FL:2043 + loshift FL:3778/3794 (DECIDE) and assemble placeChain FL:4004 (ASSEMBLE) — the u-split puts window shifts on BOTH sides of its boundary |
| FL:1570 | `bld.Range(piece.e, faceSurface, loc, piece.a, piece.b)` — per-surface range restamp (same values) | SHARED | probe | **NO u counterpart** — no u-side shift site calls Range |
| FL:1599-1606 | seam: SameRange/SameParameter(false) ×2, two-pcurve UpdateEdge, per-surface Range — on a minted edge that HOLDS the two shared `vStart` vertices, unregistered | mint holding shared vertices | probe (before FL:1652) | assemble FL:4227-4230 + 4283-4284 — ASSEMBLE side; but u registers (FL:4182) and stamps TRUE after proof |
| FL:1645 | `BRepLib::SameParameter(f, tolerance, true)` inside `assemble` — walks EVERY edge of the face, cached ring pieces included: re-approximates pcurves, flips flags, widens tolerances (C2 §0 ground truth) | SHARED | **probe** — runs BEFORE the FL:1652 verdict; a `self-check-invalid` decline FL:1685 leaves all of it on the shared rings. Under trace, FL:1657 runs it a SECOND time | **NO counterpart anywhere in seamRingDecide or seamRingAssemble** (FL:1645 is the file's only call). This is the C2 §8 family blocker, present in the v-builder only |

**Split-adoption verdict from this table:** every torusV mutation except the
last two rows has a natural home on the u-split's decide side; the seam mint
maps to assemble. The two writes with NO slot in the u-shape are the
per-surface Range restamp (trivially parameterisable) and
`BRepLib::SameParameter` + BRepCheck (structural: the v-builder's acceptance
is decided AFTER shared mutation — adopting the decide/assemble split does
not remove that, it only relocates the commit point, exactly C2 §8 option
(b)). torusV CAN adopt the split cleanly iff its assemble keeps the
SameParameter+BRepCheck tail as its own guard law.

## 4. The plan_pass gate

What torusV registers under `ctx.plan_pass == true` (set B:1443, cleared
B:1585 and B:1703): **exactly one registry write** —
`ctx.ring_splits.emplace` FL:1514 (+ `splitRegTrace("torusv.vsplit")`
FL:1516, print-only) — reached only from the no-common-joint branch
FL:1412-1523, after which the face DECLINES (`v-split-registered` FL:1523).
At build time (`plan_pass == false`) the same branch is a terminal decline
`no-common-joint-final-pass` FL:1423; the stated reason (FL:1418-1422,
verified against Loop.cpp's ring_splits expansion): halves registered in the
kept pass could not reach faces already built earlier in that pass — the s57
whole+halves defect. The sweep runs the WHOLE torusV build and discards the
face (B:1554-1556); its convergence metric already counts these splits
(B:1538-1539, 1566-1568).

**What breaks if torusV were folded into seamRingDecide un-gated:**

1. `seamRingDecide` also runs at BUILD time — the wrapper's fresh-decide path
   FL:4526-4527 fires for any face the planner never saw, any second
   occurrence with its own surface object, and any stale plan FL:4501-4511.
   A fold that drops the FL:1423 gate re-introduces the s57 whole+halves
   defect on exactly those paths. The gate must travel with the fold.
2. The wrapper clears the ENTIRE plan cache when a fresh decide moves any
   registry (FL:4523-4531). Today a build-time torusV run cannot move
   `ring_splits` (gate FL:1423), so no torusV decline ever dumps the cache;
   folded-in and un-gated, one torus face would invalidate every cached
   SeamRingPlan mid-body — a behaviour change with no counterpart today.
3. Ordering: in the sweep torusV runs only when the u-decide declined that
   face (B:1554 `c.torus && !seamPlanned`), mirroring the build chain. A
   unified decide must evaluate u-candidacy before v-candidacy per face or
   splits/claims land in a different order → different fixpoint state.
4. The stacked candidacy (B:1509-1515, NOT else-if) exists because a torus
   face can pass `isAnalyticSeamRingFace` and still bail in decide
   (blue-tht face 671, B:1509-1512) — the fold must preserve "u-decline
   falls through to the v-path *within the same sweep iteration*".

## 5. Feasibility verdict

**Can torusVSeamRaw be re-expressed as seamRingDecide/Assemble parameterised
by axis, byte-identically? NO — not as a single parameterised body.** The
transposable core is real (§2 rows 3-5, 8-9, 11: classification, re-seat,
split, window shifts, seam mint — each a genuine u↔v swap with nameable
constants), but five subsystems are structurally one-sided:

1. u-only alignment superstructure: tryRotate FL:2480-2753, hole grid
   FL:3152-3338, SEAMPIN FL:3339-3551, HOLEROT FL:3556-3567 — and the v-side's
   ABSENCE of a rotate is measured design (O:3424-3425), not an omission.
2. v-only acceptance law: `BRepLib::SameParameter` FL:1645 +
   `BRepCheck_Analyzer` FL:1652 — no u counterpart (u-assemble commits
   unconditionally FL:4473); shared-edge mutation precedes the verdict
   (C2 §8 shape).
3. Orientation laws differ in KIND (stated-sense `mirrored` FL:4090 vs
   measured-span FL:1400/1613-1616 + face-flag-only sense F:3416-3417);
   cap-family precedent says laws like these are non-interchangeable
   (facebuild-unify.md:227-228).
4. Hole support (u-only, FL:4299-4422 vs the FL:1171 two-loop gate).
5. Surface admission (u: trim-unwrap FL:963-986; v: bare torus only F:2036).
   Plus the s75 refutation: merging the torus builders at dispatch level
   measured WORSE (facebuild-unify.md:229-230) — construction must unify
   before dispatch does.

**What IS feasible, hash-identically:** extract the transposable core into
axis-parameterised kits and give torusV the same decide/assemble SHAPE with
its own guard set as data. Per-axis guard sets are the honest end state of C1;
guard RECONCILIATION is measurement work, one census per guard.

**Recommended increment ladder (smallest hash-identical first):**

- **C1a — shared split core.** Extract {monotone bisection inverse +
  interior guards + ownGap MakeVertex + splitEdgeHalf×2 + ring_splits
  registration} from trySplit FL:2968-3120 and the v-split FL:1443-1516 into
  one helper parameterised by {axis component (X/Y), pcurveRangeByFraction,
  target-azimuth, closed-vs-arc endpoints, registration gate}. Pure code
  motion, each site keeps its constants (incl. the FL:1502-1505 drift, kept
  visible as a parameter). Bar: 187-bundle sha256 IDENTICAL.
- **C1b — period/window kit (= facebuild-unify A1).** One cursor/unwrap +
  place helper over ARCMOD FL:2027-2052, loshift FL:3759-3800, placeChain
  FL:3933-4010, torusV FL:1538-1580; parameters {axis, Range-restamp on/off,
  clash-list on/off, anchor law}. Bar: sha256 IDENTICAL.
- **C1c — seam-mint kit (= A2).** u FL:4093-4285 / v FL:1585-1606 behind
  {iso axis, endpoint pick, slot-order law, flag law (proven-TRUE vs FALSE),
  Range law, minted_seam_edges registration on/off, maker-error handling}.
  Bar: sha256 IDENTICAL.
- **C1d — split torusV into torusVDecide (FL:1153-1580 → a TorusVPlan:
  pieces with {e, pc, a, b, v0, v1, vStart, rev}, lo/hi, uLo/uHi, vA/vB,
  loFwd/hiFwd) + torusVAssemble (FL:1582-1692).** The v-split and all window
  shifts land decide-side (plan_pass gate stays on the split);
  seam + wire + SameParameter + BRepCheck land assemble-side. Pure motion →
  sha256 IDENTICAL. ⚠ Do NOT simultaneously switch the sweep (B:1554-1556)
  to decide-only: the sweep's discarded builds currently run FL:1645's
  SameParameter over shared rings, and removing those sweep-time mutations
  is a behaviour change — it gets its own measured increment (census +
  born-valid), where it is also the perf win (sweep stops paying
  seam+BRepCheck per torus candidate per fixpoint round).
- **C1e — one plan struct.** Generalise SeamRingPlan::Ring (C:120-126) to
  carry per-piece windows/senses so both plans share the type; optionally
  cache TorusVPlans beside seam_plans. Representation-only → sha256 bar.
- **C1f… — guard reconciliation, one census each (behaviour-changing,
  born-valid bar 190/221 model-for-model):** (i) register the v-seam in
  minted_seam_edges + adopt stateMeasured stamps (closes the v-side ucf-209
  blind spot — C2 §0 warns this class must be gated, not silently "fixed");
  (ii) acceptance law: either give the u-assemble the BRepCheck gate or
  replace the v-side FL:1645 with the u-side's read-only proof FL:4267-4285;
  (iii) v-side hole support (drop the FL:1171 two-loop gate); (iv) trimmed
  torus admission for the v-path via basis unwrap; (v) orientation-law
  unification LAST, own increment + own census (the C2 lesson).
