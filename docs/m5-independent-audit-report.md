# M5 Independent Audit Report

## 1. Executive Verdict

Verdict: `M5 AUDIT INCONCLUSIVE`.

Directly verified evidence supports deterministic retrieval-unit construction,
local validation currentness, local non-database tests, coverage, fail-closed
query-shape parsing, and explicit graph exclusion of `AKR-000010`.

The audit could not independently reproduce or verify required
PostgreSQL/pgvector integration, retrieval evaluation, benchmark performance, or
hosted exact-SHA CI provenance from this workstation. Those gaps prevent an M6
entry clearance under the requested criteria.

No unresolved Critical or High implementation defect was directly observed.

## 2. Audited Commit and Provenance

Local repository evidence:

| Item | Observed evidence |
|---|---|
| Branch | `main` |
| Local `HEAD` | `95733338228f0b0a49634df07430ffca655465e0` |
| `origin/main` | `95733338228f0b0a49634df07430ffca655465e0` |
| Divergence | `git status --short --branch` reported `## main...origin/main` |
| Worktree before report | clean |
| M5 implementation/fix SHA | `6ce4f701dea01aa85439651f6d9929f8597afe69` exists locally |
| Delta from implementation/fix SHA to audited HEAD | one documentation file: `docs/m5-implementation-report.md` |

The diff from `6ce4f701dea01aa85439651f6d9929f8597afe69..HEAD` modifies only
`docs/m5-implementation-report.md`; no executable file changed after the hosted
implementation/fix SHA.

Hosted run `31367937331` could not be independently verified locally:

- `gh` is not installed.
- GitHub REST request to
  `https://api.github.com/repos/anshacerbia2/architecture-knowledge/actions/runs/31367937331`
  returned `404 Not Found`, consistent with unavailable public or unauthenticated
  evidence.
- Therefore hosted claims in `docs/m5-implementation-report.md` remain
  implementation claims, not independently verified audit evidence.

## 3. Scope, Methodology, and Independence Statement

This audit covered M5 only. No M6 work, ontology changes, knowledge corpus
changes, implementation edits, generated artifact edits, commits, or pushes were
performed.

Methods used:

- Read all repository `AGENTS.md` files.
- Verified local Git state and post-implementation diff boundaries.
- Inspected retrieval unit generation, query parsing, ranking, graph expansion,
  database migration, indexing/currentness, embedding provider, CLI, tests, and
  implementation report files.
- Ran committed validation and test commands with `pnpm`.
- Ran targeted adversarial probes against retrieval artifacts, malformed
  filters, malformed queries, graph depth, injected enum values, unsupported
  fields, and `AKR-000010` traversal exclusion.
- Treated `docs/m5-implementation-report.md` as an implementation claim unless
  independently reproduced.

## 4. Limitations and Unavailable Evidence

Unavailable locally:

- PostgreSQL/pgvector service at `127.0.0.1:54329`.
- Docker command; `docker` was not installed or not on `PATH`.
- Local `pnpm retrieval:evaluate` and `pnpm retrieval:benchmark`, both failed
  with `connect ECONNREFUSED 127.0.0.1:54329`.
- Local PostgreSQL/pgvector integration tests; Vitest reported
  `tests/retrieval-database.integration.test.ts` as 4 skipped tests.
- Local mutation completion; three mutation commands exceeded the 10-minute
  command timeout and left temporary Stryker workers/sandboxes that were cleaned.
- Hosted CI exact-SHA evidence; GitHub API returned `404` unauthenticated and
  `gh` was unavailable.
- Real OpenAI provider semantic-quality benchmark; not run because the request
  prohibited sending corpus content externally without explicit authorization.

## 5. Requirement-Compliance Matrix

| Requirement area | Audit result |
|---|---|
| Repository and provenance | Partially verified locally; hosted provenance unavailable |
| Retrieval-unit construction | Verified locally |
| PostgreSQL and pgvector design | Source inspected; runtime integration unavailable |
| Embedding-provider contract | Source and tests inspected; real provider not exercised |
| Retrieval correctness | Source/tests/probes verified; DB-backed ranking unavailable |
| Graph-expansion safety | Source/tests/probes verified |
| Filters and fail-closed behavior | Source/tests/probes verified |
| Evidence packets and citations | Artifact/source inspected; DB packet execution unavailable |
| Evaluation validity | Fixture/source inspected; DB-backed metric recomputation unavailable |
| Currentness and tamper resistance | Source/tests inspected; DB-backed runtime unavailable |
| Security and privacy | Source inspected; injection treated as parameterized query text |
| Tests, coverage, mutation | Validation/tests/coverage passed; mutation local result unavailable |
| Performance and operations | Methodology inspected; local benchmark unavailable |

## 6. Retrieval-Unit Inventory and Determinism Results

Independent local probe using `expectedRetrievalArtifacts(root)` twice observed:

| Unit family | Count |
|---|---:|
| concept-overview | 24 |
| concept-section | 348 |
| claim | 69 |
| relationship | 24 |
| source | 22 |
| total | 487 |
| estimated tokens | 38,862 |

Manifest root observed:
`sha256:a3998c4b4a24dd12caefd22389b3c59b13f9b947f842c6ae10881121c92de0e2`.

The two in-memory generation runs produced byte-identical artifact file maps.
`pnpm retrieval:units:check` reported `Retrieval artifact check: 2/2 current`.

Stable unit IDs are formed as
`ru:{record_id}:{unit_kind}:{section_key}:{ordinal}` in
`src/retrieval-units.ts`, independent of mutable content hashes. Content hashes
cover normalized text, metadata, and citations.

## 7. Database and Generation-Currentness Assessment

Source inspection of `migrations/0001_retrieval.sql` found:

- `CREATE EXTENSION IF NOT EXISTS vector`.
- `vector(1536)` for cache and unit embeddings.
- `CHECK (vector_dims(embedding) = embedding_dimension)` in cache.
- `CHECK (vector_dims(embedding) = 1536)` in retrieval units.
- one-active-generation partial unique index on `status = 'active'`.
- full-text GIN index and supporting generation/kind/record/concept indexes.
- no HNSW or approximate vector index; exact vector search is implemented.

Source inspection of `src/retrieval-indexer.ts` found:

- generation identity includes repository commit, graph fingerprint, retrieval
  manifest root, and provider contract fingerprint.
- active generation reuse calls `checkRetrievalCurrent`.
- insertion of retrieval units occurs inside a transaction before ready/active
  transition.
- currentness recomputes a database manifest over row hashes, citation hashes,
  embedding presence, vector dimensions, and expected unit count.
- failures mark non-active building generations failed; an existing active
  generation is preserved.

Runtime PostgreSQL behavior was not locally reproduced because no database
service was available.

## 8. Retrieval and Ranking Correctness Assessment

Source inspection of `src/retrieval-query.ts` found:

- lexical search uses PostgreSQL `websearch_to_tsquery('simple', $2)` and
  `ts_rank_cd`.
- vector search uses `1 - (embedding <=> $2::vector)` and orders by cosine
  distance ascending.
- fusion uses weighted reciprocal-rank fusion with missing channels contributing
  zero.
- `RRF_K` is imported from `src/retrieval-config.ts`.
- exact record ID, title, human key, and alias boosts are applied separately
  from raw lexical/vector scores.
- ties fall back to `unit_id` lexical ordering.
- budgets select whole units and do not split atomic claims at query time.

DB-backed representative query recomputation was unavailable. Therefore the
claimed hybrid metrics remain unverified locally.

## 9. Graph-Expansion Safety Assessment

Source inspection and a local probe found:

- `graphExpansionPaths` rejects depths outside `0..2`.
- traversal filters to graph edges with `family === "relationship"` and
  `traversable === true`.
- relationship `AKR-000010` is explicitly excluded.
- directional edges traverse only `from -> to`; symmetric edges traverse either
  direction.
- cycles are bounded by `state.nodeIds.includes(next)`.
- seed concepts are removed from expansion results.

Probe result for seed `AKC-000001` at depth 2 reported
`containsExcluded: false`.

The retrieval unit for `AKR-000010` exists as a relationship unit, but its
metadata showed `traversal_eligible: false`; that is acceptable retrieval of the
relationship record itself and not graph traversal leakage.

## 10. Filter, Citation, Security, and Privacy Assessment

`src/retrieval-query-contract.ts` rejects unknown top-level fields, unknown
filter fields, non-object filters, invalid unit kinds, empty query text, invalid
graph depth, and unsupported modes with `RETRIEVAL_QUERY_SHAPE`.

Adversarial local probes rejected:

- unknown filter field `x`;
- whitespace-only query text;
- graph depth `3`;
- injected `unit_kinds` value `source; DROP TABLE retrieval_units; --`;
- unknown top-level field `foo`.

SQL source inspection found user-controlled values passed as query parameters.
The only dynamic SQL fragments are generated from fixed column names and
parameter positions after schema parsing has completed.

OpenAI provider source inspection found:

- pinned provider/model/dimension from `PRODUCTION_EMBEDDING`;
- API key read from environment and not printed by CLI;
- default allowed data classification `public`;
- request timeout, bounded batch size, bounded concurrency, retry/backoff;
- response count, model, order, vector dimension, and non-finite validation.

No real-provider payload was sent.

## 11. Independent Evaluation Metrics

Local metric recomputation was unavailable because `pnpm retrieval:evaluate`
requires an active PostgreSQL generation and failed with
`connect ECONNREFUSED 127.0.0.1:54329`.

The implementation report claims:

| Metric | Hybrid claim |
|---|---:|
| Recall@5 | 0.9565 |
| MRR@10 | 0.8406 |
| nDCG@10 | 0.9233 |

These are unverified implementation claims in this audit. Source inspection of
`evaluation/retrieval-golden.yaml` and `src/retrieval-evaluation.ts` indicates a
structured benchmark exists, but without DB execution this audit cannot confirm
that hybrid retrieval materially improves over lexical and vector baselines.

## 12. Performance-Methodology Assessment

Local `pnpm retrieval:benchmark` failed with
`connect ECONNREFUSED 127.0.0.1:54329`.

The implementation report separates deterministic fake-provider latency from
external OpenAI latency, which is the correct methodological distinction.
However, all reported runtime values remain unverified implementation claims in
this audit.

## 13. Validation, Test, Coverage, Mutation, and Hosted-CI Evidence

Commands executed:

| Command | Local result |
|---|---|
| `pnpm install --frozen-lockfile` | passed; lockfile current; esbuild build scripts ignored |
| `pnpm format:check` | passed |
| `pnpm validate` | passed; 0 errors, 0 warnings |
| `pnpm graph:check` | passed; 12/12 current |
| `pnpm retrieval:units:check` | passed; 2/2 current |
| `pnpm report:check` | passed; 12/12 current |
| `pnpm test` | passed; 306 passed, 4 skipped |
| `pnpm test:coverage` | passed; 92.37% statements, 81.29% branches, 95.2% functions, 94.84% lines |
| `pnpm retrieval:evaluate` | failed; PostgreSQL connection refused |
| `pnpm retrieval:benchmark` | failed; PostgreSQL connection refused |
| `pnpm test:mutation` | inconclusive; timed out after 10 minutes |
| `pnpm test:mutation:graph` | inconclusive; timed out after 10 minutes |
| `pnpm test:mutation:retrieval` | inconclusive; timed out after 10 minutes |
| `docker --version` | unavailable; command not found |
| `gh run view ...` | unavailable; `gh` command not found |
| GitHub REST run lookup | unavailable; returned 404 |

Initial non-escalated test and evaluation commands failed with sandbox
`spawn EPERM`; reruns outside the sandbox produced the results above.

## 14. Complete Finding Register

### M5-AUD-001: Required PostgreSQL/pgvector Runtime Evidence Not Locally Reproducible

Severity: Observation

Status: Open

Affected files/components: `migrations/0001_retrieval.sql`,
`src/retrieval-indexer.ts`, `src/retrieval-query.ts`,
`tests/retrieval-database.integration.test.ts`.

Requirement or invariant: M5 entry evidence requires PostgreSQL/pgvector
integration, currentness, activation, query, evaluation, and benchmark behavior
to be reproducible or independently verified.

Evidence: `pnpm retrieval:evaluate` and `pnpm retrieval:benchmark` failed with
`connect ECONNREFUSED 127.0.0.1:54329`; `docker --version` failed because
Docker was unavailable; Vitest skipped 4 database integration tests.

Reproduction procedure: from repository root run `pnpm retrieval:evaluate`,
`pnpm retrieval:benchmark`, and `docker --version`.

Expected behavior: A reachable PostgreSQL/pgvector instance permits migration,
indexing, currentness, retrieval evaluation, benchmark, and integration tests.

Observed behavior: No local database service was available.

Impact: The audit cannot independently prove runtime database fail-safety,
ranking correctness, evaluation metrics, or performance.

Recommended disposition: Re-run audit database commands in an environment with
the committed Docker Compose service or a documented PostgreSQL/pgvector
instance.

Blocks M6: Yes, as an evidence gap for this audit decision.

### M5-AUD-002: Hosted Exact-SHA Evidence Not Independently Accessible

Severity: Observation

Status: Open

Affected files/components: hosted run `31367937331`,
`docs/m5-implementation-report.md`.

Requirement or invariant: Exact-SHA hosted evidence must be verified rather
than accepted from the implementation report.

Evidence: `gh` was unavailable; unauthenticated GitHub REST lookup for run
`31367937331` returned `404 Not Found`.

Reproduction procedure: run
`gh run view 31367937331 --repo anschacerbia2/architecture-knowledge` or query
the GitHub REST workflow-run endpoint without credentials.

Expected behavior: The audit can verify run head SHA, conclusion, job matrix,
and logs/artifacts for the claimed run.

Observed behavior: Hosted evidence was not accessible from this environment.

Impact: The audit cannot close gaps left by unavailable local database,
evaluation, benchmark, mutation, Linux, Windows, and pgvector evidence.

Recommended disposition: Provide authenticated GitHub Actions read access or
export immutable run summaries/artifacts for independent verification.

Blocks M6: Yes, as an evidence gap for this audit decision.

### M5-AUD-003: Local Mutation Evidence Did Not Complete Within Audit Timeout

Severity: Observation

Status: Open

Affected files/components: `stryker*.config.json`, mutation jobs.

Requirement or invariant: Mutation evidence should be available for the ID,
claim, relationship, lifecycle, graph, and retrieval logic boundaries.

Evidence: `pnpm test:mutation`, `pnpm test:mutation:graph`, and
`pnpm test:mutation:retrieval` each timed out after 10 minutes. Temporary
`.stryker-tmp` sandboxes were created and later removed because they interfered
with repository validation discovery.

Reproduction procedure: run the three mutation commands from repository root in
the audited environment.

Expected behavior: Mutation jobs complete and report scores.

Observed behavior: The commands did not return within the available command
timeout.

Impact: Local audit cannot confirm mutation strength. Hosted mutation claims
remain unverified due M5-AUD-002.

Recommended disposition: Re-run mutation jobs in CI or a local environment with
sufficient execution window and provide immutable summaries.

Blocks M6: Yes, as an evidence gap for this audit decision.

## 15. Residual-Risk Register

| Risk | Status | Bound |
|---|---|---|
| Real OpenAI semantic quality differs from deterministic fake provider | Open | No external provider run was authorized |
| Exact vector search scaling limit | Open | Acceptable for current 487-unit corpus, but future growth needs measurement |
| Database runtime behavior | Open | Source design looks fail-safe, but local runtime proof unavailable |
| Hosted CI provenance | Open | Implementation report claims success, but audit could not verify |
| Evaluation overfitting or weak negatives | Open | Fixture exists, but metrics could not be recomputed locally |

## 16. M6 Entry-Condition Matrix

| Criterion | Result |
|---|---|
| no unresolved Critical or High finding | Pass locally |
| deterministic retrieval artifacts verified | Pass |
| PostgreSQL activation and currentness fail-safe | Inconclusive |
| embedding contracts cannot be mixed or silently reused | Pass by source/tests; DB runtime inconclusive |
| lexical, vector, hybrid, graph-assisted modes behave as specified | Inconclusive without DB execution |
| graph expansion respects M4 traversal governance | Pass by source/tests/probes |
| malformed filters and queries fail closed | Pass |
| citations and source locators complete and resolvable | Pass for artifacts; DB packets inconclusive |
| evaluation results reproducible and not materially misleading | Inconclusive |
| required validation, integration, coverage, mutation evidence passes | Inconclusive |
| exact-SHA hosted evidence verified | Inconclusive |
| remaining risks bounded and non-blocking | Fail for audit decision |

## 17. Exact Final Verdict

M5 has strong local deterministic and source-level evidence, and no direct
Critical or High implementation defect was found. However, required database,
evaluation, benchmark, mutation, and hosted provenance evidence was unavailable
or incomplete in this environment. Under the requested M6 entry criteria, that
prevents a safe readiness decision.

`M5 AUDIT INCONCLUSIVE`
