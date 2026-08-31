# Final Independent M6 V3 Re-Audit — M6-AUD-004 Exit Decision

## Final decision

**M6 NOT READY**

Focused remediation V3 closes the original benchmark-category exploit. The
committed loader rejects the RAG-018 relabel/no-answer relaxation, missing or
drifting contracts, every exact bound-obligation change, coordinated
adversarial-to-no-answer redefinition, newly unregistered safety cases, and
post-load mutation before any provider callback can run.

M6-AUD-004 is nevertheless **replaced by a newly identified finding**,
M6-AUD-009. The exported evaluator treats the caller-controlled
`contract_registry_version: 1` property as proof of governed provenance. A
programmatically constructed benchmark with version `999`, status
`synthetic-programmatic`, and 15 synthetic ordinary questions passed all gates
and received the same `contract-registry-validated` evidence class as the
schema-registered committed corpus. This Medium finding makes the reusable
evaluation evidence boundary forgeable and blocks M7 entry.

## Audit identity and provenance

| Item | Verified value |
| --- | --- |
| Repository root | `D:/Ansha/architecture-description/architecture-knowledge` |
| Required branch | `main` |
| Remote | `https://github.com/anshacerbia2/architecture-knowledge.git` |
| Required and audited SHA | `827afde7f135387b1f10dc7faef3d4ec7eaea9fd` |
| Local `HEAD` | Exact match |
| Local `origin/main` | Exact match |
| Live `refs/heads/main` | Exact match through `git ls-remote` |
| Commit | `Merge pull request #3 from anshacerbia2/m6-focused-remediation-v3` |
| Parents | `e277ddf53081ede8fe14b2f1b7ac6566c9657d93`, `8379254fe14f0f40cf01b496fa46a24dd1e74845` |
| Initial worktree | Clean: `## main...origin/main` |
| Audit dates | 2026-08-30 through 2026-08-31, Asia/Jakarta |

There was no provenance mismatch, so the substantive audit proceeded. The
worktree remained clean until this report was created. No implementation,
schema, evaluation artifact, governed knowledge, ontology, claim,
relationship, source, lifecycle record, or M7 behavior was modified.

## Scope and method

This was an independent audit-only review of the immutable merge SHA. The
review covered all documents, evaluation artifacts, schemas, evaluator tests,
provider/engine/context/request/output boundaries, workflow and package files
required by the brief. Earlier implementation and audit reports were treated
as claims and compared against the merge diff, current source, direct command
results, isolated temporary-copy attacks, and exact-SHA hosted logs.

The V3 implementation delta is confined to documentation and roadmap wording,
the draft RAG evaluation artifacts and schema registration, evaluator binding
logic, evaluator/schema tests, and deterministic integrity outputs. No
provider, engine, context, request, output-contract, citation-authority,
governed knowledge, or lifecycle implementation changed from the independently
audited V2 SHA.

The provider blob is byte-identical to the prior audited SHA. A source search
found no benchmark case ID, hostile question literal, expected claim ID, or
benchmark-specific refusal classifier in the provider, engine, context,
request, or output-contract implementation.

## Exact-SHA hosted workflow evidence

The immutable hosted workflow is [GitHub Actions run 33209916015](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/33209916015),
displayed as run `#29`. GitHub API metadata records attempt 1, event `push`,
branch `main`, head SHA
`827afde7f135387b1f10dc7faef3d4ec7eaea9fd`, status `completed`, and conclusion
`success`. It started at 2026-08-28T20:50:02Z and completed at
2026-08-28T21:14:48Z. Every raw checkout log resolves the same required SHA.

| Required job | Job ID | Conclusion | Raw-log evidence inspected |
| --- | ---: | --- | --- |
| `validate (ubuntu-latest)` | 98980335178 | success | Exact checkout, locked install, format, full validation, graph/retrieval currentness, 432-test suite, coverage, and integrity currentness. |
| `validate (windows-latest)` | 98980335413 | success | Same cross-platform boundary and exact checkout. |
| `retrieval-integration` | 98980335392 | success | pgvector service, migration, indexing, currentness, active PostgreSQL tests, retrieval/RAG evaluations, benchmark, retrieval query, and governed answer smoke. |
| `mutation` | 98980335482 | success | Full, graph, retrieval, and focused RAG mutation stages all executed and passed threshold. |

The retrieval job pulled and started
`pgvector/pgvector:0.8.2-pg16-bookworm`, waited for a healthy PostgreSQL 16
service, applied one migration, and indexed 487 units. Indexing and currentness
both recorded generation `rg:sha256:3ab837620db55390dc225ca48` and the exact
audited repository commit. Two active PostgreSQL test files ran 15 tests, all
passing. Retrieval benchmark version 1 ran 46 cases and passed.

The hosted RAG evaluation loaded benchmark version 3 with 23 cases. It reported
15 development and 8 holdout cases, the
`contract-registry-validated deterministic-provider` evidence class, no gate
failures, perfect status/invocation/citation/epistemic/claim metrics, and zero
forbidden claims, unsupported statements, or prohibited output. The governed
answer smoke invoked the model and carried the same retrieval generation.

Hosted mutation evidence was:

| Scope | Total score | Covered score | Result |
| --- | ---: | ---: | --- |
| Full | 72.68% | 75.10% | Passed 60% break threshold |
| Graph | 83.11% | 85.10% | Passed 60% break threshold |
| Retrieval | 79.68% | 81.85% | Passed 60% break threshold |
| RAG | 75.17% | 76.20% | Passed 60% break threshold |

The focused RAG job killed 889 mutants, timed out 1, left 278 survivors and 16
without coverage, and reported 0 errors. `rag-evaluation.ts` scored 71.02% with
299 killed and 122 survivors. All four jobs emitted one final Node.js 20 action
runtime annotation; the named actions were forced onto Node.js 24 and all
required steps still executed successfully.

## Local commands and results

All repository package operations used pnpm. Initial restricted executions of
several tsx commands encountered environment-level `spawn EPERM`; each required
command was rerun with process-spawn permission and its substantive result is
reported below.

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current. Existing ignored `esbuild` build-script warning recorded. |
| `pnpm format:check` | Passed. |
| `pnpm validate` | Passed: 0 errors, 0 warnings. |
| `pnpm validate:schema` | Passed: 0 errors, 0 warnings. |
| `pnpm validate:markdown` | Passed: 0 errors, 0 warnings. |
| `pnpm validate:links` | Passed: 0 errors, 0 warnings. |
| `pnpm graph:check` | Passed: 12/12 current. |
| `pnpm retrieval:units:check` | Passed: 2/2 current. |
| `pnpm report:integrity` after report creation | Passed: regenerated 12 deterministic integrity reports; the only tracked artifact change is the Markdown/link inventory for this report. |
| `pnpm report:check` before and after report regeneration | Passed: 12/12 current on both runs. |
| `pnpm test` | Passed: 33 files passed, 1 PostgreSQL-conditional file skipped; 432 tests passed and 4 PostgreSQL-conditional tests skipped. |
| `pnpm test:coverage` | Passed: 92.04% statements, 82.55% branches, 95.59% functions, 94.67% lines. `rag-evaluation.ts` reached 89.77% statements and 85.71% branches. |
| `pnpm test:mutation:rag` | Passed: 75.17% total / 76.20% covered; 889 killed, 1 timeout, 278 survived, 16 no coverage, 0 errors. |
| `pnpm retrieval:evaluate` | Locally unavailable: `ECONNREFUSED 127.0.0.1:54329`. |
| `pnpm rag:evaluate` | Locally unavailable for the same PostgreSQL connection reason. |
| Independent temporary-copy TSX probes | The category/contract attacks failed closed; the programmatic evidence-class spoof and coordinated policy-edit residual were reproduced. |

The four local database-dependent tests and both local evaluations are not
represented as passes. Their active execution evidence comes from the verified
exact-SHA hosted job.

## Structural and schema assessment

The committed artifacts satisfy the requested structural inventory:

- `evaluation/rag-golden.yaml` remains version 3, status `draft`, with exactly
  23 cases;
- `evaluation/rag-case-contracts.yaml` is version 1, status `draft`, with
  exactly 8 contracts;
- the registry contains exactly 2 `natural-no-answer` and 6
  `adversarial-safety` contracts;
- each contract's stable ID, kind, question fingerprint, category, acceptable
  statuses, invocation rule, expected/forbidden claims, epistemic types,
  prohibited terms, and holdout value matches its benchmark case one-to-one;
- schema registry version 3 registers both RAG evaluation artifacts;
- the evaluation schema uses `additionalProperties: false` at benchmark,
  benchmark-case, contract-registry, and contract levels and rejects unknown
  governed properties; and
- the contract and benchmark artifacts remain draft evaluation infrastructure,
  not reviewed or canonical architecture knowledge.

The `filters` value is intentionally typed as an open object by the evaluation
JSON Schema. Unsupported retrieval filter fields are rejected later by
`parseRagRequest` before provider invocation. Thus object shells and governed
obligations are schema-closed, while retrieval-filter vocabulary is enforced at
runtime rather than by this JSON Schema.

Generated graph, retrieval, schema-coverage, Markdown-link, and integrity
artifacts were current before report creation. The V3 diff changes no governed
knowledge or lifecycle event and keeps M7 `future` and explicitly closed.

## Independent adversarial probes

All artifact mutations were made under a uniquely created operating-system
temporary directory. The committed files were never modified, and the probe
script and copies were removed after execution.

### Original M6-AUD-004 exploit

RAG-018 was relabeled from `adversarial` to `security`, restricted to
`insufficient-evidence`, changed to non-invoked, and stripped of expected claim
and epistemic requirements while preserving the hostile question. Loading
failed with `RAG_EVALUATION_CONTRACT category mismatch RAG-018`. Provider
callback count was zero.

Result: the original exploit is closed.

### Registry topology, identity, and fingerprint attacks

| Probe | Result before provider invocation |
| --- | --- |
| Remove RAG-018 contract | Rejected: expected exactly 8 governed contracts. |
| Rename governed case ID | Rejected: contract RAG-018 became orphaned. |
| Duplicate a contract | Rejected: duplicate case ID. |
| Remove RAG-018 benchmark case while retaining contract | Rejected: orphaned contract. |
| Add text to governed hostile question without changing fingerprint | Rejected: question fingerprint mismatch. |
| Remove RAG-018 prohibited terms | Rejected: prohibited-output mismatch. |

### Exact bound-obligation attacks

Each RAG-018 benchmark obligation was changed separately while its contract
remained authoritative. Category, acceptable statuses, model invocation,
expected claims, forbidden claims, expected epistemic types, prohibited output
terms, and holdout assignment each failed with its specific contract-mismatch
diagnostic. Every provider callback count remained zero.

Category metadata therefore cannot disable the existing safety contract. It
also cannot create or satisfy one: a new RAG-024 case was tested separately as
adversarial, no-answer, insufficient-evidence, non-invoked, and
prohibited-output-bearing. Each variant failed as an unregistered governed case
before provider invocation.

### Coordinated benchmark/registry attacks

Changing both RAG-018 records into `natural-no-answer` while retaining the
stable ID failed with `kind mismatch RAG-018`. The hard-coded stable
ID-to-contract-kind policy therefore prevents coordinated conversion of the
required adversarial case into a natural no-answer case.

Coordinated changes that preserve `adversarial-safety` can still load without a
registry version increase. An independent probe changed expected claims,
forbidden claims, prohibited terms, and holdout in both files while leaving
benchmark version 3 and contract registry version 1; loading succeeded. This
does not silently trust benchmark category metadata because the registry must
also change, making the edit visible in source control. It does mean the
documentation's “evaluation-policy migration” classification is a governance
rule, not an enforced version-bump or migration-record invariant. This remains
a review-governance residual risk.

### Post-load mutation and contract removal

After loading the committed corpus, changing RAG-018's acceptable statuses was
rejected at evaluation entry with zero provider calls. Deleting its attached
contract was likewise rejected because only seven contracts remained. Bound
obligations are therefore rechecked before evaluation, not only at YAML load.

### Programmatic fixture and evidence-class provenance

A normal two-case programmatic fixture produced the explicit evidence class
`synthetic ungoverned evaluator fixture; not benchmark or semantic-quality
evidence`, as documented.

The negative provenance probe then constructed a new in-memory object from the
public evaluator shape, retained the eight valid embedded safety contracts, set
`contract_registry_version: 1`, changed benchmark version to `999`, changed
status to `synthetic-programmatic`, and replaced the 15 ordinary questions with
synthetic questions. `evaluateRag` did not require the registered loader or
revalidate version/status. All metrics passed and the report stated:

`contract-registry-validated deterministic-provider functional and
adversarial-outcome RAG benchmark ...`

The defect occurs because `RagBenchmark.contract_registry_version` is an
exported optional data property and `evaluateRag` equates the value `1` with
governed provenance. Rechecking embedded contract contents does not establish
that the benchmark came from the schema-registered repository artifacts. The
required claim that a synthetic programmatic fixture cannot be represented as
contract-registry-validated evidence is therefore false at the audited SHA.

## Finding dispositions

| Finding | Severity now | Final disposition | Independent basis |
| --- | --- | --- | --- |
| M6-AUD-001 — raw citation versus final resolved-citation grounding | — | **closed** | No V3 regression. Governed source admission, record authorization, canonical metadata, and final-catalog grounding remain enforced. |
| M6-AUD-002 — complete prompt-visible context fingerprint integrity | — | **closed** | No V3 change or contradictory evidence; prompt-visible evidence and request/provenance controls remain bound. |
| M6-AUD-003 — reusable engine and external-provider classification enforcement | — | **closed** | No regression. Engine/provider classification checks still prevent denied data reaching fetch. |
| M6-AUD-004 — evaluation credibility and resistance to benchmark-category gaming | Medium | **replaced by a newly identified finding** | The exact category exploit and all contract/category drift probes now fail before invocation. M6-AUD-009 supersedes it at the reusable evaluation-evidence boundary. |
| M6-AUD-005 — model identifier reproducibility boundary | Observation | **accepted bounded risk** | `gpt-5.6-sol` remains a concrete routing ID, not an immutable dated snapshot; the limitation is documented. |
| M6-AUD-006 — application output bounds and mutation assurance | — | **closed** | No regression; full tests, coverage, and local/exact-SHA hosted focused mutation pass. |
| M6-AUD-007 — structural grounding versus semantic entailment limitation | Observation | **accepted bounded risk** | Documentation still accurately states that structural support does not prove textual entailment or real-provider quality. |
| M6-AUD-008 — GitHub Actions runtime-maintenance annotations | Observation | **deferred non-blocker** | Four job-level Node.js 20 annotations remain; forced Node.js 24 execution passed every required step. |
| M6-AUD-009 — forgeable contract-registry evidence classification | Medium | **remains open** | A caller-controlled in-memory flag and copied contracts can label a synthetic, invalid-version/status benchmark as contract-registry-validated evidence while every gate passes. |

## Finding counts

Counts exclude closed findings and the superseded M6-AUD-004 record.

| Critical | High | Medium | Low | Observation |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 1 | 0 | 3 |

M6-AUD-009 is the blocking Medium. The observations are M6-AUD-005,
M6-AUD-007, and M6-AUD-008.

## Residual risks

- Contract-registry evidence provenance can be asserted by a programmatic
  caller without proof that the registered loader produced the benchmark.
- Coordinated obligation changes are visible because the separate contract
  registry must change, but exact policy edits do not require a registry
  version increment or migration record at runtime.
- The evaluation schema delegates the internal retrieval-filter vocabulary to
  runtime request parsing rather than closing that nested object itself.
- The deterministic provider and public committed holdout remain functional
  regression evidence, not real-provider prompt-injection, semantic quality,
  calibration, cost, or latency evidence.
- Structural grounding does not prove semantic entailment.
- The concrete model routing ID is not an immutable model snapshot.
- Local PostgreSQL/pgvector execution was unavailable; database evidence is
  tied to the verified exact-SHA hosted job.
- Four GitHub action-runtime maintenance annotations remain.

No live or paid external model was invoked during this audit.

## Files changed by this audit

- `docs/m6-final-independent-reaudit-v3-report.md` — this independent report;
- `generated/integrity/markdown-link-integrity.json` — deterministically
  regenerated only to account for the added Markdown file.

No other tracked file is authorized or expected to change.

## M7 entry decision

**M6 NOT READY**

The original M6-AUD-004 category bypass is closed, but M6-AUD-009 is a new
blocking Medium at the reusable evaluation-evidence boundary. M7 must not
begin. A later `M6 READY` result would still require an explicit human M7 entry
decision; this audit grants no such authority.
