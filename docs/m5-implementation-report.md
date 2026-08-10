# M5 Hybrid Retrieval Implementation Report

## Executive summary

M5 implements deterministic semantic retrieval units, PostgreSQL 16 full-text
search, pgvector exact cosine retrieval, a real OpenAI embedding adapter, a
deterministic test adapter, full-snapshot generation activation and fidelity
checking, weighted reciprocal-rank fusion, M4-governed graph expansion,
fail-closed structured filters, deterministic diversity/token budgets, stable
evidence packets, and a draft retrieval benchmark. This is an implementation
report, not an independent audit and not a knowledge lifecycle transition.

Hosted PostgreSQL integration, performance, and exact-SHA provenance fields
remain to be filled from observed runs before audit handoff.

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
| Active generation | pending hosted PostgreSQL run |

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
holdout. Final observed database-backed mode metrics are pending the hosted
PostgreSQL job.

| Metric | Lexical | Vector | Hybrid | Hybrid + graph |
|---|---:|---:|---:|---:|
| Recall@1 | pending | pending | pending | pending |
| Recall@5 | pending | pending | pending | pending |
| Recall@10 | pending | pending | pending | pending |
| Precision@5 | pending | pending | pending | pending |
| MRR@10 | pending | pending | pending | pending |
| nDCG@10 | pending | pending | pending | pending |

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
Two complete runs each passed 302 tests; four PostgreSQL tests were explicitly
skipped because this host has PostgreSQL but no pgvector installation. Coverage
passed at 91.58% statements, 80.51% branches, 94.37% functions, and 94.14%
lines. The corrected expanded retrieval mutation boundary passed at 73.93%
against a 60% break threshold. Subsequent targeted regressions cover
missing-generation, manifest-root, provider-exhaustion, mode-isolation, SQL
parameter-placement, and graph-expansion risks. Hosted final values remain
pending.

## Performance evidence

The current corpus has 487 retrieval rows and 487 embeddings per complete
provider generation before contract-compatible cache reuse. The index command
reports build duration, provider duration, requested embeddings, cache hits,
and active-generation reuse. `retrieval:benchmark` reports database size,
inventory, warmed lexical/vector/hybrid p50/p95, graph expansion, query-provider
latency, and end-to-end observations. Values are pending the hosted PostgreSQL
run. External provider latency remains separate and is not measured by fake CI.
No timing assertion is a correctness gate.

## Hosted CI

The workflow defines Ubuntu and Windows platform-independent validation,
PostgreSQL/pgvector integration on Ubuntu, legacy mutation, focused graph
mutation, and focused M5 mutation. Run ID, exact SHA, and observed job outcomes
are pending; no hosted success is claimed here yet.

## Git provenance

| Field | Value |
|---|---|
| Primary implementation commit | pending |
| Final implementation/fix commit | pending |
| Report commit | intentionally not self-referential; record after commit if needed |
| Hosted tested SHA | pending |
| Final HEAD | pending |
| Final `origin/main` | pending |
| Divergence | pending |
| Worktree | pending |

## Residual findings

- Critical: none identified locally.
- High: hosted PostgreSQL, mutation, exact-SHA CI, and final quality gates are
  not yet observed; this blocks audit handoff until completed.
- Medium: a real-provider benchmark is intentionally not part of secret-free
  deterministic CI; semantic-quality claims require a separately authorized
  run.
- Low: exact vector search is correct for the seed corpus; approximate-index
  performance remains an evidence-triggered future option.
- Observation: local Docker is unavailable on this Windows host, so no local DB
  result will be fabricated.

## Exit statement

M5 IMPLEMENTATION INCOMPLETE
