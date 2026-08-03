# Independent M4 Knowledge Graph and Query Layer Audit

## Executive verdict

M5 READY

The bounded M4 audit found one reproducible High defect in the normal query trust boundary and four
non-blocking defects. All five were remediated in the audit-fix commit and covered by regression
tests. The final implementation rejects stale or manually altered artifacts before a query can load
them. No remaining mutation survivor produced an excluded-edge, provenance, applicability,
direction, depth, cycle, qualifier, or currentness bypass.

This verdict is a technical entry decision for M5. It does not mark any concept, claim,
relationship, recommendation, source, or knowledge unit reviewed, approved, published, or
canonical.

## Audited baseline

| Item | Independently observed value |
| --- | --- |
| Initial HEAD | `729b33001c6d20ff935ece4a8ce3b35cc49354c9` |
| Branch | `main` |
| Initial `origin/main` | `729b33001c6d20ff935ece4a8ce3b35cc49354c9` |
| Initial divergence | `0 0` |
| Initial worktree | clean |
| Primary M4 implementation | `0bdc24196659d56beb955c940351364910cb8bde` |
| Final pre-audit implementation fix | `9825216cffc97c162cc2514a44b09f0283c9d7be` |
| Pre-audit report commit | `729b33001c6d20ff935ece4a8ce3b35cc49354c9` |
| Hosted implementation run | `30756684255`, success |
| Audit-fix implementation | `7c40879963ffe1c1f647bfa35d36f47045786a8c` |
| Hosted audit-fix run | `30800207983` |

The exact requested baseline was present, clean, synchronized, and explained by the last 15 commits.
The history of the relevant M3/M4 boundary was inspected rather than inferred from reports.

## Audit scope and exclusions

This was an adversarial, bounded M4 audit using four methods: static implementation inspection,
production-data recomputation, independent temporary/in-memory negative probes, and clean-checkout
plus hosted-provenance verification. It audited projection, indexes, traversal, query operations,
provenance, qualifiers, applicability, determinism, artifact currentness, CLI behavior, mutation
residuals, documentation, Git history, and lifecycle preservation.

M5 was not begun. The audit added no database, pgvector, full-text search, vector search, embeddings,
chunking, reranking, natural-language parsing, RAG, or LLM call. It did not add or semantically edit
knowledge, claims, relationships, sources, ontology, schemas, IDs, or lifecycle events.

## Relationship reconciliation

Independent YAML loading and policy derivation produced:

- Total: 24
- Traversable: 8
- Excluded by design: 16
- Unresolved: 0
- Semantic relationship edges: 24
- Forward relationship adjacency entries: 31
- Reverse relationship adjacency entries: 31
- Symmetric relationships: 7

Exact traversable set:

```text
AKR-000002 AKR-000003 AKR-000004 AKR-000008
AKR-000011 AKR-000012 AKR-000014 AKR-000020
```

Exact excluded set:

```text
AKR-000001 AKR-000005 AKR-000006 AKR-000007
AKR-000009 AKR-000010 AKR-000013 AKR-000015
AKR-000016 AKR-000017 AKR-000018 AKR-000019
AKR-000021 AKR-000022 AKR-000023 AKR-000024
```

Unresolved set: empty.

Exact symmetric set:

```text
AKR-000001 AKR-000002 AKR-000003 AKR-000004
AKR-000008 AKR-000013 AKR-000020
```

The sets are disjoint where required, their union accounts for all 24 unique IDs, and the seven
extra adjacency entries are exactly the second endpoint views of the seven symmetric relationships.

| Relationship ID | Source concept | Predicate | Target concept | Status | Scope | Symmetric | Repository traversal metadata | Evidence claims | Projected | Traversable | Exclusion reason |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| AKR-000001 | AKC-000001 | compatible-with | AKC-000002 | sourced | claim-context-only | yes | `eligible=false` | AKL-000021 | yes | no | Inferential comparison not directly established by admitted sources. |
| AKR-000002 | AKC-000007 | alternative-to | AKC-000008 | sourced | concept-global | yes | `eligible=true` | AKL-000022 | yes | yes | — |
| AKR-000003 | AKC-000007 | compatible-with | AKC-000009 | sourced | concept-global | yes | `eligible=true` | AKL-000023 | yes | yes | — |
| AKR-000004 | AKC-000008 | compatible-with | AKC-000010 | sourced | concept-global | yes | `eligible=true` | AKL-000024 | yes | yes | — |
| AKR-000005 | AKC-000012 | requires | AKC-000011 | sourced | claim-context-only | no | `eligible=false` | AKL-000025 | yes | no | Duplicate-effect requirement is claim-specific; the Idempotency umbrella has multiple contextual roles. |
| AKR-000006 | AKC-000012 | improves | AKC-000004 | sourced | claim-context-only | no | `eligible=false` | AKL-000026 | yes | no | Availability impact is a qualified recommendation without a measured causal effect. |
| AKR-000007 | AKC-000013 | improves | AKC-000004 | sourced | claim-context-only | no | `eligible=false` | AKL-000027 | yes | no | Caller-capacity effect is plausible, but a measured availability effect is not established. |
| AKR-000008 | AKC-000012 | compatible-with | AKC-000013 | sourced | concept-global | yes | `eligible=true` | AKL-000028 | yes | yes | — |
| AKR-000009 | AKC-000014 | enables | AKC-000010 | sourced | claim-context-only | no | `eligible=false` | AKL-000029 | yes | no | The outbox enables a publication mechanism, not event-driven architecture as a whole. |
| AKR-000010 | AKC-000014 | improves | AKC-000005 | sourced | claim-context-only | no | `eligible=false` | AKL-000030 | yes | no | The evidence is explicitly claim-context-only and cannot support concept-global traversal. |
| AKR-000011 | AKC-000015 | depends-on | AKC-000016 | sourced | concept-global | no | `eligible=true` | AKL-000031 | yes | yes | — |
| AKR-000012 | AKC-000010 | introduces | AKC-000016 | sourced | concept-global | no | `eligible=true` | AKL-000032 | yes | yes | — |
| AKR-000013 | AKC-000017 | compatible-with | AKC-000018 | sourced | claim-context-only | yes | `eligible=false` | AKL-000033 | yes | no | Redundant compatibility edge adds less information than the direct OIDC dependency and token-role boundary. |
| AKR-000014 | AKC-000018 | depends-on | AKC-000017 | sourced | concept-global | no | `eligible=true` | AKL-000034 | yes | yes | — |
| AKR-000015 | AKC-000019 | supports-investigation-of | AKC-000005 | sourced | claim-context-only | no | `eligible=false` | AKL-000035 | yes | no | Association is non-causal; admitted evidence supports investigation capability, not reliability improvement. |
| AKR-000016 | AKC-000008 | presents-risk-to | AKC-000005 | sourced | claim-context-only | no | `eligible=false` | AKL-000036 | yes | no | Conditional reliability risk is inferential and not a measured degradation. |
| AKR-000017 | AKC-000006 | documented-by | AKC-000020 | sourced | claim-context-only | no | `eligible=false` | AKL-000037 | yes | no | Cross-practice recommendation is not directly established by admitted sources. |
| AKR-000018 | AKC-000003 | constrains | AKC-000008 | sourced | claim-context-only | no | `eligible=false` | AKL-000038 | yes | no | A generic constraint edge is tautological until a specific reusable constraint is identified. |
| AKR-000019 | AKC-000002 | influences | AKC-000020 | sourced | claim-context-only | no | `eligible=false` | AKL-000039 | yes | no | Cross-method recommendation is not directly established by admitted sources. |
| AKR-000020 | AKC-000004 | overlaps-with | AKC-000005 | sourced | concept-global | yes | `eligible=true` | AKL-000040 | yes | yes | — |
| AKR-000021 | AKC-000012 | introduces | AKC-000021 | proposed | claim-context-only | no | `eligible=false` | AKL-000045 | yes | no | Proposed cascading-failure edge lacks direct feedback-path evidence. |
| AKR-000022 | AKC-000007 | mitigates | AKC-000022 | proposed | claim-context-only | no | `eligible=false` | AKL-000046 | yes | no | Proposed mitigation edge lacks general evidence for continuous boundary enforcement. |
| AKR-000023 | AKC-000023 | can-occur-in-context-of | AKC-000018 | proposed | claim-context-only | no | `eligible=false` | AKL-000047 | yes | no | Proposed context association has corrected actor semantics but still lacks exact threat evidence. |
| AKR-000024 | AKC-000024 | can-occur-in-context-of | AKC-000010 | proposed | claim-context-only | no | `eligible=false` | AKL-000048 | yes | no | Proposed context association has corrected actor semantics but still lacks direct repair/convergence evidence. |

### AKR-000010 history and bypass audit

`AKR-000010` was created in `fbc0eb2` before the hardened traversal metadata existed. Commit
`504120820437f368fd1988bb1621138c26c0d2cf` narrowed the supporting claim to the local
database-to-message dual-write boundary, set `semantic_scope: claim-context-only`, reduced the
relationship to moderate strength/medium confidence, and explicitly set `traversal.eligible: false`.
That explains the historical snapshot of nine.

The current record remains `sourced`, is present in the relationship index and semantic edge set,
and is returned by `get`, `explain`, excluded-neighbor inspection, and provenance-dependent queries.
Independent bypass attempts found it in none of default neighbors, forward traversal, reverse
traversal, path search, symmetric expansion, structured `traversable_only` matching, or semantic
dependency traversal. `dependents` may expose it as an inspectable provenance dependency, but the
same response labels it non-traversable and it never becomes a concept path.

## Projection completeness

Authoritative records were loaded directly and compared by ID and governed fields with indexes,
nodes, semantic edges, and provenance edges:

| Family | Authoritative | Index records | Graph nodes | Discrepancy |
| --- | ---: | ---: | ---: | ---: |
| Concepts | 24 | 24 | 24 | 0 |
| Claims | 69 | 69 | 69 | 0 |
| Sources | 22 | 22 | 22 | 0 |
| Relationships | 24 | 24 | 24 | 0 |
| Total | 139 | 139 | 139 | 0 |

There are 261 edges: 24 semantic relationships and 237 provenance edges. Provenance recomputation
found 96 concept-declares-claim, 110 claim-supported-by-source, 2 claim-derived-from-claim, 5
claim-applicable-to-concept, and 24 relationship-supported-by-claim edges. There were no duplicate
IDs, missing governed records, absent endpoints, fabricated records, or cross-reference mismatches.
Removing or altering an index record, node, provenance edge, applicability edge, or semantic edge
now produces a graph fidelity diagnostic; byte-currentness independently rejects every changed
committed artifact.

The only orphan summary item is admitted source `AKS-000003`, which currently supports no active
claim. It is explicitly classified as an intentional/explained source isolation. Invalid orphan
count is zero. Twelve concepts are reachable only through non-traversable first-class edges; this is
an accurate policy result, not hidden invalidity.

## Traversal-safety matrix

| Independent negative probe | Actual result | Deterministic disposition |
| --- | --- | --- |
| Proposed relationship | `REL_TRAVERSAL_UNSOURCED` | rejected |
| `claim-context-only` relationship | `REL_TRAVERSAL_CONTEXT_ONLY` | rejected |
| Explicitly excluded `AKR-000010` | governed `eligible=false` and exact rationale | excluded |
| Unresolved endpoint | `ID_REFERENCE_UNRESOLVED` | rejected |
| Missing evidence claim | `REL_EVIDENCE_CLAIM`, `ID_REFERENCE_UNRESOLVED` | rejected |
| Missing admitted source | `ID_REFERENCE_UNRESOLVED`; projection reason `policy:evidence-chain-not-admitted` | rejected |
| Narrowed claim used for broader relationship | `REL_EVIDENCE_SCOPE` | rejected |
| Edge condition removed | `REL_CONDITIONS_REQUIRED`, `REL_EVIDENCE_CONDITION` | rejected |
| Confidence/strength widened | `REL_EVIDENCE_CONFIDENCE`, `REL_EVIDENCE_STRENGTH` | rejected |
| Semantic scope widened | `REL_EVIDENCE_SCOPE` | rejected |
| Causal predicate substituted | `REL_ENDPOINT_CONCEPT_TYPE`, `REL_EVIDENCE_PREDICATE` | rejected |
| Excluded edge manually marked traversable in generated graph | `GRAPH_ARTIFACT_NOT_CURRENT` | rejected before query load |

A synthetic `A -> B -> C -> A` fixture at requested depth 8 terminated with two finite paths, a
maximum returned depth of 2, and no repeated node. Depth 0, negative, fractional, and values above 8
return `GRAPH_DEPTH_INVALID`. Per-path visited-node protection prevents repeated symmetric expansion.
No returned production traversal or path contained an excluded relationship.

## Direction and symmetry matrix

| Case | Probe | Exact behavior |
| --- | --- | --- |
| Directed traversable | AKR-000014, AKC-000018 -> AKC-000017 | source outgoing contains `depends-on`; target incoming contains the same predicate; target outgoing is empty |
| Directed excluded | AKR-000010, AKC-000014 -> AKC-000005 | absent by default; `include-excluded` exposes source outgoing and target incoming with `traversable=false`; target outgoing remains empty |
| Symmetric traversable | AKR-000020, AKC-000004 <-> AKC-000005 | visible once from each endpoint with one relationship ID and predicate `overlaps-with` |
| Symmetric excluded | AKR-000001, AKC-000001 <-> AKC-000002 | absent by default; visible once from each endpoint only with `include-excluded`, same ID and qualifiers |

Forward and reverse adjacency preserve the original governed predicate. No artificial inverse
predicate or second relationship identity is generated.

## Query capability matrix

All responses use the documented JSON envelope: `query`, `result_count`, `results`, `diagnostics`,
and `graph_contract_version: 1`. Successful stdout contained JSON only; ordinary failures used
stderr, a non-zero exit, a stable code/message, and no raw stack trace.

| Query family | Valid production probe | Empty/excluded behavior | Independent failure behavior |
| --- | --- | --- | --- |
| `get` | AKC-000018 by ID and exact human key | unknown record returns zero results | `GRAPH_ID_UNKNOWN`; ambiguous exact title gives `GRAPH_ID_AMBIGUOUS` |
| `neighbors` | outgoing/incoming/both and predicate filters | excluded absent unless requested and clearly labeled | invalid direction gives `GRAPH_DIRECTION_INVALID` |
| `traverse` | bounded multi-hop from AKC-000008 | unreachable branch returns empty | invalid depth/filter rejected |
| `path` | AKC-000018 -> AKC-000017 | excluded bridge cannot form a path | missing/extra positional and invalid depth rejected |
| `claims` | exact metadata filters on AKC-000018 | unmatched filters return empty envelope | unsupported filter rejected |
| `evidence` | AKL-000061 resolves AKS-000019 and exact locator | unsupported claim returns empty/error envelope | wrong family/unknown ID rejected |
| `explain` | AKR-000014 and AKR-000010 | excluded edge remains inspectable with reason | unknown relationship rejected |
| `dependents` | source, claim, concept, and relationship provenance | semantic exclusion never becomes traversal | unknown ID rejected |
| `list` | concepts, claims, sources, relationships with exact filters | correct empty list has `GRAPH_QUERY_EMPTY` | unknown family/filter rejected |
| structured `query` | protocol + security-privacy + depends-on OAuth returns only AKC-000018 | AND constraints may correctly return empty | malformed types/properties give `GRAPH_QUERY_SHAPE`; bad target gives `GRAPH_QUERY_TARGET` |

Malformed structured examples that previously broadened to all 24 concepts—string instead of array,
string instead of boolean, non-object relationship constraint, unsupported `fuzzy`, and unknown
top-level property—now return zero results with `GRAPH_QUERY_SHAPE`. Both
`pnpm graph:query get ...` and `pnpm graph:query -- get ...` are supported.

## Provenance matrix

Projection retains provenance as typed edges; source proximity, semantic adjacency, and applicability
remain different edge families.

| Sample | Governed chain preserved by graph/query | Locator or boundary |
| --- | --- | --- |
| Direct sourced claim | AKC-000004 -> AKL-000004 -> AKS-000004, AKS-000005 | non-normative direct support; no invented locator |
| Synthesis | AKC-000007 -> AKL-000022 -> AKS-000006, AKS-000007, AKS-000008 | type remains `synthesis` |
| Inference | AKC-000001 -> AKL-000021 -> AKS-000001, AKS-000002 | type remains `inference`, low confidence, claim-context-only |
| Recommendation | AKC-000012 -> AKL-000026 -> AKS-000012 | type remains `recommendation` with its condition |
| Normative security claim | AKC-000018 -> AKL-000061 -> AKS-000019 | `OpenID Connect Core Section 3.1.3.7, item 2` |
| Conditional normative claim | AKC-000018 -> AKL-000065 -> AKS-000019 | condition and `should` force preserved; Core Section 3.1.3.7, items 4 and 5 |
| Claim with exception | AKC-000017 -> AKL-000052 -> AKS-000018 | RFC 9700 Sections 2.1 and 4.1.3; loopback-port exception preserved |
| Explicit applicability | AKC-000017 -> AKL-000050 -> AKC-000018 and AKS-000018 | exactly one `applicable-to` edge plus RFC 9700 Section 2.1.1 |
| Excluded relationship | AKR-000010 -> AKL-000030 -> AKS-000014 | local dual-write boundary remains claim-context-only |
| Traversable relationship | AKR-000014 -> AKL-000034 -> AKS-000019 | OpenID Connect Core Section 1 |

OAuth/OIDC recomputation found exactly five explicit applicability edges: AKL-000050, AKL-000051,
AKL-000052, AKL-000054, and AKL-000059, all from subject AKC-000017 to applicable concept
AKC-000018. Removing one declaration removes the edge; adjacency or a shared source does not recreate
it. Adding a shared source to unrelated temporary records created no ownership or applicability.
Incoming adjacency did not grant claim ownership, and relationship evidence did not grant source
inheritance.

## Qualifier preservation

Index, edge, adjacency, explanation, claim, and evidence output were compared with the governed YAML.
The final projection preserves claim type, confidence, lifecycle, semantic scope, direct source IDs,
derived claim IDs, exact source locations, normative force/actor, conditions, exceptions,
`applicable_concept_ids`, relationship confidence, relationship strength, condition scope, traversal
eligibility, and exclusion reason.

Focused checks included:

- AKL-000052: `must`, exact redirect comparison, and only the native localhost loopback port
  exception;
- AKL-000061: `must`, exact issuer validation, and its exact OpenID Connect locator;
- AKL-000065: conditional `should`, not an unconditional `must`;
- AKL-000050: explicit cross-concept applicability, not inferred OAuth/OIDC adjacency;
- AKR-000010: medium confidence, moderate strength, claim-context-only scope, local condition,
  AKL-000030 evidence, and the governed exclusion rationale;
- AKR-000014: high confidence, moderate strength, concept-global scope, condition, AKL-000034,
  source AKS-000019, exact locator, and eligible traversal.

Before remediation, `strength` was present in the relationship record and index but absent from the
semantic edge/query explanation. It is now a required edge qualifier and is covered by projection,
artifact-fidelity, explanation, and mutation tests. One-at-a-time qualifier mutations are rejected
by the independent validator where modeled and, for every committed artifact byte, by the
currentness gate.

## Determinism and currentness

The main workspace and a detached clean checkout of the audit-fix SHA each ran generation twice.
All 12 artifacts were byte-identical on both runs, and repeated `get`, `neighbors`, and `path` JSON
outputs were identical. The clean checkout remained clean after generation.

| Artifact | Bytes | SHA-256 after both final runs |
| --- | ---: | --- |
| `generated/graph/adjacency.json` | 23,419 | `658f52c61fab100e3dc2795712035422e483afb8e06e53a95000b48624467342` |
| `generated/graph/edges.json` | 193,305 | `f6c014346af3aee0ed5f48b4c338cf9d760a2b4a25a7c77c3d8c914d6e3f3e9f` |
| `generated/graph/graph.json` | 228,752 | `0d898d765bf5fc805e1af08613bfea841d5af09a81262641a8bf962138371176` |
| `generated/graph/manifest.json` | 1,577 | `14e38ed5437b6bf3ca8190a6dc4a4d3866334d922d53c27a1f7a985402d61dc5` |
| `generated/graph/nodes.json` | 35,513 | `d81330020019640703433c1c6caf95fe005f0c05382038231368c9e3b2e419f8` |
| `generated/graph/orphan-analysis.json` | 3,533 | `5ee035378168fd7ccb55be97a95e90dd6970bf10f5ce65f28a29d2bee8d44e51` |
| `generated/graph/reverse-adjacency.json` | 23,359 | `fb96737835458d704e7e090b132ada6821a171c8a9f2a36e7f0294f33d49fe19` |
| `generated/graph/traversal-policy.json` | 4,578 | `3c5c5c8725802999e266bb53063ca855427b0d3c7952603ebac97c80b44e977f` |
| `generated/indexes/claims.json` | 72,678 | `11faab61b57af9eb9abe97f0c88ff5dff90285379144afe65932b22f94bd3aa4` |
| `generated/indexes/concepts.json` | 137,115 | `157092eb7cb1bf3c50c672d15023601db3e268510fd6257399dda737cdf709f9` |
| `generated/indexes/relationships.json` | 29,990 | `1763040149e1687a9f01439d047a2adf3872a9c24d6ffe0dd30ddc18b4320824` |
| `generated/indexes/sources.json` | 36,536 | `b1ca0b9c3ab535336f5400210ef047a9740b5fd8f21ca0446cccbaea3ed9deb0` |

The manifest independently reconciles 139 nodes, 261 total edges, 24 semantic edges, 237 provenance
edges, 31 forward and reverse relationship entries, 8 eligible, 16 excluded, 0 unresolved, 0 invalid
orphans, graph/generator contract version 1, and the exact 12-file inventory. Its input fingerprint is
`sha256:ad827bcfa37e9cb0a0510dbc51ab2149598e2e3200b2fa68c25490faa34ddc68`.
It stays stable across identical generation, changes after a governed input mutation, and includes no
timestamp, wall clock, absolute path, platform separator, locale, timezone, or random value.

Independent temporary copies exercised ten tamper classes:

| Tamper | `graph:check`/normal loader result |
| --- | --- |
| Alter scalar manifest value | stale / rejected |
| Remove node | stale / rejected |
| Add duplicate edge | stale / rejected |
| Reorder concept records | stale / rejected |
| Remove exact source locator | stale / rejected |
| Alter traversal flag | stale / rejected |
| Add absolute Windows path | stale / rejected |
| Remove forward adjacency entry | stale / rejected |
| Add reverse adjacency entry | stale / rejected |
| Change graph contract version | stale; `GRAPH_SCHEMA_VERSION` on load |

After restoration, 12/12 artifacts were current. `graph:check` did not rewrite files. A same-version
manual change that set AKR-000010 traversable was accepted by the old normal loader and reproduced a
path leak; the audit fix makes every normal query recompute the expected projection and enforce exact
byte currentness before loading. The same attack now fails with `GRAPH_ARTIFACT_NOT_CURRENT`.

## Mutation assessment

The focused configuration was corrected from historical source-line ranges to the complete three M4
modules. The final focused run instrumented 1,875 mutants, selected 1,113 covered/static candidates,
and produced:

| File | Total score | Covered score | Killed | Timeout | Survived | No coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `graph-artifacts.ts` | 87.82% | 90.10% | 346 | 0 | 38 | 10 |
| `graph-projector.ts` | 90.05% | 90.05% | 199 | 0 | 22 | 0 |
| `graph-query.ts` | 76.31% | 78.84% | 378 | 2 | 102 | 16 |
| Total | 83.11% | 85.10% | 923 | 2 | 162 | 26 |

The JSON report SHA-256 is
`3f36ef5f13a9a4c079ae2a453f02fd7a052100c7d47db952ed7fe73eb5d0fc53`.
All 190 non-killed results reconcile into the following exhaustive risk groups:

| Residual group | Survived | No coverage | Timeout | Audit disposition |
| --- | ---: | ---: | ---: | --- |
| Artifact adjacency/order comparisons | 6 | 1 | 0 | targeted mismatch/currentness probes pass; Low |
| Artifact evidence helper details | 2 | 0 | 0 | exact evidence/source/locator mutations rejected; Low |
| Artifact load/parse diagnostic specificity | 2 | 1 | 0 | malformed-input wording only; exact currentness enforcement has no residual bypass |
| Artifact semantic fidelity branches | 28 | 8 | 0 | targeted node/index/provenance/relationship/qualifier probes pass; Low |
| Projector edge/provenance construction | 4 | 0 | 0 | production count/fidelity and removal probes pass; Low |
| Projector index/orphan/manifest presentation | 12 | 0 | 0 | independently recomputed; Low |
| Projector traversal policy branches | 6 | 0 | 0 | all 12 default-deny negative probes pass; Low |
| Query bounded walk/cycle/depth | 10 | 0 | 2 | cyclic and boundary fixtures terminate; no depth bypass; Low |
| Query filter/shape/order helpers | 15 | 1 | 0 | malformed broadening and repeat-order probes pass; Low |
| Query record/evidence/explain presentation | 72 | 15 | 0 | qualifier and provenance matrices match; presentation backlog |
| Structured-query redundant guards | 5 | 0 | 0 | equivalent/dominated guards; malformed inputs reject; Observation |
| Total | 162 | 26 | 2 | no Critical/High behavior reproduced |

The legacy mutation run passed its unchanged 60% break gate at 74.00% total / 76.46% covered:
1,092 killed, 32 timeout, 346 survived, 49 no coverage, and 0 errors. Its JSON report SHA-256 is
`1e3debcad109d68d5a4fe3356532dd0023b45e2138b58810f4bb3655c0f5661e`.
Observed score/timeout variation between otherwise identical Windows runs is recorded as Low test
scheduling variability; thresholds and global timeouts were not relaxed.

## Local validation

All commands ran on the final audit implementation tree using pnpm only:

| Command | Audit result |
| --- | --- |
| `pnpm install --frozen-lockfile` | pass; pnpm 10.23.0, lockfile unchanged |
| `pnpm format:check` | pass |
| `pnpm validate` | pass; 0 errors, 0 warnings |
| `pnpm graph:generate` twice | pass; 12 artifacts each, byte-identical |
| `pnpm graph:check` | pass; 12/12 current |
| `pnpm report:integrity` | pass; 12 reports written deterministically |
| `pnpm report:check` | pass; 12/12 current |
| `pnpm test`, run one | pass; 22 files, 267/267, 58.57 s |
| `pnpm test`, run two | pass; 22 files, 267/267, 33.00 s |
| `pnpm test:coverage` | pass; 93.32% statements, 83.00% branches, 97.25% functions, 95.12% lines |
| `pnpm test:mutation:graph` | pass; 83.11% total |
| `pnpm test:mutation` | pass; 74.00% total |
| Representative CLI families | pass; stable JSON and expected non-zero failures |
| Clean-checkout generate/check/query twice | pass; hashes and outputs identical; worktree clean |
| `git diff --check` | pass |

The frozen install warning that dependency build scripts are ignored is the existing pnpm policy;
esbuild still executed the complete Vitest/tsx boundary successfully.

## Hosted provenance

The pre-audit run `30756684255` was independently queried through the GitHub Actions API. Workflow
`Validate knowledge kernel`, event `push`, branch `main`, and head SHA
`9825216cffc97c162cc2514a44b09f0283c9d7be` were exact. Job `91519943928` passed legacy and focused
mutation; job `91519943949` passed the Windows validation matrix; job `91519943955` passed the Ubuntu
validation matrix. Both OS jobs passed locked install, formatting, repository validation, generated
graph/index currentness, unit/regression tests, coverage, and integrity currentness.

The audit-fix push triggered run `30800207983` on exact head SHA
`7c40879963ffe1c1f647bfa35d36f47045786a8c`, branch `main`, event `push`. Its job IDs are:

| Job ID | Job | Conclusion | Material steps |
| --- | --- | --- | --- |
| `91642789860` | mutation | success | locked install: success; legacy mutation: success; focused graph mutation: success |
| `91642789956` | validate (windows-latest) | success | format, validate, graph currentness, tests, coverage, integrity: success |
| `91642789995` | validate (ubuntu-latest) | success | format, validate, graph currentness, tests, coverage, integrity: success |

The overall run started at `2026-08-03T09:09:32Z`, completed at
`2026-08-03T10:03:27Z`, and concluded `success`. The legacy mutation step ran
from `09:09:53Z` through `09:48:19Z`; focused graph mutation ran from
`09:48:19Z` through `10:03:22Z`. These values were read from the run and job
APIs, not inferred from a badge.

## Findings

### M4-AUD-001

- Severity: High before remediation.
- Category: artifact currentness / traversal safety.
- Affected record/file: AKR-000010; `src/graph-artifacts.ts`; `src/graph-cli.ts`.
- Reproduction: edit same-version `generated/graph/graph.json`, set AKR-000010 traversable, then run
  a normal query through the old loader.
- Expected behavior: no manually changed generated byte may enter a normal query.
- Actual behavior: the old loader checked contract version but accepted the altered graph and could
  expose the excluded edge to traversal.
- Impact: one excluded relationship could become a normal path, meeting High severity.
- Required remediation: recompute expected artifacts and enforce byte currentness before every
  query load; add a regression attack.
- Disposition: remediated in the audit-fix commit; attack now returns
  `GRAPH_ARTIFACT_NOT_CURRENT`.
- M5 blocking: no after remediation; yes if reverted.

### M4-AUD-002

- Severity: Medium.
- Category: graph/index validator fidelity.
- Affected record/file: `src/graph-artifacts.ts`.
- Reproduction: alter index content, a semantic predicate, a provenance field, or remove an
  applicability edge in an in-memory artifact set while keeping simple counts intact.
- Expected behavior: independent graph validation reports governed fidelity drift.
- Actual behavior: several mutations previously produced no diagnostic.
- Impact: normal committed queries were protected only after M4-AUD-001 was fixed, but validator
  evidence was incomplete.
- Required remediation: add authoritative index/node/provenance/relationship/applicability fidelity
  checks and targeted tests.
- Disposition: remediated.
- M5 blocking: no.

### M4-AUD-003

- Severity: Medium.
- Category: structured-query integrity.
- Affected record/file: `src/graph-query.ts`.
- Reproduction: pass `{node:{fuzzy:["oidc"]}}`, `{node:{types:"protocol"}}`,
  `{relationships:"bad"}`, `{traversable_only:"false"}`, or `{unexpected:true}`.
- Expected behavior: malformed/unsupported shape fails closed.
- Actual behavior: old logic ignored the invalid constraint and returned all 24 concepts.
- Impact: false broad retrieval, without a demonstrated excluded-edge traversal bypass.
- Required remediation: exact top-level, node, relationship, and value-type validation with
  `GRAPH_QUERY_SHAPE`.
- Disposition: remediated; each input now returns zero results and a stable diagnostic.
- M5 blocking: no.

### M4-AUD-004

- Severity: Medium.
- Category: qualifier preservation.
- Affected record/file: relationship `strength` in `src/graph-types.ts`, projector, query
  explanation, and generated semantic edges.
- Reproduction: compare an authoritative relationship/index with its semantic edge/explanation.
- Expected behavior: full relationship qualifiers survive projection.
- Actual behavior: `strength` was dropped from semantic edges and explanation output.
- Impact: a future retrieval consumer could lose a governed evidence-strength boundary.
- Required remediation: project, validate, expose, generate, and test `strength`.
- Disposition: remediated.
- M5 blocking: no.

### M4-AUD-005

- Severity: Low.
- Category: CLI portability/ergonomics.
- Affected record/file: `src/graph-cli.ts`.
- Reproduction: invoke the script with a literal package-manager separator on a path where pnpm does
  not strip it.
- Expected behavior: documented command works consistently.
- Actual behavior: literal `--` was interpreted as an unknown command.
- Impact: command portability only; no semantic corruption.
- Required remediation: accept one optional leading separator and regression-test it.
- Disposition: remediated.
- M5 blocking: no.

### M4-AUD-006

- Severity: Low.
- Category: mutation residuals/test execution.
- Affected record/file: focused and legacy Stryker suites.
- Reproduction: compare repeated Windows mutation runs; scheduling changes timeout/survivor
  distribution despite unchanged source and passing gates.
- Expected behavior: safety-critical behavior is independently targeted even when mutation timing is
  variable.
- Actual behavior: aggregate score varies; residual presentation/equivalent branches remain.
- Impact: maintenance signal is noisy, but no traversal, currentness, provenance, applicability,
  direction, cycle, depth, or qualifier bypass was reproduced.
- Required remediation: incrementally kill meaningful residuals, especially query presentation and
  relationship-validator branches; do not chase equivalent mutants or relax thresholds.
- Disposition: accepted non-blocking backlog.
- M5 blocking: no.

## Git provenance

| Item | Value |
| --- | --- |
| Implementation baseline commit | `729b33001c6d20ff935ece4a8ce3b35cc49354c9` |
| Audit-fix commit | `7c40879963ffe1c1f647bfa35d36f47045786a8c` |
| Audit-report commit | the commit containing this file; intentionally not self-referential |
| Hosted tested implementation SHA | `7c40879963ffe1c1f647bfa35d36f47045786a8c` |
| Final HEAD | audit-report commit; recorded in the external handoff |
| Final `origin/main` | audit-report commit after push |
| Final divergence | verified `0 0` after report push |
| Final worktree | verified clean after report push |

The M4 implementation diff from audited M3 baseline `aa23532cc1c29d69554177e26bdaa329d6c9070f`
through the pre-audit report changed only M4 source/tests/configuration, generated projections,
documentation, package/CI integration, and one generated Markdown-link report. The audit-fix changes
are likewise confined to permitted M4 files. No lifecycle status exceeds its authorized boundary:
20 concepts are `drafted`, 4 concepts are `proposed`, 61 claims are `sourced`, 8 claims are
`proposed`, 20 relationships are `sourced`, 4 relationships are `proposed`, and 22 previously
human-admitted sources are `approved` for evidentiary use only. No content is `reviewed` or
`published`, and source admission is not content approval or canonicality.

M5 READY
