# M5 Focused Evidence Re-Audit Report

## Scope

Audited repository `HEAD`:
`f77e089a324f6ef9d858f68f436fa5820479e1d3`.

Reviewed only:

- `M5-AUD-001`
- `M5-AUD-002`
- `M5-AUD-003`
- their effect on the M6 entry decision

Inputs:

- `docs/m5-independent-audit-report.md`
- `docs/m5-focused-evidence-closure.md`
- `docs/evidence/m5/run-31367937331/`

No historical audit file was modified. No implementation remediation was
performed. M6 was not started.

## Verification Summary

The preserved independent audit report hashes to:

`dfb83af44b400797d3f18225db3031a191e4532ae82f4aa459970233438e862d`

That matches the value recorded in the focused evidence closure.

Every entry in `docs/evidence/m5/run-31367937331/SHA256SUMS` was recomputed and
matched:

| File | SHA-256 |
|---|---|
| `job-93390313632.log` | `93859d3abc7a5d39cfde51a4769b2e3172fbdf5f8ed56dd13471b7d35a7264b3` |
| `job-93390313646.log` | `214cb62996b58e18ec5580a386a112200113cefd3bfb0cddc0053f66421f8dde` |
| `job-93390313716.log` | `ecf206a6a93a19016c94bab12a0678ebdb5725804eed506eeab0d2e80c82886f` |
| `job-93390313723.log` | `125bfe46ae91af9b5c2e4eaec0bcc1008008d91179461f069b8203647d40e438` |
| `jobs.json` | `5f8bb1ab578acd306422d2fb22abe71966b80f28eefea3a64f1d6797a6fa1e67` |
| `run.json` | `e4f3c796a7f08e5627a4291e9a75ac75fef2307cd8c3ef1560cfb4a276846f34` |

Authenticated GitHub REST metadata for run `31367937331` was independently
retrieved through the existing Git credential provider without printing or
persisting the credential. It matched the exported metadata on the material
fields:

| Field | Authenticated value |
|---|---|
| Run | `31367937331` |
| Head SHA | `6ce4f701dea01aa85439651f6d9929f8597afe69` |
| Attempt | `1` |
| Status | `completed` |
| Conclusion | `success` |
| Job count | `4` |

Authenticated job metadata matched the four exported jobs:

| Job ID | Job | Conclusion |
|---:|---|---|
| `93390313632` | `retrieval-integration` | `success` |
| `93390313646` | `validate (windows-latest)` | `success` |
| `93390313716` | `validate (ubuntu-latest)` | `success` |
| `93390313723` | `mutation` | `success` |

Fresh authenticated log download through the GitHub per-job log redirect was
attempted from this workstation, but the PowerShell redirect path did not yield
a stable byte stream for hashing. This re-audit therefore treats the log content
as a hash-verified versioned export that is cross-checked against authenticated
run and job metadata, not as freshly byte-for-byte re-downloaded log evidence.
That limitation is explicit and bounded below.

The hosted executable SHA differs from audited `HEAD` by documentation,
generated integrity reporting, and evidence/reporting files. No implementation
remediation was performed during this re-audit.

## M5-AUD-001 Disposition

Finding: Required PostgreSQL/pgvector runtime evidence was not locally
reproducible in the historical audit.

Disposition: `closed`.

Basis:

- Authenticated GitHub metadata verifies that job `93390313632`
  (`retrieval-integration`) completed successfully for run `31367937331` at
  executable SHA `6ce4f701dea01aa85439651f6d9929f8597afe69`.
- The hash-verified exported log for job `93390313632` records use of
  `pgvector/pgvector:0.8.2-pg16-bookworm`.
- The same log records `pnpm retrieval:index`, PostgreSQL retrieval tests,
  `pnpm retrieval:evaluate`, `pnpm retrieval:benchmark`, and a hybrid-graph
  smoke query.
- The PostgreSQL test section reports `2 passed` test files and `15 passed`
  tests, including `tests/retrieval-database.integration.test.ts`.
- The evaluation output records `case_count: 46`, `citation_completeness: 1`,
  `source_locator_completeness: 1`, `excluded_edge_leakage: 0`,
  `prohibited_result_count: 0`, and `no_answer_accuracy: 1`.
- Hybrid metrics in the exported log match the closure claims:
  Recall@5 `0.9565217391304348`, MRR@10 `0.8405797101449276`, and nDCG@10
  `0.9232813191878061`.
- The benchmark evidence explicitly identifies the embedding provider as
  `deterministic-fake`; it is functional PostgreSQL retrieval evidence, not
  real-provider semantic-quality evidence.

Effect on M6 entry: this finding no longer blocks M6. The residual limitation
about real OpenAI semantic quality is accepted as outside the original
M5-AUD-001 runtime-evidence gap.

## M5-AUD-002 Disposition

Finding: Hosted exact-SHA evidence was not independently accessible in the
historical audit.

Disposition: `accepted`.

Basis:

- Authenticated GitHub REST metadata is now accessible and verifies run
  `31367937331`, attempt `1`, head SHA
  `6ce4f701dea01aa85439651f6d9929f8597afe69`, completed status, successful
  conclusion, and the expected four successful jobs.
- The exported `run.json` and `jobs.json` hash entries match the committed
  `SHA256SUMS` manifest.
- The exported raw job logs hash entries also match the committed manifest.
- The authenticated log redirect endpoint could not be made to produce stable
  fresh log bytes for independent hash comparison in this PowerShell
  environment. Because authenticated run and job metadata matched, the raw logs
  are versioned in the repository, every exported digest verifies, and the log
  contents internally match the successful job identities and commands, this
  remaining byte-for-byte log re-download gap is accepted as non-blocking for
  the focused M6 entry decision.

Effect on M6 entry: this finding does not block M6. The exact hosted run,
attempt, executable SHA, job IDs, and conclusions are independently verified;
the remaining fresh-log byte comparison limitation is explicitly accepted.

## M5-AUD-003 Disposition

Finding: Local mutation evidence did not complete within the historical audit
timeout.

Disposition: `closed`.

Basis:

- Authenticated GitHub metadata verifies that job `93390313723` (`mutation`)
  completed successfully for run `31367937331`.
- The hash-verified exported mutation log records the committed mutation
  commands:
  `pnpm test:mutation`, `pnpm test:mutation:graph`, and
  `pnpm test:mutation:retrieval`.
- The log reports final mutation scores above the committed break threshold
  `60`:

| Boundary | Score |
|---|---:|
| Legacy validation | `90.78` |
| Focused graph | `83.11` |
| Focused retrieval | `79.68` |

Effect on M6 entry: this finding no longer blocks M6. The historical local
ten-minute timeout is consistent with hosted durations that exceeded ten
minutes for the legacy and graph mutation boundaries.

## M6 Entry Decision

The three focused historical blockers are closed or accepted:

| Finding | Disposition | Blocks M6 |
|---|---|---|
| `M5-AUD-001` | `closed` | No |
| `M5-AUD-002` | `accepted` | No |
| `M5-AUD-003` | `closed` | No |

This focused re-audit does not alter the historical independent audit report.
It supersedes only the focused evidence disposition for `M5-AUD-001` through
`M5-AUD-003` and their effect on the M6 entry decision.

M6 READY
