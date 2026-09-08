# M7.1 Decision-Basis and Session Contract Remediation

Status: proposed implementation handoff; independent exit confirmation pending.
Date: 2026-09-08. Baseline: `c34daabe984aa7f22597610b3b56d91c01fed753`.

## Scope and migration

Ansha Cerbia authorized continuation of the focused remediation after the
[M7.1 re-audit](m7-1-focused-reaudit-report.md). This implementation addresses
M7.1-AUD-002, 005, 011 and 012. The pre-existing audit report and its generated
Markdown inventory change were preserved.

| Contract | Migration | Required action |
| --- | --- | --- |
| Guide schema | 3 to 4 | Preserve full structured condition identity; review bindings before updating the version. No production guide instances exist. |
| Session contract | 2 to 3 | Include current `guide_version`; use resolvable, correctly typed and guide-declared drivers. |
| Recommendation contract | 2 to 3 | Include current `guide_version` and complete `decision_basis`; reconstruct all root/transitive evidence and uncertainty. |
| Schema registry | 5 to 6 | Registers the migrated contracts; lifecycle status remains proposed. |
| Graph/retrieval | Shapes and generator versions unchanged | Existing deterministic currentness gates still apply. Projection code was not changed in this run. |
| Draft artifact | Remains 1 | No generator or acceptance behavior added. |

The guide's `schema_version` is distinct from its per-record `version`.
Session and output `guide_version` must equal the supplied current guide's
record `version`. Version-2 sessions/results are rejected, not silently upgraded.
Guide pointers identify bindings within that version; they are not new opaque
identifiers and cannot be used across revisions without validation. Normal
governed version discipline remains necessary if a guide is edited.

## Decision basis and evidence closure

The output's required `decision_basis` is an array of objects such as:

```json
{
  "guide_pointer": "/recommended_when/0",
  "claim_ids": ["AKL-900002"]
}
```

This is a synthetic shape example, not a reference to production knowledge.
Each entry must match a binding of the current guide. The semantic validator
independently derives the expected binding set from the guide and session/output
consistency checks. Caller-supplied pointers and claim inventories are never the
source of the required evidence roots.

| Basis component | Deterministic inclusion rule |
| --- | --- |
| Options | The option binding for every selected or rejected option. |
| Constraints | The guide binding for every reported known constraint outcome. Unknown outcomes remain explicit without invented support. |
| Assumptions | All declared guide assumptions for an affirmative result. |
| Quality attributes | Guide quality bindings corresponding to session quality drivers for an affirmative result. |
| Recommendation rules | Every satisfied recommendation rule for a selected or rejected option. |
| Avoidance/disqualifier rules | Every satisfied exclusion rule for a selected or rejected option. |

Including all active rules retains both sides of a represented conflict and
prevents choosing only a stronger-confidence parallel rule. A viable option
still needs a satisfied recommendation rule and no active or unknown exclusion.
A rejected option must have at least one active avoidance/disqualifier rule.
An eligible alternative cannot simply be relabeled rejected to manufacture a
single winner. Comparative ranking is not implemented here; unresolved choices
can remain multiple viable options or require human clarification.

Basis order and claim-ID order do not change meaning. Duplicated, omitted,
invented, wrong-family or wrong-version entries fail validation. The union of
these mandatory roots and the explicitly bound output statements must exactly
match the top-level `claim_ids`. Transitive support supplies the exact source
inventory and claim snapshots. Source admission, nonblank locators, epistemic
metadata and low-confidence uncertainty checks apply throughout that closure.
Deleting both the pointer and all corresponding output metadata does not remove
the validator's independently derived obligation.

Transitive claim conditions reachable from guide evidence can now be explicitly
evaluated in the session. Unknown, false or unconfirmed conditions cannot support
an affirmative result. The same applies to extra conditions on mandatory guide
bindings, even if their supporting claim is less narrowly conditioned.
Unrelated risk-only guide evidence stays outside the decision basis unless an
output statement explicitly uses it. Binding-local retrieval attribution remains
unchanged.

## Condition identity, drivers, and clarification

Condition identity includes case-sensitive statement text (with surrounding and
repeated whitespace normalized), exact scope, and sorted concept IDs. Concept
IDs are an unordered set, as enforced by schema uniqueness. Guide evidence
preservation and session truth lookup share this identity function. No automatic
paraphrase or semantic-equivalence inference is performed. Genuine edge-local
conditions remain supported; changing scope or replacing a reusable reference
while retaining the same prose fails.

Drivers must resolve to concepts and appear once per concept in a session.
The `constraint`, `quality-attribute`, and `assumption` roles require the matching
primary type and corresponding guide list. A `context` driver requires a
`context-condition` concept declared in guide assumptions. A `required`
constraint driver must map to a hard guide constraint; other priorities do not
silently strengthen preferences. Unknown, mismatched, duplicated and unsupported
drivers produce diagnostics, including in a clarification result. A future
intake layer must resolve or explicitly handle those inputs before validation.

Both `needs-human-clarification` and `insufficient-evidence` may repeat an empty
session context. A minimal clarification can report an unknown declared
constraint, no viable/rejected options, no unsupported evidence, and an explicit
unknown-context uncertainty. Affirmative statuses still require nonempty,
declared, type-correct, human-confirmed context and all required variables.

## One-to-one finding disposition

| Finding | Implementation disposition |
| --- | --- |
| M7.1-AUD-001 | Prior audit closure preserved by the existing option/cardinality/hard-constraint regressions and new justified-rejection checks. |
| M7.1-AUD-002 | Remediated through independently reconstructed mandatory decision basis, current guide version, transitive evidence and conditions, locators, snapshots and uncertainty. Independent confirmation remains pending. |
| M7.1-AUD-003 | Measurement rules unchanged; matrix regressions retained. |
| M7.1-AUD-004 | Guide citation isolation unchanged; retrieval and graph regressions retained. |
| M7.1-AUD-005 | Remediated with shared structured condition identity, reordered-set positive cases, and scope/reference/text negative cases. |
| M7.1-AUD-006 | Conflicting active rules remain represented; affirmative conflicted options are blocked and basis includes active rules on both sides. |
| M7.1-AUD-007 | Low-confidence and epistemic preservation now cover mandatory decision evidence, not only caller-bound prose. Content-level entailment remains a human review concern. |
| M7.1-AUD-008 | Deferred runtime boundary: provider authorization, identity, expiry and egress are not implemented by the kernel. |
| M7.1-AUD-009 | Guide human lookup policy remains a documented decision before a sizable corpus. |
| M7.1-AUD-010 | Synthetic fixtures only; no live-provider quality or externally independent reviewer claim. |
| M7.1-AUD-011 | Remediated with driver existence/type/membership/duplicate checks and required-constraint hardness enforcement. |
| M7.1-AUD-012 | Remediated with status-conditional context cardinality, empty-intake clarification positives and affirmative negatives. |

## Validation evidence

Before changing the production schemas/validators, the four audit reproductions
failed on the old implementation while a valid recommendation control passed.
The initial regression output was 1 passed / 4 failed, corresponding one-to-one
to omitted selection evidence, changed condition identity, unresolved driver,
and rejected empty-context clarification. They subsequently passed after the
implementation and explicit contract migration.

The expanded tests cover independent and coordinated inventory omissions,
parallel active rules, separate selection/rejection sources, source locators,
transitive parent conditions, current guide versions, unrelated evidence
exclusion, mandatory bindings, drivers and empty intake. Existing assertions
for prior audit defects remain active.

One legacy matrix test expected a reusable condition to be accepted after only
changing its concept type, despite the supporting claim retaining edge-local
scope. The first full suite failed that expectation (568 passed / 1 failed /
4 database tests skipped). The test now verifies that type correctness removes
the type diagnostic but still produces `DG_CLAIM_CONDITION_LOST`, and then
restores the genuine edge-local condition as its positive control. New tests
also prove valid reusable conditions pass. No production rule was weakened.

Local results on the final implementation worktree:

| Command or boundary | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed in the existing worktree; not clean-checkout evidence. Existing ignored esbuild build-script warning retained. |
| `pnpm validate` | Passed strict typecheck and all semantic/schema/Markdown/link gates with 0 errors and 0 warnings. |
| `pnpm format:check` | Passed. |
| `pnpm test:coverage` | 574 tests passed; 4 database integration tests skipped. 42 test files passed and 1 database test file skipped. |
| Coverage | Statements 93.05%, branches 84.22%, functions 96.38%, lines 95.36%; configured gates passed. |
| `pnpm test:mutation:decision-guides` | Both sequential targets passed; command exit code 0. Guide 80.00%; recommendation 85.01%; unchanged threshold 60% each. |
| `pnpm graph:check` | 13/13 artifacts current. |
| `pnpm retrieval:units:check` | 2/2 artifacts current. |
| `pnpm report:integrity` and `pnpm report:check` | Deterministically regenerated integrity inventory; 13/13 reports current. |
| `git diff --check` | Passed. |

The original 47 added tests comprise 39 decision-basis/session regressions and 8
condition-identity tests. Five additional preflight tests cover current-contract
automation authority, confirmation identity, extra mandatory binding conditions
and duplicate confirmations. A legacy evidence/privacy schema test now starts
from current-contract valid controls and asserts the exact failure pointers;
an obsolete contract version can no longer cause a misleading positive result.
The added checks passed without production validator changes. Coverage executes
the full test suite and was rerun after this test-only strengthening. Four database tests were skipped,
so this run does not supply new PostgreSQL or cross-platform hosted evidence.
The other legacy mutation targets were not rerun locally: this run changes only
the decision validation targets, and their existing CI integration remains in
place. No live model call was performed.

The guide mutation report records 164 killed, 38 survived, 3 uncovered and
0 timed-out mutants (205 assessed). The recommendation report records 342
killed, 59 survived, 2 uncovered and 4 timed-out mutants (407 assessed), with
0 reported errors. Stryker includes timeouts as detected mutants in its 85.01%
score. Counting only killed mutants instead yields `342 / 407 = 84.03%`, still
above the unchanged gate. Timeout mutant IDs 317, 666, 668 and 669 concern the
condition traversal guard and low-confidence uncertainty checks; timeout is not
represented as an assertion-detected kill or an independently diagnosed defect.
Surviving and uncovered mutants remain test-strength limitations, not proof of
semantic correctness or automatic finding closure.

Local machine-readable mutation reports are emitted under
`.tmp/mutation-decision-guide.json` and
`.tmp/mutation-decision-recommendation.json`; they are local, uncommitted
artifacts. Both validator source hashes remained unchanged throughout mutation
execution. No operator exclusions, thresholds, worker limits or timeout settings
were relaxed. The mutation measurements precede the additional preflight tests
and the legacy schema-test strengthening; both production validator hashes are
unchanged. The final CI selection also includes the five preflight tests, so
these local scores are not represented as a new measurement of that expanded
selection. Final report editing changes documentation only.

## Assumptions, limitations, and handoff

This is a deliberately conservative validation contract. It may require
clarification where future context-sensitive ranking or conditional applicability
could support a useful result. It does not infer truth from prose, authenticate
confirmation declarations, or prove free-text entailment. Active-rule evidence
is checked against the supplied repository; the CLI additionally validates the
actual repository. Record revisions must obey governed version discipline.

The output is larger because decision support is explicit. No performance claim
is made for a large guide corpus. Conditional non-applicability of hard
constraints and score-based rejection remain future contract decisions, not
implicit exceptions. The guide must be revised or clarification used when these
conservative rules do not fit.

Files changed are the guide/session/recommendation schemas and registry, two
semantic validators, synthetic fixture helpers and regression suites, focused
Vitest mutation selections, this report, the kernel guide and documentation
index. Integrity output is regenerated by its command. Historical audit reports
are preserved. No production corpus, runtime, model integration, artifact
generator, identifier allocation or human-only lifecycle transition is created.

New implementation CI and separate re-audit must confirm the remediation before
M7.1 exit. Previous run #41 is baseline evidence only and is not represented as
validation of these changes.
