# M6 Focused Remediation V3 Report

Date: 2026-08-28

Audited baseline: `e277ddf53081ede8fe14b2f1b7ac6566c9657d93`

Audit evidence commit: `03932d797f85c50d25777e85ce4763a30ea01d36`

Branch: `m6-focused-remediation-v3`

This machine-authored report records implementation and local validation of the
remaining M6-AUD-004 benchmark-category bypass reproduced by
[`m6-final-independent-reaudit-report.md`](m6-final-independent-reaudit-report.md).
It is not an independent re-audit, human approval, lifecycle transition, M6
clearance, or permission to begin M7. No governed knowledge, claim,
relationship, source, or lifecycle record was changed.

## Scope and disposition

This run addresses only the blocking M6-AUD-004 disposition retained by the
final V2 re-audit. M6-AUD-001 remains independently closed. Previously closed,
accepted, or deferred findings were not reopened, and all M7 behavior remains
excluded.

| Finding | Remediation disposition | Implementation evidence |
|---|---|---|
| M6-AUD-004 — evaluation credibility and resistance to benchmark gaming | Implemented; requires exact-SHA hosted evidence and independent verification | The two natural no-answer and six adversarial cases are bound to `evaluation/rag-case-contracts.yaml` by stable ID and SHA-256 question fingerprint. The registry fixes each case's category, acceptable statuses, model-invocation requirement, expected and forbidden claims, expected epistemic types, prohibited output terms, and holdout assignment. Loader validation rejects missing, orphaned, duplicated, renamed, relabeled, or weakened bindings. Evaluation revalidates the binding before provider invocation and scores against bound obligations rather than the category label. |

## Architecture and migration decisions

- Benchmark category is descriptive metadata. It is not the switch that
  activates adversarial or no-answer safety behavior.
- The draft benchmark remains version 3 and retains all 23 questions. No case
  was relabeled, weakened, deleted, or added to obtain a passing result.
- A separate draft case-contract registry starts at version 1. Its eight
  required IDs and contract kinds are versioned validator policy; changing that
  set requires an explicit code and registry migration.
- Question text is bound by SHA-256 over normalized UTF-8 text. The registry
  carries exact evaluation obligations rather than hostile-phrase classifiers.
- Any case labeled `adversarial` or `no-answer`, accepting
  `insufficient-evidence`, skipping model invocation, or declaring prohibited
  output must have a registered contract.
- Registry-loaded benchmarks carry their contract-registry version and are
  validated again at evaluation entry. Direct programmatic fixtures remain
  available for unit tests but their reports are labeled synthetic and
  ungoverned rather than benchmark evidence.
- Schema registry version 3 is an additive migration that registers both RAG
  evaluation YAML files against strict JSON Schema Draft 2020-12 definitions.
  Unknown properties and invalid identifiers, enums, hashes, or cardinalities
  fail schema validation.
- Both evaluation artifacts remain `draft`. This change does not mark them
  reviewed, approved, published, or canonical.

## Regression assurance

The focused negative fixtures reproduce and extend the independent exploit:

- the exact RAG-018 relabel, `insufficient-evidence`, no-invocation, empty-claim,
  and empty-epistemic relaxation is rejected;
- governed question edits fail their fingerprint;
- prohibited-output removal and other exact obligation drift are rejected;
- contract deletion, duplication, case-ID rename, and orphaning are rejected;
- a newly labeled adversarial case without a contract is rejected;
- coordinated attempts to convert a required adversarial contract into a
  natural no-answer contract are rejected by the stable ID-to-kind policy; and
- mutation of a loaded bound case is detected before its provider callback can
  run.

The positive fixture loads the committed corpus with exactly eight bound
contracts: two `natural-no-answer` and six `adversarial-safety`.

## Local validation evidence

| Gate | Result |
|---|---|
| Focused evaluator tests | Passed: 16/16 |
| Focused schema tests | Passed: 6/6, including a negative unknown-property contract-registry fixture |
| Schema validation | Passed: 0 errors, 0 warnings |
| Repository validation before final documentation regeneration | Passed: 0 errors, 0 warnings |
| Full test suite | Passed: 432; 4 conditional local PostgreSQL tests skipped |
| Coverage | Passed: 92.04% statements, 82.55% branches, 95.59% functions, 94.67% lines; `rag-evaluation.ts` reached 89.77% statements and 85.71% branches |
| Focused RAG mutation | Passed: 72.92% total and 73.99% covered across all nine RAG modules; 858 killed, 302 survived, 17 no coverage, 1 timeout, 0 errors |
| Final evaluator-only mutation | Passed: 71.02% total and covered; 299 killed, 122 survived, 0 no coverage/timeouts/errors |

The local `pnpm rag:evaluate` probe reached the configured runtime boundary but
PostgreSQL/pgvector was unavailable at `127.0.0.1:54329` (`ECONNREFUSED`). It is
not represented as a pass. The hosted integration job must run the same command
for the final implementation SHA. No live or paid model invocation was
authorized or performed.

## Residual risks and handoff

- The contract registry makes safety-policy changes explicit and independently
  checkable, but repository reviewers must still treat changes to it as policy
  migrations rather than ordinary benchmark edits.
- Deterministic-provider results remain functional and adversarial-outcome
  evidence, not proof of real-provider semantic quality or prompt-injection
  resistance.
- The committed holdout remains public regression evidence, not a secret or
  independently administered holdout.
- Structural grounding still does not prove textual entailment.
- The concrete provider routing ID is not an immutable dated model snapshot.

M6 remains not cleared by this implementation report. Entry to M7 requires a
green exact-SHA hosted run and an independent re-audit that reproduces the prior
bypass attempt, reviews coordinated registry/benchmark changes, and explicitly
closes or accepts M6-AUD-004.
