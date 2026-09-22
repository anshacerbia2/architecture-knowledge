# M7.3 Decision Assistant runtime implementation

Date: 2026-09-22. Status: implemented on the feature branch; independent audit and
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

Local results recorded during implementation:

- `pnpm validate`: zero errors and warnings;
- graph, retrieval-unit and integrity currentness: current;
- focused runtime tests: 31 passed across all three real guides after hardening;
- focused runtime coverage: 95.27% statements, 87.57% branches, 96.51% functions,
  and 96.87% lines;
- full kernel coverage: 93.59% statements, 84.98% branches, 97.14% functions,
  and 95.65% lines;
- Atlas unit/HTTP/adapter tests: 195 passed and one database test skipped;
- Atlas coverage: 98.86% statements, 97.27% branches, 100% functions, and 99.10%
  lines; and
- kernel build, Atlas typecheck, formatting and production build: passed.

Focused kernel and Atlas decision mutation results, browser E2E results, clean-checkout
results and hosted CI provenance are added at delivery handoff after those commands
complete. A self-test pass is not an independent audit or milestone approval.

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
