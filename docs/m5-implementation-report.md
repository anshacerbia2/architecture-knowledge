# M5 Hybrid Retrieval Implementation Report

## Executive summary

M5 implements deterministic semantic retrieval units, PostgreSQL 16 full-text
search, pgvector exact cosine retrieval, a real OpenAI embedding adapter, a
deterministic test adapter, full-snapshot generation activation and fidelity
checking, weighted reciprocal-rank fusion, M4-governed graph expansion,
fail-closed structured filters, deterministic diversity/token budgets, stable
evidence packets, and a draft retrieval benchmark. This is an implementation
report, not an independent audit and not a knowledge lifecycle transition.

Hosted PostgreSQL integration, performance, mutation, and exact-SHA provenance
were observed on the final implementation/fix commit before audit handoff.

## Baseline

| Field | Observed starting value |
|---|---|
| M4 verdict | `M5 READY` |
| Branch | `main` |
| HEAD | `0075672e03ca5fc6c894966e4a83f6ecb956409f` |
| `origin/main` | `0075672e03ca5fc6c894966e4a83f6ecb956409f` |
| Divergence | `0 0` |
| Worktree | clean |
| M4 audit | `docs/m4-independent-audit-report.md` |

No intervening commit existed at implementation start.

## Architecture

- Retrieval units follow concept overview/section, atomic claim, first-class
  relationship, and source metadata boundaries. Stable unit identity is
  independent of content hash.
- Migration `0001_retrieval.sql` enables pgvector and creates generation,
  embedding-cache, and retrieval-unit tables with dimension, uniqueness,
  lifecycle-independent state, full-text, and active-generation constraints.
- PostgreSQL `simple` full-text configuration weights identity A, summary B,
  body C, and auxiliary metadata D through a stored `tsvector` and GIN index.
- Vectors use `vector(1536)` and exact cosine distance. No approximate index is
  present.
- OpenAI and deterministic fake providers share a validated contract. Only the
  explicit external adapter crosses the provider trust boundary.
- Generation identity covers repository commit, graph fingerprint, retrieval
  manifest, and embedding contract. Row-manifest recomputation protects
  metadata, citations, content, embedding presence/dimension, and count.
- Fusion uses equally weighted RRF with `k=60`, then exact identity boost and a
  graph-distance penalty. Raw channel scores remain explanation only.
- Graph expansion is default-deny, depth 1 by default and 2 maximum. It accepts
  only M4 traversable edges and explicitly rejects `AKR-000010`.
- Unit-ID deduplication, per-concept diversity, whole-unit token selection, and
  stable tie breaking produce bounded packets. Atomic claims are not cut.

## Embedding model decision

| Field | Decision |
|---|---|
| Provider | OpenAI |
| Exact model | `text-embedding-3-small` |
| Dimension | 1536 |
| Distance | cosine |
| Official source | `https://developers.openai.com/api/docs/guides/embeddings` and exact model page |
| Verified | 2026-08-04 |
| External data boundary | environment key; default `public` allowlist; no payload/query persistence or logging |

The fake provider is CI correctness infrastructure. Its benchmark does not
claim real-provider semantic quality.

## Database inventory

| Category | Inventory |
|---|---|
| Migration | `migrations/0001_retrieval.sql` |
| Extension | `vector` |
| Tables | `retrieval_schema_migrations`, `retrieval_generations`, `retrieval_embedding_cache`, `retrieval_units` |
| Key constraints | one active generation, five infrastructure states, `vector(1536)`, vector dimension checks, generation-scoped unit identity, non-empty unit text |
| Indexes | full-text GIN, JSONB GIN, generation/kind, generation/record, generation/concept |
| Active generation | `rg:sha256:bf55d08944f7f21c8b84f31a9` on hosted run `31367937331` |

## Retrieval unit inventory

| Family | Count |
|---|---:|
| Concept overview | 24 |
| Concept section | 348 |
| Claim | 69 |
| Relationship | 24 |
| Source | 22 |
| Total | 487 |
| Estimated tokens | 38,862 |

The initial manifest root is
`sha256:a3998c4b4a24dd12caefd22389b3c59b13f9b947f842c6ae10881121c92de0e2`.
No vectors are committed.

## Query capability matrix

| Capability | Implementation behavior |
|---|---|
| Lexical | weighted PostgreSQL full text with exact identity rerank |
| Vector | exact pgvector cosine with pinned dimensions and minimum signal |
| Hybrid | weighted RRF; missing channel contributes zero |
| Hybrid graph | bounded directed/symmetric expansion through eligible M4 edges only |
| Structured filters | exact allowlisted metadata filters; malformed shapes fail closed |
| Exact ID | highest exact-identity boost and A-weighted lexical identity |
| No answer | valid empty packet; benchmark negatives use governed filters |
| Malformed query | non-zero stable diagnostic; no broad fallback |
| Stale generation | `RETRIEVAL_INDEX_NOT_CURRENT` before retrieval |
| Degradation | explicit opt-in lexical fallback, visibly labeled |

## Evaluation matrix

The draft benchmark has 46 cases across more than ten categories and includes a
holdout. The deterministic fake-provider run is functional retrieval evidence,
not a real-provider semantic-quality claim.

| Metric | Lexical | Vector | Hybrid | Hybrid + graph |
|---|---:|---:|---:|---:|
| Recall@1 | 0.7337 | 0.7446 | 0.8315 | 0.8315 |
| Recall@5 | 0.7609 | 0.8533 | 0.9565 | 0.9565 |
| Recall@10 | 0.7609 | 0.8641 | 0.9674 | 0.9674 |
| Precision@5 | 0.1522 | 0.1870 | 0.2130 | 0.2130 |
| MRR@10 | 0.6739 | 0.7536 | 0.8406 | 0.8406 |
| nDCG@10 | 0.7609 | 0.8363 | 0.9233 | 0.9233 |

All four modes observed citation completeness `1.0`, source-locator
completeness `1.0`, no-answer accuracy `1.0`, prohibited-result count `0`, and
excluded-edge leakage `0`. Evaluation gates passed with no failures. Hybrid
exceeded both single channels on Recall@5, MRR@10, and nDCG@10.

## Safety matrix

| Risk | Control/evidence |
|---|---|
| Stale generation | metadata and full DB manifest recomputation; unit and integration tests |
| Graph exclusion | hard traversal filter plus explicit `AKR-000010` defense; regression test |
| SQL injection | user values are parameters; adversarial parameter-placement test |
| Dimension mismatch | provider validation, `vector(1536)`, database checks |
| Provider mismatch | contract fingerprint in identity, cache key, generation, and startup check |
| Source locators | exact structured locations copied into unit metadata and citations |
| Malformed query broadening | closed object schemas and bounded numeric/string-array parsing |
| Citation completeness | deterministic evaluation gate at 100% |

No content lifecycle status was elevated.

## Determinism

Two generation runs produced identical unit and manifest SHA-256 values:
`406e270e74579b8e9b0c54272ab8e34dc29adc2f9e79b5a2324203951b8908d2`
and `99f03d56dfd31f26f875f4642d8fc80e1a1ee62c44bd4dea693b91bea7879371`.
Focused tests independently rebuild units and compare byte maps and manifest
roots. Fake embeddings are stable for stable normalized text. Query ordering
uses ranks and unit ID, never time or random generation identity.

## Test evidence

Local focused M5 evidence includes retrieval units, embedding providers,
query/CLI/ranking/graph/budget, evaluation, and currentness/tamper regressions.
Two complete pre-fix runs each passed 302 tests and final local plus clean
checkout runs each passed 306 tests; four PostgreSQL tests were explicitly
skipped because this host has PostgreSQL but no pgvector installation. Coverage
passed at 91.58% statements, 80.51% branches, 94.37% functions, and 94.14%
lines. The corrected expanded retrieval mutation boundary passed at 73.93%
against a 60% break threshold. Subsequent targeted regressions cover
missing-generation, manifest-root, provider-exhaustion, mode-isolation, SQL
parameter-placement, and graph-expansion risks. Hosted mutation scores were
90.78% for the legacy boundary, 83.11% for the focused graph boundary, and
79.68% for the focused retrieval boundary, each above its 60% break threshold.

## Performance evidence

The hosted database contained 487 retrieval rows, 487 embeddings, and 487 cache
entries and occupied 18,988,055 bytes. Initial index build was 1,155.533 ms;
the deterministic provider accounted for 108.327 ms and embedded all 487 rows
with zero cache hits. After three warm-ups, 20 measured runs observed:

| Operation | p50 ms | p95 ms |
|---|---:|---:|
| Lexical PostgreSQL | 0.945 | 1.481 |
| Vector PostgreSQL | 5.757 | 6.628 |
| Hybrid PostgreSQL | 6.627 | 7.236 |
| Graph expansion | 0.046 | 0.112 |
| Fake query embedding | 0.272 | 0.341 |
| End-to-end hybrid graph | 7.878 | 10.444 |

External-provider latency remains separate and was not measured by fake CI.
No timing assertion is a correctness gate.

## Hosted CI

Hosted run `31367937331` tests exact implementation/fix SHA
`6ce4f701dea01aa85439651f6d9929f8597afe69`. Ubuntu validation, Windows
validation, PostgreSQL/pgvector integration, and the complete mutation job all
passed. The run completed with conclusion `success`.

## Git provenance

| Field | Value |
|---|---|
| Primary implementation commit | `9b36aa6ec6c9debb391b7248d83315fffa2a29a7` |
| Final implementation/fix commit | `6ce4f701dea01aa85439651f6d9929f8597afe69` |
| Report commit | commit containing this report; intentionally not self-referential |
| Hosted tested SHA | `6ce4f701dea01aa85439651f6d9929f8597afe69` |
| Final HEAD | report commit; exact SHA recorded in the implementation handoff |
| Final `origin/main` | report commit after push; exact SHA recorded in the implementation handoff |
| Divergence | verified after report push and recorded in the implementation handoff |
| Worktree | verified after report push and recorded in the implementation handoff |

## Residual findings

- Critical: none identified locally.
- High: none identified by implementation validation.
- Medium: a real-provider benchmark is intentionally not part of secret-free
  deterministic CI; semantic-quality claims require a separately authorized
  run.
- Low: exact vector search is correct for the seed corpus; approximate-index
  performance remains an evidence-triggered future option.
- Observation: local Docker is unavailable on this Windows host, so no local DB
  result will be fabricated.

## Exit statement

READY FOR INDEPENDENT M5 AUDIT
