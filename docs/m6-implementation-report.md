# M6 Architecture RAG Implementation Report

## Executive summary

M6 implements a versioned RAG request, governed context assembly, strict model
output schema, deterministic fake provider, production OpenAI Responses
adapter, post-generation grounding validation, source-controlled citation
resolution, stable answer packet and Markdown renderer, CLI, draft functional
evaluation corpus, coverage boundary, focused mutation gate, and hosted
PostgreSQL CI integration. This is an implementation report, not an independent
audit or lifecycle transition.

## Starting baseline

| Field | Value |
|---|---|
| M5 decision | `M6 READY` |
| Branch | `main` |
| Starting HEAD and `origin/main` | `07053d6749899b407c363609395b5832bf7405c8` |
| Worktree | clean |
| Entry evidence | `docs/m5-focused-evidence-reaudit-report.md` |

## Implemented boundary

| Area | Behavior |
|---|---|
| Request | closed, bounded object contract; retrieval text bound to question |
| Retrieval | current M5 `hybrid-graph` packet; no second index or graph |
| Context | evidence/citation catalog, graph provenance, classification, token bound, full prompt-visible SHA-256 fingerprint |
| Model | strict structured output; exact provider/model/prompt metadata |
| Grounding | evidence, claim, citation, epistemic, confidence, and recommendation validation |
| Citation | application-resolved from retrieved catalog; never model-authored |
| No answer | empty retrieval skips model and returns explicit insufficient evidence |
| Rendering | stable Markdown plus complete machine-readable answer packet |
| Evaluation | 20 draft cases with corpus-quality rules, invocation checks, and split functional/safety gates |

The answer model contract distinguishes sourced claim, synthesis, inference,
recommendation, and uncertainty. Recommendations require explicit permission,
project context, conditions, alternatives, and trade-offs. No status or content
lifecycle state is modified.

## Provider boundary

The production adapter is OpenAI Responses with concrete routing model
`gpt-5.6-sol`, strict
`text.format` JSON Schema, `store: false`, bounded output and timeout, explicit
refusal/incomplete handling, model verification, and bounded retries. External
classification is required in the request, bound into the context fingerprint,
and enforced by the engine and provider before external invocation. The CLI
runtime defaults to `public`. The API key is environment-only; request and
response payloads are not logged by the adapter.

The deterministic fake provider copies only first-class claim evidence and is
used for CI. Its results are functional correctness evidence, not real-provider
semantic-quality evidence.

## Local validation evidence

| Gate | Result |
|---|---|
| Focused M6 tests | 55/55 passed |
| TypeScript | passed |
| Full coverage suite | 368 passed, 4 PostgreSQL-local skipped |
| Coverage | 91.91% statements, 81.73% branches, 95.14% functions, 94.70% lines |
| Focused M6 mutation | 71.47% total, 73.05% covered, threshold 60% |
| Mutation inventory | 496 killed, 183 survived, 15 no coverage, 0 timeout/error |

The PostgreSQL tests are conditional locally because no local pgvector service
was available during this run. The workflow now runs `pnpm rag:evaluate` and an
answer smoke test inside its pinned PostgreSQL/pgvector service job.

## Evaluation contract

The version 2 draft benchmark includes four exact-ID cases, eleven natural
answerable questions, two natural no-answer questions, three adversarial
questions, and a seven-case committed regression holdout. Impossible filters
are forbidden and adversarial cases must invoke the model. Gates require:

- answer-status, model-invocation, citation, epistemic-label, and expected-type
  accuracy of 1.0 for the full corpus and holdout;
- expected-claim recall of at least 0.8;
- zero forbidden claims, unsupported statements, and prohibited output.

Hosted results remain pending until the implementation commit is pushed and an
exact-SHA run is observed. A real OpenAI provider benchmark is also pending
separate authorization and must not be conflated with fake-provider results.

## Security and failure controls

| Risk | Control |
|---|---|
| Prompt injection asks to ignore evidence | model output cannot cite outside supplied IDs; post-check fails closed |
| Fabricated URL/source | citation fields are resolved only from catalog |
| Unsupported factual prose | assertive statements require evidence and resolvable sources |
| Hidden inference | every statement requires an epistemic label |
| Unbounded recommendation | explicit permission, project context, framing, and confidence restrictions |
| Stale/tampered retrieval | existing M5 currentness and manifest checks run before answering |
| Empty retrieval | model invocation skipped |
| Provider retention | Responses request sends `store: false` |
| Non-public content | provider allowlist checked before external invocation |

## Residual risks

- Medium: structural grounding does not prove semantic entailment of generated
  prose. Independent adversarial evaluation and real-provider sampling are
  required before production clearance.
- Medium: the draft corpus and deterministic provider do not measure real-model
  answer quality, calibration, latency, or cost.
- Low: `gpt-5.6-sol` avoids the broad `gpt-5.6` alias but is not an immutable
  dated snapshot. Exact real-provider reproducibility remains bounded by the
  provider's routing contract.
- Observation: hosted exact-SHA PostgreSQL and cross-platform evidence is not
  available until the implementation is committed and pushed.

## Scope exclusions

No decision driver extraction, option generation, ADR/RFC/PAD drafting,
approval automation, conversational memory, UI, feedback learning, knowledge
authoring, corpus mutation, or lifecycle elevation was implemented. These are
M7 or later concerns.

## Handoff

The first independent audit returned `M6 NOT READY`. Focused remediation is
recorded separately in `docs/m6-focused-remediation-report.md`; a new exact-SHA
hosted run and independent focused re-audit are required. M7 is not cleared by
this report.
