# M5 Focused Audit Evidence Closure

## Purpose and authority boundary

This document supplies implementation-side evidence for the three environment
gaps in `docs/m5-independent-audit-report.md`. It is not an independent re-audit,
does not rewrite the historical audit verdict, and does not declare M6 ready.
Only a fresh auditor may close the findings and issue the next entry decision.

The preserved independent report has SHA-256
`dfb83af44b400797d3f18225db3031a191e4532ae82f4aa459970233438e862d`
and first appears in commit
`d2a9a574abd3f36cc1a3db7abfa3ecbf2aa84bc6` without changes to its
`M5 AUDIT INCONCLUSIVE` verdict.

## Evidence acquisition

GitHub Actions metadata and all four completed job logs were downloaded through
the authenticated GitHub REST API. The credential came from the existing Git
credential provider, remained in process memory, was cleared after each call,
and was not printed or written into the export.

The raw responses, logs, security boundary, and SHA-256 manifest are preserved
under [run-31367937331](evidence/m5/run-31367937331/README.md).

Authenticated metadata reports:

| Field | Observed value |
|---|---|
| Run | `31367937331` |
| Workflow | `Validate knowledge kernel` |
| Event | `push` |
| Attempt | `1` |
| Head SHA | `6ce4f701dea01aa85439651f6d9929f8597afe69` |
| Status | `completed` |
| Conclusion | `success` |
| Jobs | four completed, four `success` |

The independently audited SHA
`95733338228f0b0a49634df07430ffca655465e0` differs from the hosted executable
SHA only through `docs/m5-implementation-report.md`. The audit itself verified
that no executable file changed across that boundary.

## One-to-one evidence disposition

These are closure candidates for independent review, not self-issued finding
closures.

### M5-AUD-001: PostgreSQL/pgvector runtime evidence

Proposed disposition: `evidence supplied; independent closure pending`.

Job `93390313632` completed successfully using the workflow's pinned
`pgvector/pgvector:0.8.2-pg16-bookworm` PostgreSQL service. Its raw log records:

- migration, deterministic index build, and currentness check success;
- 487 requested and stored fake-provider embeddings at 1536 dimensions;
- 15 passing PostgreSQL retrieval tests across two test files;
- preservation of the active generation when malformed embeddings fail;
- 46 evaluation cases with no gate failures;
- citation and source-locator completeness of `1.0` in every mode;
- no-answer accuracy of `1.0`, prohibited-result count `0`, and excluded-edge
  leakage `0` in every mode;
- hybrid Recall@5 `0.9565217391304348`, MRR@10 `0.8405797101449276`, and
  nDCG@10 `0.9232813191878061`;
- 20-run warmed PostgreSQL and end-to-end performance observations; and
- a successful hybrid-graph smoke query.

The performance output explicitly identifies the embedding provider as
`deterministic-fake`, excludes external-provider latency, and classifies the
measurements as informational host performance.

### M5-AUD-002: exact-SHA hosted provenance

Proposed disposition: `evidence supplied; independent closure pending`.

The authenticated REST export records run `31367937331` as completed with
conclusion `success` at exact SHA
`6ce4f701dea01aa85439651f6d9929f8597afe69`. Its four job records are:

| Job | Job ID | Conclusion |
|---|---:|---|
| PostgreSQL/pgvector retrieval integration | `93390313632` | `success` |
| Windows validation | `93390313646` | `success` |
| Ubuntu validation | `93390313716` | `success` |
| Mutation | `93390313723` | `success` |

Both platform validation logs report formatting success, zero validation errors
or warnings, graph artifacts `12/12` current, retrieval artifacts `2/2`
current, 306 passing tests with four database tests skipped in those non-DB
jobs, passing coverage, and integrity reports `12/12` current. The dedicated
database job supplies the PostgreSQL test evidence omitted by the platform jobs.

### M5-AUD-003: mutation completion

Proposed disposition: `evidence supplied; independent closure pending`.

Job `93390313723` ran the three committed mutation commands sequentially and
completed successfully:

| Boundary | Score | Break threshold | Duration |
|---|---:|---:|---:|
| Legacy validation | 90.78% | 60% | 37m 02s |
| Focused graph | 83.11% | 60% | 17m 12s |
| Focused retrieval | 79.68% | 60% | 5m 39s |

The audit's ten-minute local timeouts are therefore consistent with the
observed hosted durations and do not establish mutation failure.

## What remains unresolved

- A fresh auditor must authenticate to GitHub and compare the exported evidence
  with the source run, or explicitly state why the versioned export is
  sufficient.
- The deterministic fake-provider evaluation remains functional retrieval
  evidence, not real OpenAI semantic-quality evidence.
- Exact-vector scaling beyond the current 487-unit corpus remains a future
  measurement concern.

No implementation defect was changed during this evidence-closure run. The
historical verdict remains `M5 AUDIT INCONCLUSIVE` until an independent focused
re-audit issues a replacement decision.

## Focused re-audit handoff

The next auditor should review only `M5-AUD-001` through `M5-AUD-003` and their
effect on the M6 entry matrix. At minimum, the auditor should:

1. verify that the historical audit report still hashes to the value recorded
   above;
2. recompute every digest in `SHA256SUMS`;
3. compare the run SHA, attempt, conclusion, job IDs, step conclusions, and raw
   log hashes against an authenticated GitHub API download;
4. confirm that the hosted workflow at the tested SHA used the committed pinned
   PostgreSQL/pgvector service and pnpm commands;
5. independently extract the database-test count, evaluation gates and metrics,
   and all three mutation scores from the raw logs;
6. assign an explicit `closed`, `accepted`, or `open` disposition to each audit
   finding; and
7. issue either `M6 READY` or `M5 AUDIT INCONCLUSIVE` in a new focused re-audit
   report without editing the original audit.
