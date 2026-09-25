# M7.3 Post-Merge Technical Audit

Date: 2026-09-25 (Asia/Jakarta). Audited merge SHA:
`efbb3b03e22d033679d04dff6de8b55ba4e750c2` on `main`, from
[PR #21](https://github.com/anshacerbia2/architecture-knowledge/pull/21).
The starting worktree was clean. All three decision guides remain `proposed`.

## Decision and review boundary

**M7.3 NEEDS FOCUSED REMEDIATION before owner completion.** Counts: Critical 0,
High 0, Medium 1, Low 1, Observations 2. The runtime, API and browser flow pass
their tested safety and validation boundaries. The advertised risk comparison is
absent from every recommendation, so a user cannot inspect option-specific risks
in the comparison result. This is a product coverage gap, not evidence of an
unsafe automatic decision or an invalid claim.

This is a same-assistant adversarial review after the implementation was merged,
not an independent second-reviewer or human attestation. It does not approve
M7.3, the three guides, any claim, or any architecture decision. The review
checks the delivered scope; it does not authorize M7.4, corpus expansion,
provider processing of project context, or decision-artifact generation.

## Scope and method

Inspected the [bounded plan](m7-3-decision-assistant-plan.md),
[implementation handoff](m7-3-implementation-report.md), runtime evaluator,
independent recommendation validator, session/recommendation schemas, all three
guide inputs, Atlas adapter/service/HTTP route/UI, tests, and the exact-merge CI.
The source review traced option and evidence construction to the output and its
browser presentation. Local focused tests were rerun; CI results were checked
against the merge SHA. No local database or external model call was used.

## Findings and dispositions

| ID | Severity | Disposition | Evidence |
| --- | --- | --- | --- |
| M7.3-AUD-001 | Medium | Open; blocks M7.3 completion against the advertised comparison scope | Every constructed recommendation sets `risks: []`; the UI has no risk section. |
| M7.3-AUD-002 | Low | Open; clarify the pilot's driver behavior and UI wording | Optional quality drivers add decision-basis pointers but do not alter option evaluation or comparison. |
| M7.3-AUD-003 | Observation | Retained limit | Human condition confirmations are local attestations; free-text truth and usability with real projects remain unmeasured. |
| M7.3-AUD-004 | Observation | Retained review limit | Same-assistant review and successful deterministic/hosted tests do not establish independent semantic or human content review. |

### M7.3-AUD-001: risk output is structurally present but never populated

The plan requires the result to display trade-offs, **risks**, verification
questions and evolution triggers; see [product flow](m7-3-decision-assistant-plan.md)
step 6. The [runtime](../src/decision-runtime.ts) builds trade-offs from
`tradeoff_matrix`, verification from `risk_questions`, and evolution triggers
from guide records, but initializes `risks: []` unconditionally. The
[Decision page](../apps/atlas/apps/web/src/pages/decide.tsx) renders those other
arrays and omits `risks`. The [recommendation schema](../schemas/decision-recommendation.schema.json)
requires a `risks` array but allows it to be empty; the semantic validator
requires per-option coverage only for trade-offs and verification.

The pilot guides contain risk **questions**, which are useful verification
prompts. A question does not by itself establish that the risk has occurred in
the user's project. Thus the current `risks: []` is safer than converting those
questions into unqualified factual assertions, but it still leaves the promised
risk comparison unavailable. The tests assert trade-off and verification
coverage for viable options and do not assert risk presentation.

Exit: either introduce evidence-bound, option-specific, appropriately qualified
risk statements that pass the existing semantic gate and display them, or
explicitly narrow the M7.3 promise to risk *questions* and obtain owner
acceptance of that scope. Include all three guides and single/multiple-option
regressions. Do not present a future risk as an observed project fact.

### M7.3-AUD-002: selected drivers do not prioritize the result

The UI calls the step "Confirm scope and priorities" and lets users select
declared quality attributes. The [runtime](../src/decision-runtime.ts) validates
driver membership and adds selected quality attributes to `decision_basis`, but
selection does not change viable/rejected options, trade-off ordering, or a
comparison summary. The UI also uses the guide's declared priority rather than
asking for a project-specific priority. This is consistent with the plan's
prohibition on invented numerical scores, but the current label can lead users
to expect an effect that is not implemented.

Exit: describe these controls as an evidence-scope selection, or implement a
separately specified, evidence-safe use of project priorities. Do not imply a
ranking or measured gain that the guides do not support.

## Validation and provenance

- [Merge run #74](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/35867321608)
  and [scheduled run #76](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/36071719843)
  completed successfully on the audited SHA. Each has 15 successful jobs,
  including Linux/Windows validation, Atlas, retrieval integration and all
  mutation suites. CI success is implementation-gate evidence, not a resolution
  of M7.3-AUD-001 or M7.3-AUD-002.
- `pnpm validate` passed with zero errors and warnings.
- Focused kernel snapshot/runtime tests passed: 43/43, including all 256 complete
  boolean condition assessments across the three guides.
- Focused Atlas application, adapter and HTTP tests passed: 50/50.
- Initial local attempts failed to start `tsx`/Vitest because the sandbox denied
  child-process spawning (`EPERM`). The same commands passed with process-spawn
  permission; this was an execution-environment limit, not a validation finding.

No governed knowledge, schema, identifier, lifecycle state, runtime, application
code, or threshold changed in this audit. The next bounded run is focused closure
of M7.3-AUD-001 and M7.3-AUD-002, followed by a targeted recheck of the actual
output/UI and exact-SHA CI. Owner completion remains a separate human decision.
