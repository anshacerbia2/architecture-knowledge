# M6 Focused Remediation Report

Date: 2026-08-22

Baseline audit commit: `adcf535`

Branch: `m6-focused-remediation`

This machine-authored report records focused remediation of the independent M6
audit. It is not an independent re-audit, human approval, lifecycle transition,
or clearance to begin M7. No governed knowledge, claim, relationship, source,
or lifecycle status was changed.

## Scope

The run addresses every finding in `docs/m6-independent-audit-report.md`, with
implementation changes concentrated on citation resolution, context integrity,
classification enforcement, evaluation credibility, provider/output bounds,
and regression assurance. Decision-assistant behavior and M7 remain excluded.

## Finding dispositions

| Finding | Disposition | Evidence |
|---|---|---|
| M6-AUD-001 | Remediated; requires independent verification | Assertive grounding now uses the same application-resolved citation catalog that populates the final answer. Missing or blank title/URL values cannot satisfy grounding. Null, blank, mixed, and final-resolution regressions cover the former bypass. |
| M6-AUD-002 | Remediated; requires independent verification | Context contract version 2 fingerprints every prompt-visible evidence field, raw citations, the resolved catalog, project and answer controls, classification, generation, degradation state, and token estimate. Tests mutate material fields while preserving stale declared hashes and require fingerprint changes. |
| M6-AUD-003 | Remediated; requires independent verification | `data_classification` is required by the reusable request contract, propagated into context and answer provenance, and enforced by both `RagEngine` and `OpenAIRagProvider` before an external call. The CLI injects the runtime classification and rejects conflicting request files. |
| M6-AUD-004 | Remediated; requires independent verification | Benchmark version 2 has 20 cases: four exact-ID, eleven natural answerable, two natural no-answer, and three adversarial. Impossible-filter sentinels are forbidden; adversarial cases must invoke the model; a seven-case committed regression holdout is scored separately. Metrics include status, invocation, expected/forbidden claims, citations, expected epistemic types, unsupported statements, and prohibited text. |
| M6-AUD-005 | Mitigated; accepted residual for focused re-audit | The broad `gpt-5.6` alias was replaced with concrete routing ID `gpt-5.6-sol` and exact returned-model checking remains. OpenAI does not expose this choice here as an immutable dated snapshot, so exact long-term model reproducibility remains explicitly bounded. |
| M6-AUD-006 | Remediated; requires independent verification | Provider schema arrays and application parsing now bound statements, references, qualifiers, uncertainties, summary, statement text, and refusal reason. Exact maxima and over-limit cases are tested. Classification and CLI request-boundary modules were added to focused coverage and mutation scope; retry boundary tests cover 408, 409, 429, 500, and terminal failures. |
| M6-AUD-007 | Accepted architectural limitation | Structural validation proves ID, citation, source, and epistemic obligations; it does not prove semantic entailment. Documentation and evaluation evidence classes preserve this boundary, and real-provider semantic evaluation remains required before production claims. |
| M6-AUD-008 | Deferred non-blocking maintenance | The Node.js runtime annotations originate from current GitHub Action dependencies and do not change implementation behavior. Upgrade monitoring remains a maintenance task and is not represented as M6 safety clearance. |

## Contract migrations

- RAG request, context, prompt, and answer contracts advance to version 2.
- `data_classification` is required and becomes part of provenance.
- `model_invoked` distinguishes retrieval no-answer from model-produced status.
- Context fingerprints bind actual prompt-visible values rather than relying on
  a retrieval unit's declared content hash.
- The draft benchmark advances from version 1 to version 2. It remains
  non-authoritative evaluation data.

## Provider contract basis

The implementation follows the official OpenAI
[Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)
for the Responses `text.format` schema and supported array bounds. String and
cross-field limits are enforced again by application parsing. The official
[latest-model guide](https://developers.openai.com/api/docs/guides/latest-model)
distinguishes the broad `gpt-5.6` alias from the concrete `gpt-5.6-sol` routing
model used here. No live OpenAI request was authorized or made in this run.

## Local validation evidence

| Gate | Result |
|---|---|
| TypeScript and focused RAG suites | Passed |
| Full test suite | 403 passed; 4 conditional local PostgreSQL tests skipped |
| Coverage | Passed: 91.91% statements, 82.15% branches, 95.43% functions, 94.61% lines |
| Focused RAG mutation | Passed: 74.01% total, 75.22% covered; 688 killed, 227 survived, 15 no coverage, 1 timeout, 0 errors |
| Expanded mutation files | `rag-classification.ts` 95.24%; `rag-cli-arguments.ts` 79.31% |
| Markdown and local links | Passed with 0 errors and 0 warnings |

Repository-wide validation, deterministic report regeneration, clean-diff
checks, and exact-SHA hosted evidence are recorded only after their commands
complete. An independent reviewer must verify the resulting commit and hosted
run. The mutation gate passing does not mean all survivors are harmless;
provider total mutation remains 64.95% and should improve incrementally.

## Residual risks and re-audit boundary

- The committed holdout is a regression partition, not secret independent test
  data.
- The deterministic provider tests orchestration and safety contracts, not real
  model quality, calibration, cost, latency, or entailment.
- `gpt-5.6-sol` is more specific than `gpt-5.6` but is not an immutable dated
  model snapshot.
- Local PostgreSQL integration depends on an available pgvector service; hosted
  exact-SHA execution must supply runtime evidence.

M6 remains not cleared. Entry to M7 requires a green exact-SHA hosted run and an
independent focused re-audit that explicitly closes or accepts M6-AUD-001
through M6-AUD-008.
