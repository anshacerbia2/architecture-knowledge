# M7.2 Focused Closure Confirmation

Date: 2026-09-12 (Asia/Jakarta).
Assessed SHA: `0f9e6c219cbb7d42f14f31cfe4cb9d48bb3d52c6`.
Implementation SHA: `ee674b3195fa124afd84f13843b31f968a67d7bf`.
Status: proposed technical confirmation; no human content approval.

## Decision and scope

**M7.2-AUD-001 and M7.2-AUD-002 are closed within the bounded pilot scope.**
No unresolved Critical, High, Medium or Low findings remain from the
[seven-finding corpus audit](m7-2-corpus-audit-report.md); five observations remain.
Technical acceptance of the M7.2 pilot is recommended to the owner. This is not
owner approval of M7.2 completion, approval of guide content, completion of all
M7 work, or authorization to start an assistant runtime or enlarge the corpus.

The owner authorized this focused confirmation after post-merge CI passed.
Work was limited to the two output-coverage findings, their regression and CLI
paths, implementation inspection, and exact-SHA hosted evidence. This is a
same-agent confirmation using the committed synthetic fixtures, not a fresh
independent audit or an independent assessment of source fidelity. The earlier
audit and remediation reports remain unchanged as historical records.

## One-to-one dispositions

| Finding | Disposition | Basis and remaining boundary |
| --- | --- | --- |
| M7.2-AUD-001 | Closed, bounded pilot | v4 separates inapplicability from exclusion. Standalone Retry, standalone Breaker, each inquiry lens, both and neither pass their intended result paths. Active, unknown, missing or unconfirmed rules cannot justify an inapplicable classification. Rejection still needs active exclusion support. |
| M7.2-AUD-002 | Closed, bounded pilot | Every evidence-bearing output statement has explicit viable `option_ids`. Retry-local evidence works in a two-option result; expanding that target to Breaker fails applicability. Shared evidence may target both. Trade-off and verification coverage cannot silently omit a viable option. |
| M7.2-AUD-003 | Retained observation | Pilot matrices are structurally complete but thin comparative evidence. Do not generalize them into comprehensive architecture evaluations. |
| M7.2-AUD-004 | Retained observation | Opaque guide lookup and the single project-scope constraint binding remain bounded modeling choices; no new human-key or multiple-constraint capability was added. |
| M7.2-AUD-005 | Retained observation | Free-text entailment and human-confirmation authentication are not implemented. Validation of supplied confirmation metadata is not authentication or human approval. |
| M7.2-AUD-006 | Retained observation, evidence updated | Exact-merge full mutation and database-backed CI are now verified. Real-provider quality and guide-specific search-quality evidence remain absent; surviving/uncovered mutants and timeouts in other suites remain limitations. |
| M7.2-AUD-007 | Retained observation | Same-agent review and living-source historical-byte uncertainty remain. This confirmation does not claim organizational or reviewer independence. |

## Focused checks

Inspected the [recommendation schema](../schemas/decision-recommendation.schema.json),
[semantic validator](../src/decision-recommendation-validator.ts),
[scenario builder](../tests/m7-2-output-helpers.ts), and
[regression cases](../tests/m7-2-output-coverage.test.ts).

For AUD-001, the validator independently reconstructs all inactive option and
selection/exclusion bindings. A false condition cannot hide an unknown conjunct.
Evaluation evidence retains exact claims, sources, snapshots and uncertainty;
it does not assert that the false rule currently applies. Claims also used for
an affirmative assertion, including shared transitive parents, still need their
conditions satisfied. Tests reject invented rejection, omitted/overlapping
options, missing basis entries, forged snapshots and lost uncertainty. A
synthetic three-option case verifies that another option's active exclusion does
not contaminate the inactive option's assessment.

For AUD-002, tests cover all four statement families: trade-offs, risks,
verification and evolution triggers. Single-option evidence is accepted only
for its declared applicable targets. Empty, duplicate, malformed, outside-guide
and inactive targets fail. Additional evidence in constraint/rejection statements
does not bypass the assertion-condition checks. Neither fix weakens source
admission, condition identity, epistemic snapshots or human authority boundaries.

The schema migration is recommendation v3 to v4 and registry v6 to v7; session
v3, guide schema v4, guide record versions and draft contracts are unchanged.
The [migration report](m7-2-output-coverage-remediation.md) records producer duties.
The fixtures' truth assignments are synthetic test premises, not verified facts
about a real project. No new source or semantic-quality claim follows from them.

## Exact-SHA hosted evidence

[PR #14](https://github.com/anshacerbia2/architecture-knowledge/pull/14) is merged.
The implementation commit is an ancestor of the assessed merge commit, and
`git diff` between their trees is empty. Local `main` and remote `main` matched
the assessed SHA at confirmation start; the tracked worktree was clean.

[Post-merge run #51](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106)
is a successful `push` run on `main` at that exact merge SHA. Metadata, all four
jobs' step conclusions, and raw job logs were fetched. Each log identifies the
same checkout SHA and execution of `pnpm install --frozen-lockfile`.

| Hosted job | Evidence verified in raw log |
| --- | --- |
| [Linux validation](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106/job/103541475232) | 651 tests passed, 5 database tests skipped in this non-DB job; full coverage gates passed at 93.35% statements; full validation clean and integrity 13/13 current. |
| [Windows validation](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106/job/103541475136) | Same 651 passed and 5 skipped; coverage 93.35% statements; full validation clean and integrity 13/13 current. |
| [Retrieval integration](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106/job/103541475264) | PostgreSQL/pgvector migration, indexing and currentness passed; 16 database/query tests passed. Retrieval and RAG evaluation gates passed, as did benchmark and smoke steps. Providers were explicitly fake, not real-provider quality evidence. |
| [Mutation](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106/job/103541475176) | All six configured target groups passed. Full recommendation-validator score was 89.11%: 401 killed, 47 survived, 2 no-coverage, 0 timeout, 0 error. This supersedes the local incomplete full-run evidence gap, not its historical record. |

Other hosted mutation scores were kernel 78.74%, graph 83.41%, retrieval 70.49%,
RAG 76.41%, and decision-guide validator 80.00%. Their respective timeout counts
were 107, 2, 7, 1 and 0. Passing scores do not mean every mutant was killed;
the standard score includes detected timeouts. No thresholds or exclusions were
changed for this confirmation. Raw hosted logs were read, not archived into the
repository; future access remains subject to GitHub retention and permissions.

## Local validation and artifact boundary

On the assessed implementation, reran:

```powershell
pnpm exec vitest run tests/m7-2-output-coverage.test.ts tests/m7-2-pilot.test.ts tests/decision-validation-cli.test.ts --maxWorkers=2
pnpm validate
pnpm graph:check
pnpm retrieval:units:check
pnpm report:check
pnpm format:check
```

Results: 65/65 focused tests passed (41 remediation, 20 pilot, 4 CLI), full
validation had zero errors/warnings, graph 13/13 and retrieval 2/2 current,
integrity 13/13 current, formatting passed. Full local coverage, full mutation,
database evaluation and installation were not redundantly rerun in this
confirmation; exact-SHA clean hosted results above cover those evidence needs.
After writing this report and its reading-order entry, deterministic integrity
reports were regenerated, then Markdown/link/full validation, integrity
currentness and diff checks passed.

Only this report, `docs/README.md`, and the generated Markdown integrity inventory
change in this run. No implementation, tests, governed content, lifecycle,
benchmark, threshold, branch, commit, push, PR or merge operation was performed.
The previously merged branch cleanup was already complete before this run.

Next is owner acceptance of M7.2 completion and a separately bounded next-scope
decision. There is no remaining reason from these two findings to repeat the
whole-project audit. Runtime, model integration, artifact generation and broader
corpus work remain unstarted and require their own authorization.
