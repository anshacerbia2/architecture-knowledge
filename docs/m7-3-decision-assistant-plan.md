# M7.3 Decision Assistant: bounded runtime plan

Date: 2026-09-20. Status: proposed engineering plan; runtime not implemented.
Inspected baseline: `724233c`, merge PR #20 on 2026-09-18.

Implementation progress: [slice 1 snapshot-bound validation](m7-3-snapshot-validation.md)
is implemented locally. The evaluator, decision API and UI remain pending. The
plan below describes the complete bounded pilot, not delivered product capability.

The owner requested the next plan after checking current implementation and replied
"gas" to preparing it and repairing documentation prerequisites. This document
records that work, not M7.3 completion, human content review, or decision approval.
Implementation choices below are proposals with acceptance tests, not new governed
architecture claims. Historical reports retain their original scope and dates.

## 1. Starting point and first usable outcome

| Existing boundary | Evidence | Implication for this plan |
| --- | --- | --- |
| M7.2 three-guide pilot complete | [Owner completion record](m7-2-completion-approval.md) | Reuse the guides; their content remains proposed. |
| Session v3 and recommendation v4 | [Session schema](../schemas/decision-session.schema.json), [recommendation schema](../schemas/decision-recommendation.schema.json) | Generate results against the existing contracts. |
| Semantic output validator | [Validator](../src/decision-recommendation-validator.ts), [kernel guide](m7-decision-guide-kernel.md) | Preserve applicability, evidence closure, uncertainty and authority checks. |
| Atlas snapshot and layered app | [Snapshot](../apps/atlas/packages/knowledge-adapter/src/snapshot.ts), [app boundaries](../apps/atlas/AGENTS.md) | Extend the existing application through its ports and compiled facade. |
| Existing runtime API exposes RAG, not a decision engine | [Public facade](../src/runtime-api.ts), [HTTP routes](../apps/atlas/apps/api/src/http-server.ts) | Add an explicit decision boundary rather than treating Ask as a decision session. |
| OpenAI, OpenRouter free and Antigravity adapters implemented | [Provider factory](../apps/atlas/packages/knowledge-adapter/src/providers.ts) | Provider availability does not grant permission to process decision context. |

First usable outcome: a user chooses
[AKG-000002: Dependency fault-response selection](../decisions/AKG-000002.yaml),
describes one dependency-call boundary, confirms relevant conditions and sees a
validated option assessment with evidence, uncertainty and verification questions.

The two options are Retry (`AKC-000012`) and Circuit Breaker (`AKC-000013`). They are
complementary controls. The pilot must preserve both when applicable; it does not
invent a third combination concept, rank one as universally better, or infer that
two viable options alone prove a safe composition.

The first slice uses only this guide. The other two guides remain browseable and
can be enabled for decision evaluation after their own end-to-end acceptance cases.
No new knowledge, sources, claims, IDs, decision artifacts or database tables are
needed for the planned first slice. ADR/RFC/PAD generation, persistent sessions,
multi-user access, automatic guide selection and corpus expansion are later work.

## 2. Product flow

1. Open a new Decision Assistant page and select the pilot guide. Show its question,
   version, proposed lifecycle and recommendation-only authority.
2. Fill the four declared context fields: decision scope, failure profile, caller
   budget and open-state response. Keep their declared `internal` classification;
   the client cannot downgrade them to activate a provider.
3. Review the guide's scoped hard constraint and optional declared drivers. Ask
   only for registered guide members; priorities do not become numerical scores.
4. Present relevant conditions with `true`, `false` and `unknown` choices, their
   scope and evidence. Confirmation requires an explicit user action; neither a
   preselected value nor free-text context establishes a condition's truth.
5. Evaluate locally. If information is missing, show specific clarification prompts
   and preserve the draft in component memory. Do not infer facts from the prose.
6. Display viable, rejected and inapplicable options, binding-local citations,
   trade-offs, risks, verification questions, evolution triggers and uncertainty.
7. Any edit invalidates the previous result immediately. Re-evaluate the revised
   draft; reset, navigation away or reload discards the session.

The UI translates contract statuses into plain language. Raw schema fields and
diagnostic codes belong in an optional inspector, not the intake flow. Questions
and conditions come from the pinned guide and evidence, grouped by purpose and
deduplicated using statement, scope and concept-reference set. Inspect transitive
claim conditions as well as conditions directly written in the guide.

## 3. Evaluation and evidence rules

Use a deterministic local evaluator. The guide explicitly sets
`external_provider_policy: prohibited` and `session_persistence: ephemeral-only`.
Neither existing provider consent nor a request authorization flag overrides that
policy. The decision path must have no provider, CLI runner, embedding or retrieval
database dependency. Exact lookup of the pinned guide and its evidence is sufficient.

| Situation | Proposed result |
| --- | --- |
| Missing required context, unknown required conditions or unconfirmed answers | `needs-human-clarification`; explicit questions; no viable-option recommendation |
| Hard constraint known false, unavailable evidence, contradictory confirmations or no supported viable option | `insufficient-evidence`; explain the specific boundary; preserve known assessments only when they validate |
| Exactly one supported viable option and a complete, justified partition | `recommendation` |
| Both options viable and their conditions/evidence hold | `multiple-viable-options`; explain complementarity and preserve human choice |
| Schema/semantic failure in a constructed result | Operational error; no rejected draft rendered as an evidence conclusion |

Rules use the existing validator's three-valued logic: a conjunction with a false
condition is false; otherwise unknown/unconfirmed conditions make it unknown.
Viability requires an active selection rule and all exclusion rules false.
Rejection requires an active avoidance/disqualifier rule. Inapplicability requires
selection rules to exist, all selection/exclusion rules false, and every relevant
condition known and human-confirmed. Unknown is not false or inapplicable.

An affirmative result must partition every guide option. A partial assessment with
one unassessed option remains non-affirmative. Conflicting human confirmations are
shown for reconciliation, not silently resolved using a model or text similarity.
Generic conflict detection between arbitrary condition prose is not implemented;
the pilot must identify its supported consistency checks before the engine slice
is considered complete and record any guide-specific mapping explicitly.

Construct `decision_basis` from the chosen guide, session and applicable rules,
including false-rule evidence for inapplicable options. Reconstruct it independently
in validation. Resolve claim and source inventories, transitive claim snapshots,
locators, qualifiers and low-confidence uncertainty from the pinned repository.
Do not use whole-guide evidence as a substitute for each statement's support.

Build comparison text from existing guide matrix entries and qualified evidence;
retain `unknown` assessments and unmeasured availability effects. Verification
questions can be taken from the guide's option-specific risk questions, preserving
their conditions and citations. Each viable option needs both trade-off and
verification coverage. If the existing content cannot support an output field,
return an explicit evidence gap rather than authoring a new factual assertion.
Evolution triggers describe when to revisit a decision; their future conditions
must not be asserted as current project facts.

Every final result, including clarification and insufficient-evidence results,
passes the existing schema and semantic gate. The UI shows recommendation-only
authority throughout. User confirmation is a trusted local-user attestation, not
cryptographic authentication, proof of project compliance or semantic entailment.

## 4. Kernel and snapshot integration

Proposed kernel modules: `src/decision-runtime.ts` for the bounded evaluator and
`src/decision-runtime-types.ts` for its public inputs/results. Export an opaque
runtime factory through the existing compiled `architecture-knowledge-system/runtime`
facade. The adapter remains the only Atlas package importing that facade.

The factory is initialized from the fully validated startup model and schema
documents, detached and held privately for the process lifetime. Requests receive
copies of public DTOs, never mutable model maps. Do not accept a client-provided
repository model, guide text, evidence inventory or a boolean claiming validation.

An implementation prerequisite is the current validator's schema-loading behavior:
[validateDecisionRecommendation](../src/decision-recommendation-validator.ts) calls
[validateSchemas](../src/schema-validator.ts), which reads schema files from disk.
Merely exporting that function would mix a pinned model with changing on-disk
schemas. Introduce a startup-compiled, in-memory schema-validation path with the
same strict semantics and retained CLI compatibility. Share schema primitives,
but keep result construction separate from semantic reconstruction so the engine
cannot validate itself using its own claimed evidence basis.

Add regressions for schema edits, source edits, returned-object mutation and stale
guide versions after startup. A running snapshot remains internally consistent;
restart activates a new validated snapshot. Requests perform no Git or source/schema
filesystem reads. Compile/cache schema validation per snapshot, not per request.
No validator rule is relaxed to make the new evaluator pass.

Schema, ontology or identifier changes, if implementation proves necessary, require
an explicit migration record and compatibility tests. The planned transport DTOs
do not alter session v3 or recommendation v4, allocate AKG IDs, or change lifecycle.

## 5. Proposed application/API contract

Add a `DecisionPort` and a bounded `DecisionService` in the application package,
implemented by the knowledge adapter using the opaque runtime. Contract types live
in the transport-neutral contracts package. Reuse existing HTTP envelope, strict
validation, Host/Origin/token checks, redacted errors and concurrency limits.

| Endpoint | Proposed behavior |
| --- | --- |
| `GET /api/v1/decision-guides` | Return the runtime-enabled guide catalog; initially only AKG-000002. |
| `GET /api/v1/decision-guides/:id/intake` | Return declared context, constraint, driver and condition prompts with guide version and pinned SHA. |
| `POST /api/v1/decision-evaluations` | Accept the complete ephemeral session plus pinned SHA and client revision; return only a validated result with clarification prompts and matching revision. |

The POST uses a versioned closed DTO. Session input follows v3, result follows v4;
response metadata and clarification prompts sit outside the recommendation object.
The server validates guide enablement, UUID, contract/guide versions, SHA, declared
context classifications, condition identities and authority. Privacy fields must
remain ephemeral, external authorization false/null; forged fields are rejected.

No session is retained between requests. The browser creates a UUID and monotonic
revision for its in-memory draft; these correlate requests and confer no authority.
Apply the existing 64 KiB request bound, 4000-character per context string bound,
and a maximum of two concurrent expensive operations shared with Search/Ask. Bound
array counts by the selected guide's declared inventory. Measure the actual pilot
payload and evaluation time before changing existing transport limits.

Discard out-of-order responses and any response for an edited draft or different
snapshot. Discarding a response does not claim to cancel server work. A snapshot
mismatch requires reopening intake from the active version. Do not persist forms
in localStorage, sessionStorage, browser history, URL parameters, query caches,
telemetry, server logs, temporary files or the governed repository. Reset/unmount
clears draft and result state; this is application-level non-retention, not secure
erasure of OS/browser memory. Responses retain the existing no-store policy.

## 6. Implementation slices and acceptance

| Order | Deliverable | Exit evidence |
| --- | --- | --- |
| 0 | Repair review links and align current roadmap; record this plan | Documentation/schema validation and deterministic report freshness pass. |
| 1 | Snapshot-bound schema validator and public decision runtime boundary | Existing CLI contracts unchanged; tampered model/schema/version regressions fail closed; no request-time filesystem/Git access. |
| 2 | Local evaluator for the first guide, evidence assembler and clarification contract | Real-guide acceptance cases and synthetic adversarial fixtures pass through independent output validation. |
| 3 | DecisionPort/service, DTOs and API routes | HTTP tests prove strict input, privacy, version, authority, concurrency and output checks; no provider/DB call. |
| 4 | Atlas intake, condition confirmation, comparison and evidence inspector | Browser flows cover missing context, single/multiple viable options, edits, reset, stale responses and accessible/mobile forms. |
| 5 | Integrated verification and handoff | Required gates pass on the implementation SHA; residuals and any migration recorded; no milestone completion or independent audit inferred from self-tests. |

Minimum scenario matrix:

- Empty and partially completed intake produce clarification with no viable options.
- Retry viable with breaker justifiably inapplicable; breaker viable with retry
  justifiably rejected; both viable under confirmed coordination conditions.
- Active exclusion prevents selection; both excluded or a false hard constraint
  prevent affirmative output; unknown exclusion cannot disappear from assessment.
- All selection rules false with fully known conditions permits inapplicability;
  a false conjunct plus another unknown does not.
- Missing/low-confidence/transitive evidence, missing option coverage and conditions
  shared by active and inactive evidence preserve the existing validator behavior.
- Altered condition scope/reference set, mismatched guide version, forged claims,
  extra context fields, injected instructions and approval flags fail safely.
- Public/internal classification mismatch and forged external consent cause no
  provider call; decision evaluation still works when the retrieval DB is unavailable.
- Editing while evaluation is pending, repeat submission, reset, route exit and
  snapshot change never display an obsolete result as current.

Use real-guide tests for end-to-end compatibility; knowledge-like negative fixtures
stay synthetic under tests. Validate test outputs with the real semantic validator
and assert option/condition outcomes explicitly. A fake provider success or a
schema-only pass is not the acceptance test for this runtime.

Required implementation gates: `pnpm validate`, `pnpm format:check`, `pnpm test`,
`pnpm test:coverage`, the existing decision-guide/recommendation mutation gate plus
focused mutation coverage for the new evaluator, `pnpm graph:check`,
`pnpm retrieval:units:check`, `pnpm report:check`, `pnpm build`, `pnpm app:check`,
`pnpm app:test:coverage`, and `pnpm app:test:e2e`. Extend existing coverage/mutation
configuration to include new high-risk code without lowering thresholds. Existing
full CI remains required on the delivered SHA; report DB skips separately. New
decision browser tests require neither paid calls nor a retrieval DB. Use a frozen
pnpm install in clean-checkout CI.

## 7. Trade-offs, open decisions and rollback

Local deterministic evaluation fits the guide's privacy policy and explicit
condition contract. Its cost is more user confirmation and no automatic natural
language interpretation. Alternative model-assisted intake would require a
separately justified policy/content migration and evaluated processing boundary.
The existing Ask flow remains available for its independently permitted inputs.

An ephemeral stateless API avoids session storage work but requires resubmitting
bounded context, loses drafts on reload, and does not support collaboration.
Persistence belongs to a later scope with a retention and authorization contract.

Before slice 2 exits, settle and document: the minimum condition inventory for each
clarification step; the supported pilot consistency checks; the evidence-preserving
statement mappings; and handling of guide questions that are useful inquiry prompts
but do not establish a supported assertion. Before slice 4 exits, measure completion
friction with scripted pilot scenarios; do not claim usability gains without data.

Rollout is limited by the server's enabled-guide catalog. A runtime failure disables
decision evaluation with a clear operational status; it does not fall back to Ask
or release an invalid recommendation. Rollback reverts the runtime/API/UI commits
without changing governed content, IDs or lifecycle. Keep the validator improvements
only if their standalone compatibility and snapshot tests pass.

## 8. Planning-change verification

This planning change repairs relative Markdown link destinations in the existing
Graph/RAG assessment; its assessment text and conclusions are not adjudicated.
It aligns README, ROADMAP, the machine-readable milestone notes and the docs index.
It does not implement the runtime, modify governed content or change a schema.
Integrity reports are regenerated through `pnpm report:integrity` only.

The earlier baseline check passed kernel typecheck and Atlas formatting/typecheck;
Atlas tests passed 191 cases with one DB test skipped. Full validation then reported
17 broken local links in the untracked assessment. These are historical baseline
results, not verification of a future M7.3 implementation.

Planning-change checks on 2026-09-20: `pnpm validate` passed with zero errors and
warnings; `pnpm graph:check` reported 13/13 current artifacts;
`pnpm retrieval:units:check` reported 2/2 current artifacts. No executable code
changed, so runtime tests, live providers and database checks are not rerun for
these documentation edits. Integrity reports are regenerated and their freshness
checked after the final documentation edit; the command outcome accompanies the
handoff. Hosted CI has not been checked for this uncommitted change.
