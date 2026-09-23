# M7.3 slice 2: local decision evaluator

Date: 2026-09-22. Status: implemented; application integration is recorded separately.
Scope: deterministic evaluation of the three existing M7.2 decision guides against
the pinned validation snapshot. This is not M7.3 completion, content approval, or
an accepted project decision.

## Delivered boundary

The kernel now exposes an opaque, snapshot-bound decision runtime through
[`architecture-knowledge-system/runtime`](../src/runtime-api.ts). It provides:

- a catalog containing `AKG-000001`, `AKG-000002`, and `AKG-000003`;
- detached intake definitions for each guide's declared context, constraints,
  quality attributes, and current applicability conditions;
- deterministic three-valued evaluation of selection and exclusion rules;
- complete viable, rejected, and inapplicable option handling;
- binding-local trade-off, verification, evolution, claim, source, and transitive
  evidence assembly; and
- explicit clarification prompts when human-confirmed input is incomplete.

Every constructed recommendation is passed through the separately compiled
schema and semantic validator before it can be returned. A validation failure is
an operational error and exposes no partial recommendation. The runtime returns
detached values and retains the repository model and schemas privately.

## Safety and authority

The runtime accepts only declared guide IDs, versions, context keys, constraint
inventories, and condition identities. Duplicate or forged attestations fail
closed. Required values and all current pilot conditions must be explicitly
confirmed by the local human operator; free text never establishes a condition.

All sessions remain `ephemeral-only`. External-provider authorization must be
`false` with a null authorization object. Evaluation imports no provider, CLI
runner, embedding service, or retrieval database. It therefore cannot send
decision context to AGY, OpenRouter, OpenAI, PostgreSQL, or any other service.

Every result preserves:

- `recommendation_only: true`;
- `human_decision_required: true`; and
- `automation_may_approve: false`.

The three governed guides retain `status: proposed`. Runtime success is not a
lifecycle transition, semantic entailment proof, or human approval.

## Evaluation behavior

A false condition makes a conjunctive rule false; otherwise an unknown or
unconfirmed condition makes it unknown. An active avoidance or disqualifier rejects
an option. A selection rule that is true with all exclusions false makes the option
viable. An option is inapplicable only when every relevant rule is known and all
selection and exclusion rules are false.

Missing context, an unknown hard constraint, or an unconfirmed current condition
produces `needs-human-clarification` with no viable option. A false hard constraint,
all options excluded, or a fully assessed no-option outcome produces
`insufficient-evidence`. One viable option produces `recommendation`; two viable
options produce `multiple-viable-options` without inventing a combined option or
ranking complementary controls.

Contradiction checks are deliberately structural: a satisfied constraint with a
known-false bound condition, or simultaneously active selection and exclusion for
one option, blocks an affirmative output and requests human reconciliation through
explicit uncertainty. This does not detect arbitrary contradictions in free text.
Unknown transitive evidence conditions receive clarification prompts. False asserted
evidence conditions or absent option coverage produce an explicit evidence gap.

Verification uses applicable risk questions. If a viable option has no currently
applicable risk question, the runtime uses the existing matching evaluation-criterion
question with that option's matrix-cell evidence, only when the criterion's current
conditions hold. Questions remain inquiries, not evidence that verification has
occurred. Future evolution conditions are retained as conditional text and are not
treated as present project facts.

## Local verification

Focused runtime tests pass 32 cases over all three real guides. They cover detached
catalog/intake/results, clarification, single and multiple viable outcomes, rejection,
inapplicability, hard-constraint failure, unknown exclusions, external-provider
override, stale versions, duplicate/forged conditions, undeclared context, and
snapshot-load failure, blank confirmed context, conflicting attestations, missing
conditions, driver-basis precision, classification mismatch, oversized values,
future-trigger preservation, pending-input detachment, and fresh public-loader
construction inside a test. Three additional exhaustive tests cover all 256
complete boolean assessments across the three guides without an operational failure.

The full 707-test kernel run measured runtime coverage at 96.57% statements,
91.94% branches, 97.11% functions, and 97.65% lines, before four supplemental tests
were added. The runtime is included in full coverage and a separate decision-runtime
mutation suite. The 68.29% local mutation baseline predates those additional tests.
Detailed scope, limitations, application results, and pending hosted verification
are recorded in the implementation report.

## Subsequent application integration

The transport-neutral `DecisionPort`, application service, strict HTTP routes, and
Atlas user interface are recorded in the
[M7.3 implementation report](m7-3-implementation-report.md). ADR/RFC/PAD generation,
persistent sessions, automatic lifecycle transitions, and corpus expansion remain
out of scope.
