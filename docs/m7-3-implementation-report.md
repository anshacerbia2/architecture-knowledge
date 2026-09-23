# M7.3 Decision Assistant runtime implementation

Date: 2026-09-23. Status: implemented on the feature branch; hosted verification, independent audit and
owner completion are pending. All three decision guides remain `proposed`.

## Outcome

M7.3 now provides a usable, local Decision Assistant in Atlas for the three existing
M7.2 guides:

- `AKG-000001` — Deployment boundary selection;
- `AKG-000002` — Dependency fault-response selection; and
- `AKG-000003` — Service-availability inquiry lens selection.

The user selects a guide, enters bounded project context, confirms the guide's hard
constraint and individual applicability conditions, optionally selects declared
quality drivers, and receives a validated recommendation result. The result shows
viable, rejected and inapplicable options; trade-offs; verification questions;
evolution triggers; uncertainty; claim/source inventories; and decision-basis
pointers.

This implementation does not extract project facts from prose or let a model choose
condition values. The guide supplies the driver, constraint and condition inventory;
the human supplies and confirms project-specific assessments.

## Architecture delivered

The kernel has an opaque snapshot-bound runtime with a deterministic three-valued
evaluator and independent output-validation step. Atlas adds transport-neutral DTOs,
`DecisionPort`, `DecisionService`, a shared two-operation limiter, the kernel adapter,
three strict HTTP endpoints, and a lazy React page.

The endpoints are:

- `GET /api/v1/decision-guides`;
- `GET /api/v1/decision-guides/:id/intake`; and
- `POST /api/v1/decision-evaluations`.

The POST contract requires the pinned 40-character repository commit, a monotonic
non-negative client revision and session contract v3. The server returns a validated
recommendation v4 plus clarification prompts and the same revision. Unknown request
properties, coercion, stale commits, stale guide versions, undeclared context,
forged condition identities, external-provider authorization and automation approval
fail closed.

## Privacy, lifecycle and authority

Decision evaluation performs no provider, CLI, embedding, retrieval or database call.
The session is `ephemeral-only`; the server has no session repository or write route.
The browser stores drafts and results only in mounted component state, not local or
session storage, URLs, history, query cache, telemetry or governed files. Editing
invalidates the displayed result; reset or route exit discards it. This is not a
claim of secure erasure from browser or operating-system memory.

Every output has `recommendation_only: true`, `human_decision_required: true`, and
`automation_may_approve: false`. No lifecycle event is created. No guide, claim,
relationship, source, recommendation or decision is marked reviewed, approved,
published or canonical.

## Evidence and uncertainty behavior

The evaluator uses exact guide and condition identities from the startup snapshot.
Unknown is never treated as false. A viable option requires a true selection rule
and all exclusions false. Rejection requires an active exclusion. Inapplicability
requires a complete known-false selection/exclusion assessment. A false hard
constraint, all options excluded, or a complete no-option assessment cannot produce
an affirmative result.

Decision basis, direct and transitive claim snapshots, source inventories and
low-confidence uncertainty are reconstructed from the pinned repository. Each final
object passes the separately compiled schema and semantic validator. Invalid output
is an operational failure and is not rendered as an evidence conclusion.

## Validation evidence

Local Windows results recorded during implementation (production code unchanged
after these measurements):

- `pnpm validate`: zero errors and warnings;
- graph, retrieval-unit and integrity currentness: current;
- full kernel coverage: 707 tests passed, five database tests skipped; 93.71%
  statements, 85.34% branches, 97.20% functions, and 95.72% lines;
- runtime coverage within that full run: 96.57% statements, 91.94% branches,
  97.11% functions, and 97.65% lines;
- subsequent startup and exhaustive-combination regressions: 35 focused tests
  passed (32 runtime tests and three tests spanning 256 boolean assessments);
- Atlas unit/HTTP/adapter tests: 197 passed and one database test skipped;
- Atlas coverage: 99.04% statements, 97.47% branches, 100% functions, and 99.29%
  lines;
- browser E2E: 18 passed, including real API evaluation of all three guides with
  an unavailable database, confirmation, edits/reset/reload, stale-response
  suppression, and desktop/mobile rendering;
- CI classification/gate tests: eight passed; and
- kernel build, Atlas typecheck, formatting and production build: passed.

The first full coverage attempt had two 10-second setup-hook timeouts while several
heavy suites ran concurrently. Both suites passed an isolated 65-test rerun; the
entire coverage gate then passed using `pnpm exec vitest run --coverage --maxWorkers=1`.
Timeouts and thresholds were not relaxed. The four subsequently added tests passed
separately; the 707-test coverage total does not include them. A browser test's
dropdown locator was corrected to its accessible role before the successful full
18-test rerun. Port 4311 was already occupied; a separate test port was used without
stopping the existing application.

Completed local mutation baselines:

- recommendation/snapshot boundary: 87.80% (468 killed, seven timed out,
  60 survived, six uncovered; 375 policy-excluded);
- new evaluator: 68.29% (348 killed, three timed out, 148 survived,
  15 uncovered; 273 policy-excluded); and
- focused Atlas decision boundary: 60.50% (268 killed, 167 survived, eight
  uncovered). Route-schema mutation was only 37.50% in this baseline.

All three baselines pass the unchanged 60% gate. Startup and exhaustive runtime
tests, and nested HTTP/revision regressions, were strengthened after the mutation
baselines. Report source text was checked against the unchanged production files;
these scores are not measurements of the strengthened test set. Surviving and
uncovered mutants remain explicit limitations, not proof of defect freedom.

Hosted clean-checkout Linux/Windows, full Atlas mutation, and PostgreSQL integration
remain to be verified on the PR SHA. Hosted results must be read from the exact-SHA
run, not inferred from these local results. A self-test pass is not an independent
audit or milestone approval.

## Residual risks and deferred scope

- Human confirmation is trusted local-user attestation, not authentication or proof
  that project statements are true.
- The conservative pilot asks for every current-condition assessment. Usability and
  completion friction have not been measured with real project participants.
- Browser abort prevents display of an obsolete local result but does not prove secure
  erasure or cancellation below every runtime layer.
- Generic semantic contradiction detection between arbitrary condition sentences is
  not implemented. Duplicate identities are rejected; active selection plus active
  exclusion, and satisfied constraints with false bound conditions, prevent an
  affirmative result. Free-text project statements are not semantically interpreted.
- Persistence, collaboration, multi-user authorization, model-assisted extraction,
  automatic guide selection, ADR/RFC/PAD generation, corpus expansion and lifecycle
  transitions remain out of scope.

M7.3 is implemented for audit handoff only. It must not be described as approved,
canonical, or complete until the authorized human records that transition.
