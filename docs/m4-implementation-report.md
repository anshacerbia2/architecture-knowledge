# M4 Knowledge Graph and Query Layer Implementation Report

Status: implementation evidence; not human-reviewed, approved, published, or canonical
Date: 2026-08-03 (Asia/Jakarta)

> Historical handoff notice: this report records the pre-audit implementation
> tree. The later independent audit hardened artifact currentness, validator
> fidelity, structured-query shape handling, and relationship-strength
> projection. Current hashes, tests, mutation evidence, hosted provenance, and
> the `M5 READY` decision are in
> [`m4-independent-audit-report.md`](m4-independent-audit-report.md).

## Executive Summary

M4 implements a deterministic, repository-local knowledge graph projection,
four exact metadata indexes, governed forward and reverse adjacency, provenance
edges, a default-deny traversal engine, and a JSON CLI for exact inspection and
bounded queries. Repository records remain authoritative; generated artifacts
are derived views and M4 introduces no full-text, vector, natural-language,
ranking, RAG, or graph-database capability.

All local gates and hosted gates pass on the final implementation tree. The
production relationship corpus reconciles to 24 first-class records: 8 are
traversable and 16 are excluded by governed design. The earlier M3 value of 9
was a stale audit snapshot taken before AKR-000010 was narrowed to
claim-context-only. No relationship was lost by projection.

M4 is ready for a separate independent M4 audit. This statement is an
implementation handoff, not human review or lifecycle promotion.

## Baseline

| Property | Baseline |
|---|---|
| M3 final verdict | `M4 READY` |
| Relevant final M3 report | `docs/m3-final-regression-reaudit-report.md` |
| Starting commit | `aa23532cc1c29d69554177e26bdaa329d6c9070f` |
| Starting branch | `main` |
| Starting worktree | clean |
| Starting `origin/main` | `aa23532cc1c29d69554177e26bdaa329d6c9070f` |
| Starting divergence | `0 0` |

No knowledge, claim, relationship, or source lifecycle status was changed by
M4. No new source was admitted.

## Graph Architecture

- Node families: concept, claim, source, and first-class relationship.
- Semantic edge family: one relationship edge for every first-class
  relationship record, retaining predicate, direction, conditions, scope,
  confidence, evidence, lifecycle, and traversal disposition.
- Provenance edge families: concept-declares-claim,
  claim-supported-by-source, claim-derived-from-claim,
  claim-applicable-to-concept, and relationship-supported-by-claim.
- Indexes: exact concept, claim, relationship, and source metadata indexes.
- Adjacency: complete forward and reverse views for all nodes; semantic
  relationship adjacency is counted separately from provenance.
- Traversal: default deny; only explicitly eligible, sourced, concept-global,
  adequately evidenced and admitted-source-grounded semantic relationships may
  enter concept traversal.
- Determinism: stable sorting, POSIX repository-relative paths, no timestamps,
  an input-only fingerprint, graph contract version 1, generator contract
  version 1, and in-memory freshness comparison.

The governing decision is recorded in
`docs/adr/0005-knowledge-graph-projection-and-traversal.md`. Operational usage
and limitations are documented in `docs/m4-graph-query-layer.md`.

## Files Changed

### Production and configuration

- `.github/workflows/validate.yml`
- `package.json`
- `vitest.config.ts`
- `stryker.graph.config.json`
- `src/graph-types.ts`
- `src/graph-projector.ts`
- `src/graph-artifacts.ts`
- `src/graph-query.ts`
- `src/graph-cli.ts`

### Tests

- `tests/graph-projection.test.ts`
- `tests/graph-artifacts.test.ts`
- `tests/graph-query.test.ts`
- `tests/graph-cli.test.ts`

### Generated artifacts and instructions

- `generated/AGENTS.md`
- `generated/graph/adjacency.json`
- `generated/graph/edges.json`
- `generated/graph/graph.json`
- `generated/graph/manifest.json`
- `generated/graph/nodes.json`
- `generated/graph/orphan-analysis.json`
- `generated/graph/reverse-adjacency.json`
- `generated/graph/traversal-policy.json`
- `generated/indexes/claims.json`
- `generated/indexes/concepts.json`
- `generated/indexes/relationships.json`
- `generated/indexes/sources.json`
- `generated/integrity/markdown-link-integrity.json`

### Documentation and roadmap finalization

- `docs/adr/0005-knowledge-graph-projection-and-traversal.md`
- `docs/m4-graph-query-layer.md`
- `docs/m4-implementation-report.md`
- `docs/README.md`
- `README.md`
- `ROADMAP.md`
- `roadmap/implementation.yaml`

No schema, ontology, source, claim, relationship, knowledge-unit, ID-ledger, or
lifecycle-event file changed.

## Artifact Inventory

All generated artifacts use graph contract version 1.

| Artifact | Records | Purpose |
|---|---:|---|
| `generated/graph/graph.json` | 139 nodes; 261 edges | Complete portable graph |
| `generated/graph/nodes.json` | 139 | Node-family view |
| `generated/graph/edges.json` | 261 | Semantic and provenance edge view |
| `generated/graph/adjacency.json` | 139 | Forward adjacency by node |
| `generated/graph/reverse-adjacency.json` | 139 | Reverse adjacency by node |
| `generated/graph/traversal-policy.json` | 24 decisions | Exact per-relationship traversal disposition |
| `generated/graph/orphan-analysis.json` | 1 intentional; 0 invalid | Orphan classification |
| `generated/graph/manifest.json` | 1 manifest | Contract, fingerprint, inventory, and counts |
| `generated/indexes/concepts.json` | 24 | Exact concept metadata index |
| `generated/indexes/claims.json` | 69 | Exact claim/evidence metadata index |
| `generated/indexes/relationships.json` | 24 | Exact relationship and traversal index |
| `generated/indexes/sources.json` | 22 | Exact admitted-source metadata index |

The 12 graph/index files total 777,627 bytes on the validated Windows
workspace.

## Production Graph Metrics

| Metric | Count |
|---|---:|
| Concepts | 24 |
| Claims | 69 |
| Sources | 22 |
| First-class relationships | 24 |
| Total graph nodes | 139 |
| Total graph edges | 261 |
| Semantic relationship edges | 24 |
| Concept-declares-claim edges | 96 |
| Claim-supported-by-source edges | 110 |
| Claim-derived-from-claim edges | 2 |
| Claim-applicable-to-concept edges | 5 |
| Relationship-supported-by-claim edges | 24 |
| Traversable relationship records | 8 |
| Excluded relationship records | 16 |
| Invalid or unresolved relationship records | 0 |
| Forward relationship adjacency entries | 31 |
| Reverse relationship adjacency entries | 31 |
| Provenance edges | 237 |
| Intentional or explained orphans | 1 (`AKS-000003`) |
| Invalid orphans | 0 |
| Unresolved references | 0 |

Seven symmetric records account for the difference between 24 relationship
records and 31 forward or reverse relationship adjacency entries. They remain
single semantic edges and are inspectable from both endpoints.

## Traversal Rule Matrix

| Relationship category | Traversable by default | Reason |
|---|---:|---|
| Eligible sourced relationship | Yes | Explicit eligibility plus all repository policy checks pass |
| Proposed relationship | No | Proposed lifecycle is not traversable |
| Claim-context-only relationship | No | Evidence cannot be promoted to a concept-global path |
| Explicitly excluded relationship | No | Governed exclusion rationale is authoritative |
| Edge-local qualified relationship | Only if the record is otherwise eligible | Conditions are preserved and returned, never assumed satisfied |
| Unsupported causal quality relationship | No | Inferential or recommendation evidence cannot establish a concept-global causal quality edge |

Provenance edges are queryable but never participate in concept traversal.
Incoming inspection retains the original predicate and does not invent inverse
semantics. Symmetric edges may be followed from either endpoint without storage
duplication. Traversal defaults to depth 3, rejects depths outside 1 through 8,
uses per-path cycle protection, and sorts results deterministically.

## Relationship Count Reconciliation

### Authoritative totals

```text
production first-class relationships: 24
traversable relationship records: 8
excluded relationship records: 16
invalid/unresolved relationship records: 0
semantic graph relationship edges: 24
forward adjacency entries: 31
reverse adjacency entries: 31
provenance edges: 237
```

### Exact ID lists

Traversable:

```text
AKR-000002, AKR-000003, AKR-000004, AKR-000008,
AKR-000011, AKR-000012, AKR-000014, AKR-000020
```

Excluded by design:

```text
AKR-000001, AKR-000005, AKR-000006, AKR-000007,
AKR-000009, AKR-000010, AKR-000013, AKR-000015,
AKR-000016, AKR-000017, AKR-000018, AKR-000019,
AKR-000021, AKR-000022, AKR-000023, AKR-000024
```

Unresolved: none.

### Exact relationship matrix

| ID | Source concept | Predicate | Target | Status | Semantic scope | Repository traversal metadata | Projected | M4 traversable | Exclusion reason | Classification |
|---|---|---|---|---|---|---|---:|---:|---|---|
| AKR-000001 | AKC-000001 | compatible-with | AKC-000002 | sourced | claim-context-only | `eligible=false`; inferential comparison is not directly established | yes | no | Inferential comparison not directly established by admitted sources. | excluded-by-design |
| AKR-000002 | AKC-000007 | alternative-to | AKC-000008 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000003 | AKC-000007 | compatible-with | AKC-000009 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000004 | AKC-000008 | compatible-with | AKC-000010 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000005 | AKC-000012 | requires | AKC-000011 | sourced | claim-context-only | `eligible=false`; requirement is claim-specific | yes | no | Duplicate-effect requirement is claim-specific; the Idempotency umbrella has multiple contextual roles. | excluded-by-design |
| AKR-000006 | AKC-000012 | improves | AKC-000004 | sourced | claim-context-only | `eligible=false`; causal effect is unmeasured | yes | no | Availability impact is a qualified recommendation without a measured causal effect. | excluded-by-design |
| AKR-000007 | AKC-000013 | improves | AKC-000004 | sourced | claim-context-only | `eligible=false`; causal effect is unmeasured | yes | no | Caller-capacity effect is plausible, but a measured availability effect is not established. | excluded-by-design |
| AKR-000008 | AKC-000012 | compatible-with | AKC-000013 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000009 | AKC-000014 | enables | AKC-000010 | sourced | claim-context-only | `eligible=false`; mechanism is narrower than target concept | yes | no | The outbox enables a publication mechanism, not event-driven architecture as a whole. | excluded-by-design |
| AKR-000010 | AKC-000014 | improves | AKC-000005 | sourced | claim-context-only | `eligible=false`; evidence cannot transfer globally | yes | no | The evidence is explicitly claim-context-only and cannot support concept-global traversal. | excluded-by-design |
| AKR-000011 | AKC-000015 | depends-on | AKC-000016 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000012 | AKC-000010 | introduces | AKC-000016 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000013 | AKC-000017 | compatible-with | AKC-000018 | sourced | claim-context-only | `eligible=false`; redundant weak association | yes | no | Redundant compatibility edge adds less information than the direct OIDC dependency and token-role boundary. | excluded-by-design |
| AKR-000014 | AKC-000018 | depends-on | AKC-000017 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000015 | AKC-000019 | supports-investigation-of | AKC-000005 | sourced | claim-context-only | `eligible=false`; association is non-causal | yes | no | Association is non-causal; admitted evidence supports investigation capability, not reliability improvement. | excluded-by-design |
| AKR-000016 | AKC-000008 | presents-risk-to | AKC-000005 | sourced | claim-context-only | `eligible=false`; conditional risk is inferential | yes | no | Conditional reliability risk is inferential and not a measured degradation. | excluded-by-design |
| AKR-000017 | AKC-000006 | documented-by | AKC-000020 | sourced | claim-context-only | `eligible=false`; cross-practice recommendation lacks direct support | yes | no | Cross-practice recommendation is not directly established by admitted sources. | excluded-by-design |
| AKR-000018 | AKC-000003 | constrains | AKC-000008 | sourced | claim-context-only | `eligible=false`; generic constraint is tautological | yes | no | A generic constraint edge is tautological until a specific reusable constraint is identified. | excluded-by-design |
| AKR-000019 | AKC-000002 | influences | AKC-000020 | sourced | claim-context-only | `eligible=false`; cross-method recommendation lacks direct support | yes | no | Cross-method recommendation is not directly established by admitted sources. | excluded-by-design |
| AKR-000020 | AKC-000004 | overlaps-with | AKC-000005 | sourced | concept-global | `eligible=true` | yes | yes | — | traversable |
| AKR-000021 | AKC-000012 | introduces | AKC-000021 | proposed | claim-context-only | `eligible=false`; proposed and unsupported | yes | no | Proposed cascading-failure edge lacks direct feedback-path evidence. | excluded-by-design |
| AKR-000022 | AKC-000007 | mitigates | AKC-000022 | proposed | claim-context-only | `eligible=false`; proposed and unsupported | yes | no | Proposed mitigation edge lacks general evidence for continuous boundary enforcement. | excluded-by-design |
| AKR-000023 | AKC-000023 | can-occur-in-context-of | AKC-000018 | proposed | claim-context-only | `eligible=false`; proposed and unsupported | yes | no | Proposed context association has corrected actor semantics but still lacks exact threat evidence. | excluded-by-design |
| AKR-000024 | AKC-000024 | can-occur-in-context-of | AKC-000010 | proposed | claim-context-only | `eligible=false`; proposed and unsupported | yes | no | Proposed context association has corrected actor semantics but still lacks direct repair/convergence evidence. | excluded-by-design |

### Reconciliation conclusion

The earlier count of 9 in
`docs/m3-independent-semantic-reaudit-report.md` was a stale M3 audit snapshot.
Commit `504120820437f368fd1988bb1621138c26c0d2cf` subsequently changed
AKR-000010 to `semantic_scope: claim-context-only`,
`traversal.eligible: false`, with rationale: "The evidence is explicitly
claim-context-only and cannot support concept-global traversal."
`docs/m3-focused-hardening-report.md` recorded that correction and
`docs/m3-final-focused-reaudit-report.md` independently closed the related
finding. The current relationship record is version 3 and preserves that
disposition.

Therefore Case B applies: current repository truth contains eight eligible
relationships. M4 projects all 24 records to exactly 24 semantic edges and
drops none. The 31 adjacency entries are a separate representation count caused
by seven governed symmetric relationships, not an eligibility difference.

Regression tests assert the exact eligible set, exact excluded set, disjoint
partition and full union, one semantic edge per record, original predicates,
forward and reverse adjacency, symmetric endpoint visibility, and absence of
all 16 excluded IDs from every default traversal.

## Query Capability Matrix

| Capability | Actual evidence |
|---|---|
| Record lookup | `get AKC-000018` returns 1 exact concept record |
| Neighbors | `neighbors AKC-000018 --direction both` returns AKC-000017 through AKR-000014 |
| Incoming relations | AKC-000017 reports incoming `depends-on` from AKC-000018 without an invented inverse |
| Outgoing relations | AKC-000018 reports outgoing `depends-on` to AKC-000017 |
| Bounded traversal | AKC-000008 at depth 3 returns 4 deterministic paths and never exceeds the hard bound |
| Path query | `path AKC-000008 AKC-000016 --max-depth 4` returns 1 path through AKR-000004 and AKR-000012 |
| Claims query | Exact concept and claim-type filters return only governed claim records |
| Evidence query | `evidence AKL-000061` returns AKS-000019 and its exact OIDC locator |
| Relationship explanation | `explain AKR-000010` returns claim-context-only scope and its exclusion reason |
| Dependent lookup | `dependents AKS-000019` returns 14 referencing records without inverse-semantic claims |
| Structured multi-constraint query | Protocol plus `depends-on` target AKC-000017 returns only AKC-000018 |
| Correct empty result | Incompatible structured constraints return zero results plus `GRAPH_QUERY_EMPTY` |

The final regression added explicit CLI coverage for the two required path
positionals and for rejection of a third unexpected positional. M4 matching is
exact and case-sensitive; it performs no fuzzy or semantic query parsing.

## Determinism Evidence

- Complete graph generation ran twice after the final code/test change.
- All 12 artifact hashes were byte-identical across both runs.
- `pnpm graph:check` reported 12/12 current and did not rewrite the worktree.
- Every generated path is POSIX-style and repository-relative.
- Artifacts contain no timestamp, random identifier, absolute workspace path,
  or environment-derived field.
- Hosted Ubuntu and Windows both passed graph artifact currentness on the exact
  implementation SHA.
- Representative local generation took 1.73 seconds. A CLI lookup including
  process startup took 1.15 seconds; these are informational, not performance
  service-level objectives.

### Final artifact hashes

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `generated/graph/adjacency.json` | 23,419 | `658f52c61fab100e3dc2795712035422e483afb8e06e53a95000b48624467342` |
| `generated/graph/edges.json` | 186,941 | `0f4a0bb643060a321d531487e68b8268ac3f896b883623a8c49ec8439cb3246d` |
| `generated/graph/graph.json` | 222,388 | `f6f38b1b668b0a5a5ae41b6f079c0176e90a31d78a45ccbbfd0eef1b3871a5f7` |
| `generated/graph/manifest.json` | 1,577 | `14e38ed5437b6bf3ca8190a6dc4a4d3866334d922d53c27a1f7a985402d61dc5` |
| `generated/graph/nodes.json` | 35,513 | `d81330020019640703433c1c6caf95fe005f0c05382038231368c9e3b2e419f8` |
| `generated/graph/orphan-analysis.json` | 3,533 | `5ee035378168fd7ccb55be97a95e90dd6970bf10f5ce65f28a29d2bee8d44e51` |
| `generated/graph/reverse-adjacency.json` | 23,359 | `fb96737835458d704e7e090b132ada6821a171c8a9f2a36e7f0294f33d49fe19` |
| `generated/graph/traversal-policy.json` | 4,578 | `3c5c5c8725802999e266bb53063ca855427b0d3c7952603ebac97c80b44e977f` |
| `generated/indexes/claims.json` | 72,678 | `11faab61b57af9eb9abe97f0c88ff5dff90285379144afe65932b22f94bd3aa4` |
| `generated/indexes/concepts.json` | 137,115 | `157092eb7cb1bf3c50c672d15023601db3e268510fd6257399dda737cdf709f9` |
| `generated/indexes/relationships.json` | 29,990 | `1763040149e1687a9f01439d047a2adf3872a9c24d6ffe0dd30ddc18b4320824` |
| `generated/indexes/sources.json` | 36,536 | `b1ca0b9c3ab535336f5400210ef047a9740b5fd8f21ca0446cccbaea3ed9deb0` |

## Test and Mutation Evidence

| Evidence | Final result |
|---|---|
| Test files | 22 passed |
| Test run one | 208/208 passed; 28.73 seconds |
| Test run two | 208/208 passed; 33.26 seconds |
| Statements | 92.16% |
| Branches | 80.82% |
| Functions | 96.50% |
| Lines | 94.04% |
| Focused mutation command | `pnpm test:mutation:graph` |
| Instrumented mutants | 720 |
| Tested mutants | 441 |
| Mutation score | 80.27% total; 85.30% covered |
| Killed | 352 |
| Timed out | 2 |
| Survived | 61 |
| No coverage | 26 |
| Errors | 0 |
| Break threshold | 60% |
| Production graph contract | Pass; 24/24 relationships accounted for, 0 unresolved references |

File-level mutation scores were 76.27% for graph artifacts, 70.59% for the
projector, and 93.10% for query logic. The final focused run completed after
all implementation and regression-test changes.

## Validation Evidence

| Command | Final exact-tree result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lock current, pnpm 10.23.0; unchanged ignored-esbuild notice |
| `pnpm format:check` | Pass |
| `pnpm validate` | Pass; 0 errors, 0 warnings |
| `pnpm report:integrity` | Pass; wrote 12 reports |
| `pnpm graph:generate`, first run | Pass; 12 artifacts |
| `pnpm graph:generate`, second run | Pass; 12 artifacts, byte-identical |
| `pnpm graph:check` | Pass; 12/12 current |
| `pnpm report:check` | Pass; 12/12 current |
| `pnpm test`, first run | Pass; 22 files, 208/208 tests |
| `pnpm test`, second run | Pass; 22 files, 208/208 tests |
| `pnpm test:coverage` | Pass; configured thresholds met |
| `pnpm test:mutation:graph` | Pass; 80.27%, threshold 60% |

## Hosted CI

| Property | Result |
|---|---|
| Workflow | Validate knowledge kernel |
| Run ID | `30756684255` |
| Run URL | `https://github.com/anshacerbia2/architecture-knowledge/actions/runs/30756684255` |
| Tested commit | `9825216cffc97c162cc2514a44b09f0283c9d7be` |
| Ubuntu | Success; job `91519943955` |
| Windows | Success; job `91519943949` |
| Graph currentness | Success on Ubuntu and Windows |
| Complete tests | Success on Ubuntu and Windows; 208/208 |
| Coverage | Success on Ubuntu and Windows |
| Legacy mutation | Success; job `91519943928`, step 6 |
| Focused graph mutation | Success; job `91519943928`, step 7 |
| Mutation job | Success |
| Overall conclusion | Success |

The earlier run `30754477189` on `0bdc241...` also passed, but it was
superseded after direct capability execution exposed and fixed the CLI path
positional parser defect. No final provenance claim relies on that superseded
SHA.

## Git Provenance

| Property | Value |
|---|---|
| Initial M4 baseline | `aa23532cc1c29d69554177e26bdaa329d6c9070f` |
| Primary implementation commit | `0bdc24196659d56beb955c940351364910cb8bde` |
| CLI path correction commit | `9825216cffc97c162cc2514a44b09f0283c9d7be` |
| Implementation CI-tested SHA | `9825216cffc97c162cc2514a44b09f0283c9d7be` |
| Documentation/report commit | Pending when this report is authored; recorded in the post-commit handoff |
| Final HEAD and `origin/main` | Self-referential values are recorded after this report is committed and pushed |

The report does not fabricate its own commit SHA.

## Residual Findings

- Critical: none.
- High: none.
- Medium: none.
- Low: 61 focused graph mutants survive and 26 have no coverage. The aggregate
  and every file remain above the committed 60% break threshold; exact
  relationship sets, traversal leakage, provenance, determinism, path bounds,
  and exclusion behavior have direct regression coverage.
- Low: the projector is the weakest M4 mutation file at 70.59%; increase this
  incrementally without blocking the independent M4 audit.
- Observation: AKS-000003 is intentionally unreferenced and is explicitly
  classified, not an invalid orphan.
- Observation: the CLI is process-startup dominated at this corpus size. No M4
  performance requirement justifies a service or graph database.

The path positional defect discovered during capability execution was fixed and
regression-tested before the final implementation SHA. It is not residual.

## Scope Confirmation

M5 did not begin. This run added no pgvector, full-text search, embeddings,
natural-language query parsing, ranking, RAG, graph database, new source,
knowledge rewrite, or lifecycle promotion. The graph does not evaluate
edge-local conditions and does not turn query output into architecture advice.

## Exit Statement

READY FOR INDEPENDENT M4 AUDIT
