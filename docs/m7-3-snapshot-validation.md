# M7.3 slice 1: snapshot-bound decision validation

Date: 2026-09-20. Status: implemented locally; verification results below.
Scope: the first validation prerequisite in the
[M7.3 plan](m7-3-decision-assistant-plan.md). This does not implement option
evaluation, a Decision Assistant API/UI, or complete M7.3.

## Problem and resulting behavior

The existing decision validator read schema files during each evaluation. Calling
it with pinned repository records after a schema edit could mix revisions. The new
startup loader retains detached records and compiled schemas privately. Its returned
validator checks subsequent session/recommendation inputs without filesystem reads.

[loadDecisionValidationSnapshot](../src/decision-validation-snapshot.ts) is exported
through the compiled public runtime facade. It accepts a trusted local repository
root, runs full repository analysis and rejects startup errors with the stable,
redacted `DECISION_SNAPSHOT_INVALID` error. The return value exposes only a frozen
object with `validate(session, recommendation)`, returning diagnostic copies.
It accepts no client-supplied repository model, schema map or validation assertion.

The caller still owns clean-commit checks, repository-root selection and process
activation. This loader alone does not authenticate a commit or eliminate concurrent
edit-and-revert races. Atlas integration will create it inside the startup snapshot
boundary; it is not yet wired into an app request route. Restarting and loading a
new snapshot activates changed records and schemas.

## Implementation and compatibility

- [Schema validator](../src/schema-validator.ts): filesystem loading delegates to
  the same detached schema compiler used by the snapshot. All schemas are registered
  before reference resolution, including forward references. Duplicate IDs,
  metaschema failures, missing references and unknown mappings remain diagnostics.
  AJV strictness, format validation and no-coercion behavior are preserved.
- [Decision validator](../src/decision-recommendation-validator.ts): the existing
  semantic implementation receives either filesystem or compiled schema validation.
  Guide, evidence, applicability, option partition, conditions, uncertainty and
  authority checks are not replaced or bypassed. Inputs are copied synchronously
  before asynchronous validation can yield to the caller.
- The low-level compiler and model-taking constructor are internal module exports
  for kernel composition/tests. They are validation primitives, not attestation, and
  are not exposed through the public runtime facade.
- CLI behavior remains filesystem-based and compatible with session v3,
  recommendation v4 and the existing diagnostic vocabulary. No governed schema,
  ontology, identifier, lifecycle or data migration is introduced. The package
  change is an additive public export; no existing export is removed.

This fits a process serving a fixed repository revision. It adds startup compilation
and a private model copy; validation still executes the existing semantic checks and
returns detached schema-result metadata internally. It is not a semantic-validation
result cache or a performance SLO claim. A CLI that intentionally inspects current
files continues to use the existing entry point.

No session persistence, provider calls, retrieval database access or decision approval
is introduced. Diagnostic messages from the existing semantic gate remain generic;
the future HTTP boundary must continue its own bounded DTO and error-redaction rules.

## Regression evidence

[Schema snapshot tests](../tests/schema-snapshot.test.ts) cover equivalence with
registered-file validation, schema/result mutation isolation, no coercion/defaults,
numeric and format boundaries, forward references, fragment mappings and repeated
compilation-error diagnostics.

[Decision snapshot tests](../tests/decision-validation-snapshot.test.ts) cover:

- compatibility with the legacy semantic gate;
- changed guide versions, source-claim state and schema collections after creation;
- mutation of pending inputs before the first asynchronous continuation;
- malformed evidence records and unresolvable schemas;
- the real pilot's one-option and two-option results while filesystem operations
  are made unavailable after startup;
- malformed repository data and a full-kernel lifecycle error at startup; and
- the public facade exposing the checked loader without raw construction primitives.

Existing CLI tests still validate files end to end and reject forged evidence
targets without writing or echoing session data. These tests provide structural
and semantic-contract regression evidence, not independent architectural review,
free-text entailment proof, or human content approval.

## Local verification

Kernel tests with coverage passed 676 tests, with five database tests skipped.
Coverage passed the unchanged gates: 93.48% statements, 84.84% branches,
97.21% functions and 95.57% lines. The new snapshot loader has 100% coverage;
schema validation has 94.80% statements and 75.55% branches in that run.
Root formatting and the compiled kernel/Atlas production build passed.

Schema validation and the snapshot loader are now included in coverage and in the
existing recommendation mutation suite. Its threshold and mutation exclusions are
unchanged; tests for the new boundary are included in that suite. Remaining gate
outcomes are recorded at handoff after execution. Windows initially blocked Vitest,
Vite and Stryker worker creation with `spawn EPERM`; commands were retried with
process-spawn permission. Hosted CI and live DB/provider checks are not claimed.

## Next implementation slice

Build the local evaluator and clarification/evidence assembly for AKG-000002,
then validate every constructed result through this pinned boundary. The guide's
external-provider prohibition, ephemeral session policy and complementary option
semantics still apply. API and UI integration follow that evaluator; no user-facing
Decision Assistant capability is claimed by this prerequisite alone.
