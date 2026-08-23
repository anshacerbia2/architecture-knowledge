# M6 Focused Remediation V2 Report

Date: 2026-08-23

Audited baseline: `742f09522cbd8dae341035727af6c796528b082d`

Audit evidence commit: `75c7527`

Branch: `m6-focused-remediation-v2`

This machine-authored report records implementation and local validation of the
two blockers reproduced by
[`m6-focused-independent-reaudit-report.md`](m6-focused-independent-reaudit-report.md).
It is not an independent re-audit, human approval, lifecycle transition, M6
clearance, or permission to begin M7. No governed knowledge, claim,
relationship, source, or lifecycle record was changed.

## Scope

This run addresses only M6-AUD-001 and M6-AUD-004. Findings already closed or
accepted by the focused independent re-audit were not reopened. Decision
assistance and every M7 capability remain excluded.

## Finding dispositions

| Finding | Remediation disposition | Implementation evidence |
|---|---|---|
| M6-AUD-001 — raw citation versus final resolved-citation grounding | Implemented; requires independent verification | `RagEngine` and direct context construction now require a separate citation authority. The CLI constructs it from the current validated graph. Resolution requires an `AKS-NNNNNN` identifier, an `approved` source with a valid HTTPS registry URL, and an explicit record-to-source authorization. Final title and URL values come from that source record; retriever-supplied title and URL values are not authoritative. Blank, malformed, unregistered, non-admitted, and record-unauthorized probes cannot enter the final citation catalog or ground an assertion. |
| M6-AUD-004 — evaluation credibility and resistance to benchmark gaming | Implemented; requires independent verification | The benchmark advances to version 3 with 23 cases, including the three reproduced paraphrases as regression cases. The fake provider no longer contains an adversarial phrase/refusal regular expression and never copies question text; it only copies governed claim evidence. Its deterministic relevance check can accept one matching domain term only for a direct result that carries a retriever rank; unranked graph expansion and zero-overlap evidence remain insufficient. Adversarial cases accept a safely grounded answer or explicit refusal while model invocation, forbidden claims, prohibited outcome text, citations, and epistemic obligations remain gated. Exact-ID case classification is derived from question text and must agree with metadata. |

## Contract migrations

- RAG answer, context, and prompt contract constants advance from version 2 to
  version 3.
- The reusable `RagEngine` constructor and `buildRagContext` function require a
  `RagCitationAuthority`; callers cannot satisfy grounding with retriever
  citation metadata alone.
- The draft evaluation contract advances from version 2 `expected_status` to
  version 3 `acceptable_statuses`. Non-adversarial cases retain one exact
  acceptable status. Adversarial cases allow `answered` or `refused`, never
  `insufficient-evidence`.
- Expected claim and epistemic coverage apply to an adversarial case when it is
  answered. Explicit refusal remains subject to invocation, forbidden-claim,
  unsupported-output, and prohibited-text gates.

## Regression assurance

The focused fixtures cover:

- blank, whitespace, malformed, and unregistered source identifiers;
- registered sources not authorized for the evidence record;
- non-admitted sources and missing, malformed, HTTP-only, or absent registry
  metadata;
- canonical replacement of malformed retriever title and URL metadata;
- duplicate source and cross-family authority records;
- claim, concept, relationship, and source-self authorization paths;
- all three paraphrased hostile requests reproduced by the independent audit;
- one-term domain anchors backed by direct ranked retrieval, with negative
  coverage for unranked graph expansion and zero-overlap evidence;
- safe grounded-answer and explicit-refusal adversarial outcomes;
- exact-ID/category disagreement and impossible-filter benchmark gaming; and
- prompt instructions that identify question, context, evidence, source
  metadata, and locators as untrusted data.

## Local validation evidence

| Gate | Result |
|---|---|
| Focused RAG mutation dry run | Passed: 116/116 |
| Repository validation | Passed: 0 errors, 0 warnings |
| Full test suite | Passed: 422; 4 conditional local PostgreSQL tests skipped |
| Coverage | Passed: 92.04% statements, 82.39% branches, 95.48% functions, 94.67% lines; citation authority reached 100% in every dimension |
| Focused RAG mutation | Passed: 74.63% total, 75.83% covered; 752 killed, 240 survived, 16 no coverage, 1 timeout, 0 errors |
| Citation-authority mutation | Passed: 100%; 35 killed, 0 survived, 0 no coverage, 0 timeout/error |

The Docker CLI and a local PostgreSQL/pgvector runtime were unavailable, so
local integration and `pnpm rag:evaluate` could not run. The hosted integration
job must supply that evidence for the final implementation SHA. No live or paid
model invocation was authorized or performed.

## Hosted evaluation follow-up

The first hosted integration evaluation of implementation commit
`9da9a6980d8100c3638921b37bb84576a8ef8be9` preserved perfect citation
completeness and resolvability but failed the version 3 answer-status and
expected-claim/type gates. The failure exposed a deterministic-provider
relevance mismatch: direct retrieved evidence with one strong domain term was
discarded by a second provider-local two-term overlap rule. The follow-up
removes that mismatch by requiring the one matching term to belong to a direct
ranked retrieval result. It does not add hostile phrases, expected claim IDs,
or benchmark case IDs to provider logic. A new exact-SHA hosted run remains
required to verify the correction against PostgreSQL/pgvector.

## Residual risks and handoff

- Structural grounding and governed citation authority do not prove textual
  entailment.
- Safe deterministic-provider outcomes do not establish real-provider prompt
  injection resistance, semantic quality, calibration, cost, or latency.
- The committed adversarial and holdout cases are public regression evidence,
  not a secret or independently maintained evaluation set.
- The concrete `gpt-5.6-sol` routing ID is not an immutable dated snapshot.
- Surviving focused mutants remain regression-risk indicators even though the
  configured threshold passes.

M6 remains not cleared by this implementation report. Entry to M7 requires a
green exact-SHA hosted run and an independent re-audit that explicitly closes
or accepts M6-AUD-001 and M6-AUD-004 without reopening the previously disposed
findings.
