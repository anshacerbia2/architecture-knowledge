# ADR 0006 — Hybrid Retrieval Architecture

Status: proposed implementation decision
Date: 2026-08-04

This record is machine-authored. It is not human-reviewed, approved, published,
or canonical. It does not change any knowledge lifecycle state.

## Context

M4 provides a validated, deterministic graph and exact indexes, but it does not
rank natural-language queries. M5 needs bounded retrieval without creating a
second semantic authority or starting M6 answer generation. Repository records
and the current M4 projection remain authoritative; every database generation
is disposable derived state.

## Decision

Use PostgreSQL 16 full-text search plus pgvector 0.8.2 through `pg` 8.16.3 and
explicit SQL migrations. The local and CI image is pinned to
`pgvector/pgvector:0.8.2-pg16-bookworm`. PostgreSQL supplies transactions,
structured filtering, full-text indexing, and vector storage in one small
operational boundary. No ORM, Elasticsearch, graph database, approximate vector
index, or distributed cache is introduced.

M4 remains an in-repository graph. Retrieval invokes its contract and expands
only first-class relationship edges already marked traversable. A graph
database would duplicate governance and traversal policy without a measured M5
need.

## Retrieval units

Contract version 1 creates stable units from semantic boundaries:

- one overview and non-empty governed section units per concept;
- exactly one first-class claim per claim unit;
- exactly one relationship per relationship unit, including explicit traversal
  exclusion metadata;
- one governed metadata/boundary unit per source.

Identity is `record ID + unit kind + section key + ordinal`. Content hash is
separate. Ordinary sections are not split. A section above 1,200 estimated
tokens is split deterministically at paragraph boundaries, with deterministic
ordinals; claims are never split. Token estimates use a documented conservative
character heuristic for budgeting, not provider billing.

## Embedding contract

The production adapter is OpenAI:

| Field | Pinned value |
|---|---|
| Provider | OpenAI |
| Exact model ID | `text-embedding-3-small` |
| Dimension | 1536 |
| Distance | cosine |
| API | `POST /v1/embeddings` |
| Verification date | 2026-08-04 |

The official [embedding guide](https://developers.openai.com/api/docs/guides/embeddings)
states the default 1536 dimensions for this model and recommends cosine
similarity; the official
[`text-embedding-3-small` model page](https://developers.openai.com/api/docs/models/text-embedding-3-small)
identifies the exact model and embeddings endpoint. This tuple is hashed as an
embedding contract. Any model, dimension, distance, normalization, or provider
change requires an explicit migration and new generation.

The adapter batches requests, bounds concurrency and timeout, validates model,
count, dimensions, and finite numbers, and retries only timeouts, network
failures, 408, 409, 429, and 5xx responses with bounded exponential backoff and
jitter. Authentication and contract errors are not retried. A deterministic
token-hash fake adapter supports tests and CI; its results are functional
evidence only, never semantic-quality evidence.

## Lexical and vector indexes

Full-text search uses PostgreSQL `simple` configuration to avoid stemming away
technical identifiers. A stored `tsvector` and GIN index assign:

- A: record ID, human key, title, aliases;
- B: title and leading summary/statement;
- C: retrieval body;
- D: unit kind, tags, concept type, and domain.

Vector storage is `vector(1536)` with database dimension checks. Exact cosine
search is the correctness baseline. The seed corpus does not justify HNSW or
IVFFlat. A future approximate index requires separately measured recall and an
auditable exact-search path.

## Fusion, graph expansion, and budgeting

Lexical and vector ranks are combined with weighted reciprocal rank fusion:

```text
score = 1/(60 + lexical_rank) + 1/(60 + vector_rank)
        + exact_identity_boost - graph_distance_penalty
```

Missing channels contribute zero. Raw full-text scores and cosine values are
reported for explanation but are never mixed into the fused score. Exact stable
ID match receives 0.08 and exact title, human key, or alias receives 0.04.
Ties resolve by stable unit ID.

Graph expansion is available only in `hybrid-graph`, defaults to depth 1, and
is capped at depth 2. It uses only M4 `traversable=true` relationship edges,
preserves direction, follows symmetric edges from either endpoint, and applies
a 0.008 penalty per hop. `AKR-000010` is explicitly defense-in-depth forbidden.
Conditions, confidence, strength, scope, evidence, and locators remain payload
qualifiers; expansion does not assume conditions are true.

Deduplication uses unit ID. Deterministic selection enforces maximum units,
estimated tokens, and units per concept. Atomic claims are selected whole or
skipped whole. Selection and skip reasons are part of the retrieval packet.

## Generation and currentness

A generation identity hashes repository commit, M4 graph fingerprint,
retrieval manifest root, and embedding contract. Indexing creates `building`
state, reuses only contract-compatible content-hash embeddings, inserts a full
snapshot, verifies row count and database manifest, moves to `ready`, and
atomically activates it while superseding the previous generation. Failures
mark only the new generation failed; the prior active generation remains.

Currentness compares repository commit, graph input fingerprint, retrieval
manifest root, unit count, normalization/chunking versions, and embedding
contract. It then recomputes a sorted database manifest root over unit ID,
content hash, metadata hash, citation hash, vector presence and dimension,
generation ID, and embedding contract. A mismatch fails with
`RETRIEVAL_INDEX_NOT_CURRENT`. CLI startup may recompute the complete small
manifest. A future service should verify an immutable snapshot at startup or
reload and hold that verified generation while serving.

Database states (`building`, `ready`, `active`, `failed`, `superseded`) are
infrastructure states and never knowledge lifecycle states.

## Privacy and failure behavior

API keys are environment-only and never logged. Query text and provider
payloads are not persisted or logged by default. External requests have size,
batch, concurrency, and timeout bounds. `RETRIEVAL_DATA_CLASSIFICATION` must be
allowed by the provider configuration before content is sent. The current
external allowlist defaults to `public`; future confidential content requires
an explicitly approved private or local provider.

No database connection, missing generation, stale/tampered generation,
provider unavailability, and contract mismatch fail explicitly. Hybrid does
not silently become lexical. A caller may explicitly permit lexical fallback;
the packet then carries `degraded: true` and a stable reason. Empty retrieval
returns a valid empty packet and never fabricates concepts.

## Evaluation

The draft benchmark contains at least 40 exact, alias, technical, paraphrase,
problem, trade-off, risk, failure, security, multi-concept, filtered, negative,
and adversarial cases with a holdout. Deterministic metrics are Recall@1/5/10,
Precision@5, MRR@10, nDCG@10, no-answer accuracy, citation and locator
completeness, prohibited results, and excluded-edge leakage, separately for
lexical, vector, hybrid, and hybrid-graph. Hybrid gates are Recall@5 at least
0.90 and MRR@10 at least 0.80 and no worse than the stronger single channel.
Safety gates require complete citations/locators, zero excluded leakage, and
perfect no-answer behavior for governed negative cases.

## Rejected alternatives

- PostgreSQL web-search or English stemming: weaker precision for identifiers
  and technical language without benchmark justification.
- Raw score addition: lexical and cosine scales are incomparable.
- Similarity-created graph edges: similarity is retrieval signal, not evidence.
- Embedding external source bodies: violates source-use boundaries and is not
  required for governed metadata retrieval.
- Committed vectors: provider outputs are operational derived state and may
  expose corpus content or create noisy diffs.
- Incremental indexing: full snapshots are safer and cheap for the seed corpus.

## M6 boundary

M5 returns evidence-preserving candidate packets only. It does not call a
generative model, compose final context prompts, answer architecture questions,
recommend a decision, create an ADR, or modify the corpus. M6 remains future.

