# M7.2 Post-Merge Retrieval Regression

Implementation remediation, not an independent audit, content approval, or
runtime-entry clearance. Failed base: `518019ca4dd6563d1c20987e00357340454709ea`.

## Failure and cause

[Merge run 47](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34377248917)
failed in `rag:evaluate` inside retrieval-integration. PostgreSQL integration
and the retrieval evaluation had passed. RAG answer-status accuracy was 1,
but model-invocation accuracy was 22/23 overall and 7/8 on the holdout partition.

RAG-016 asks about quantum error-correction topology and requires no model
invocation when evidence is absent. The new AKL-000070 claim about a modular
monolith scored approximately 0.153429 against that query, exceeding the
unchanged vector threshold of 0.15. Its repeated article `a` and a signed hash
collision between `error-correction` and `akl-000070` explain the false hit.
The corresponding maximum before the pilot was approximately 0.127000.
These scores were reproduced from the committed retrieval texts with the
deterministic fake embedding provider, not a live semantic embedding model.

Retrieval supplied the unrelated evidence, so RAG invoked its provider. The
fake answer provider then returned insufficient evidence. The final answer
status was correct, but the invocation contract was violated. The evaluator
correctly failed; neither its expectations nor its safety registry need repair.

## Bounded correction

- Only instances of the deterministic fake embedding provider receive an
  unhashed whole-token overlap check on vector candidates. English function
  words alone cannot establish that overlap.
- Filter before fusion, budgeting, and graph expansion, so a hash-only hit
  cannot seed traversal. Preserve original vector ranks for remaining hits.
- Explain excluded units with `fake-vector-no-token-overlap`. A unit retained
  through lexical retrieval receives its ordinary selection decision rather
  than contradictory selected/rejected unit decisions.
- Other embedding providers have no new lexical prerequisite. Lexical search,
  graph predicates, corpus records, RAG invocation accounting, benchmark cases,
  contract registry, and all score thresholds remain unchanged.
- Vector encoding and its fingerprint remain unchanged: this is a fake-query
  candidate guard, not an embedding migration. Normal repository-commit/index
  currentness checks continue to apply; no stored vector rewrite is required
  beyond the normal generation workflow.

Changing hash weights, dropping repeated tokens, or globally requiring lexical
overlap was not selected: those approaches would unnecessarily change ranking
or constrain real semantic providers. The chosen check is deliberately a fake
provider limitation, not a semantic-relevance guarantee. Shared domain terms,
English-only function-word handling, and finite candidate budgets remain
limitations. Real-provider quality has not been measured by this remediation.

## Regression and verification boundary

The local regression failed before the fix with the same two invocation gates
as hosted CI. It uses current governed RAG cases, actual corpus claim units,
exact fake-vector dot products, and a limited all-token lexical fixture. It
does not emulate PostgreSQL full-text ranking or claim pgvector runtime proof.
Additional synthetic tests cover hash collisions, repeated function words,
whole IDs, short technical tokens, case, Unicode, empty input, graph seed
exclusion, lexical survival, and providers without the fake-only restriction.

The PostgreSQL integration suite now also executes the governed RAG evaluation
and checks model invocation per case, reporting the case ID on failure. The
existing standalone CI evaluations remain in place. Coverage includes the new
guard; the committed retrieval mutation configuration includes the guard and
the complete query module to avoid line-range drift excluding changed logic.

Local validation results and hosted evidence are recorded separately. The
original failed run is not evidence for the fix, and a local fixture pass is
not a replacement for a fresh exact-change retrieval-integration run. No source,
claim, guide lifecycle, or human-approval authority changes in this remediation.

## Local results and handoff

Final local checks on 2026-09-10, in the existing workspace:

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed; existing esbuild build-script warning retained without changing approval policy |
| `pnpm validate` and `pnpm format:check` | Passed; repository validation has 0 errors and 0 warnings |
| `pnpm test` and `pnpm test:coverage` | 609 passed, 5 PostgreSQL tests skipped locally |
| Coverage | Statements 93.30%, branches 84.77%, functions 96.80%, lines 95.47%; new guard 100% in all four metrics |
| Current-corpus RAG fixture | All 23 governed cases meet the evaluation gates; invocation accuracy 1; approximate lexical fixture, not PostgreSQL evidence |
| Focused mutation | 92.45%: 49 killed, 4 survived, 0 timed out, 0 uncovered; new guard 7/7 killed under the existing enabled mutation operators |
| Graph, retrieval artifacts, integrity reports | 13/13, 2/2, and 13/13 current respectively |
| `git diff --check` | Passed |

Focused mutation command:

```powershell
pnpm exec stryker run stryker.retrieval.config.json --mutate 'src/retrieval-query.ts:116-207,src/fake-embedding-relevance.ts'
```

This result is scoped to `RetrievalEngine` and the new guard, not the whole
retrieval mutation suite. The broader local mutation run was stopped before
completion because of runtime cost; no completed full-suite score is claimed.
The four focused survivors concern the existing graph-expansion depth/enabled
checks, not the new token-overlap filter. The full committed CI mutation gate
remains enabled with unchanged thresholds and expanded query-module coverage.

No local PostgreSQL/pgvector success or clean-checkout hosted success is claimed
for the fix. Commit and submit the fix through the normal PR workflow, then
verify the new SHA's Linux, Windows, mutation, and retrieval-integration jobs
before merging. Keep wider authoring/runtime work paused until that evidence
is available. This handoff does not create a commit, push, PR, or merge.
