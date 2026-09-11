# M7.2 Output-Coverage Remediation

Status: proposed implementation handoff; not human content approval or an
independent audit. Date: 2026-09-10 (Asia/Jakarta).
Baseline: `9a21e019d85a458a796151437bd088c36201ce3b`.
Branch: `fix/m72-decision-output-coverage`.

## Scope and finding dispositions

Ansha Cerbia authorized focused continuation following the
[corpus audit](m7-2-corpus-audit-report.md). That audit is preserved unchanged.
This remediation changes contracts, validation, synthetic tests and documentation;
it does not change the three pilot guides, claims, source admission, lifecycle,
graph/retrieval semantics, benchmarks or thresholds. No assistant runtime, model
integration, generator, additional corpus or automatic decision approval is added.

| Finding | Implementation disposition |
| --- | --- |
| M7.2-AUD-001 | Addressed: explicit `inapplicable_options`, complete independently reconstructed rule evidence, and known-condition checks support complementary-option and reasoning-lens subsets without fabricated exclusion. |
| M7.2-AUD-002 | Addressed: statement-local `option_ids` preserve evidence applicability for each target; shared claims still need to cover every declared target. |
| M7.2-AUD-003 | Retained observation: structurally complete pilot matrices remain thin comparative evidence; no broader matrix quality asserted. |
| M7.2-AUD-004 | Retained observation: opaque guide lookup and single project-scope constraint binding remain bounded modeling choices. |
| M7.2-AUD-005 | Retained observation: no free-text entailment or human-confirmation authentication is implemented. |
| M7.2-AUD-006 | Retained observation: no real-provider or new guide-search quality evidence; old mutation timeouts are not erased by this focused run. |
| M7.2-AUD-007 | Retained observation: same-agent remediation is not independent review, and historical source-byte uncertainty remains. |

## Breaking contract migration

| Boundary | Before | After |
| --- | --- | --- |
| Recommendation `contract_version` | 3 | 4; old outputs fail rather than being silently coerced |
| Session `contract_version` | 3 | 3, unchanged |
| Guide `schema_version` / record `version` | 4 / 1 for pilot | Unchanged; no record migration |
| Schema registry `schema_version` | 6 | 7; status remains proposed |
| Draft, graph and retrieval contracts | Existing versions | Unchanged |

Migration requires producers to add `inapplicable_options` (empty when unused),
and nonempty unique `option_ids` to each trade-off, risk, verification and
evolution statement. All targets must be viable options in the current result.
Trade-offs and verification must each cover every viable option; one shared
statement or separate properly supported statements may supply that coverage.
Non-affirmative results have no viable targets, so these statement arrays must
be empty; clarification and uncertainty use their dedicated fields.
There is no automatic migration of an old rejected option: assess its current
rules and rebuild basis, claim/source inventories, snapshots and uncertainty.

## Applicability and evidence semantics

An affirmative result must account for every guide option exactly once:

- viable: at least one active selection rule and no active/unknown exclusion;
- rejected: active avoidance or disqualifier support remains required;
- inapplicable: at least one selection rule exists, every selection rule is
  false, every exclusion rule is false, and every condition of those rules is
  a known human-confirmed boolean. A false conjunct cannot hide an unknown one.

Inapplicability is not evidence that an option is unsafe, inferior or forbidden.
It is not an escape from missing context or evidence. Both applicable options
remain multiple viable options; neither applicable can produce non-affirmative
human clarification without manufacturing a winner. Ranking is not implemented.

For each inapplicable option, the validator requires its option binding and
all selection, avoidance and disqualifier bindings, including false ones.
The output does not control that required inventory. These bindings are evidence
for evaluating applicability, not assertions that their conditional conclusions
currently hold. Their exact transitive snapshots, admitted sources, locators,
epistemic labels and low-confidence uncertainty remain required.

An internally derived assertion closure separately follows all asserted bindings
and their ancestors. False or unknown conditions cannot support an affirmative
assertion even when a claim is also used by an inapplicable option. Callers cannot
set an exemption flag. Conditions remain structured exact matches, not free-text
semantic equivalence. `confirmed_by_human` remains supplied metadata, not verified
authentication. Free-text reasons and statements still require human review.

## Verification

| Local check | Result |
| --- | --- |
| Final full suite with coverage | 651 passed, 5 PostgreSQL tests skipped; 45 test files passed, 1 skipped. Coverage gates passed: 93.35% statements, 84.86% branches, 96.85% functions, 95.50% lines. Recommendation validator: 98.28% statements, 97.35% branches, 100% functions, 98.78% lines. |
| Plain `pnpm test` | Passed with 644 tests and 5 database skips before seven additional survivor-directed regressions; all 651 subsequently passed in the final full coverage run. |
| New focused regressions | 41 tests passed, including both standalone options/lenses, both/neither, invalid applicability classification, missing evidence, statement targeting, coverage, cross-option isolation, additional output evidence, exact uncertainty attribution and shared-ancestor condition enforcement. |
| CLI end-to-end | Valid v4 fixture accepted; invalid target rejected with exit 1 and stable diagnostic; no input values echoed, no input modifications or additional files. Existing argument/privacy cases also passed (4 tests total). |
| Typecheck and full repository validation | Passed; 0 errors and 0 warnings. |
| Graph/retrieval currentness | 13/13 graph and 2/2 retrieval artifacts current; no regeneration needed. |
| Formatting and diff checks | Passed. |
| Integrity | 13 deterministic reports regenerated by the generator; final Markdown, links and report currentness checks passed. |
| Mutation: initial changed-line run | Passed: 89.53%, 77 killed, 9 survived, 0 timeout, 0 no-coverage, 0 error; 81 mutations ignored by the existing mutator exclusions. |
| Mutation: supplemental survivor/range run | Passed after seven added regression cases: 100%, 26 killed, 0 survived, 0 timeout, 0 no-coverage, 0 error; 25 ignored by existing exclusions. This is a narrower overlapping run, not a 100% full-validator score. |

Full-validator local mutation was deliberately interrupted after 25/450
non-ignored mutants (estimated approximately 45 minutes remaining); it is
incomplete, not a pass. Existing full CI mutation scope, exclusions and 60%
threshold remain unchanged. The new 41-test file is included in that CI mutation
suite. No database-backed evaluation or real-provider call was run locally.

Reproducible mutation commands (line ranges refer to this implementation):

```powershell
pnpm exec stryker run stryker.decision-recommendation.config.json --mutate 'src/decision-recommendation-validator.ts:92-99,src/decision-recommendation-validator.ts:250-292,src/decision-recommendation-validator.ts:308-320,src/decision-recommendation-validator.ts:348-351,src/decision-recommendation-validator.ts:362-382,src/decision-recommendation-validator.ts:421-432,src/decision-recommendation-validator.ts:466-475'
pnpm exec stryker run stryker.decision-recommendation.config.json --mutate 'src/decision-recommendation-validator.ts:253-259,src/decision-recommendation-validator.ts:312-322,src/decision-recommendation-validator.ts:363-365,src/decision-recommendation-validator.ts:475-476'
```

The supplemental run includes line 321, outside the initial range endpoint,
and kills eight of the initial nine survivors: option-specific selection,
cross-option rule isolation, false parallel selection, conditions on additional
constraint/rejection evidence, and three uncertainty-attribution mutations.
The remaining initial survivor removes the assertion traversal's visited-set
early return. It causes duplicate visits on acyclic inputs; repository preflight
rejects cycles before this traversal. The guard remains in production. No claim
of exhaustive performance testing or a zero-survivor full-validator run is made.

Hosted Linux/Windows and PostgreSQL evidence for this new branch remains pending;
the successful baseline CI run is not evidence for these uncommitted changes.

The original audit appendix records the pre-fix failures. The migrated positive
fixtures now accept those legitimate subsets and option-local statements; the
negative cases still reject fabricated exclusions and broadened applicability.
Fixtures are synthetic project inputs over the unchanged real pilot records.
Their supplied truth values are test premises, not independent project evidence.

## File inventory and handoff

- Contracts: `schemas/decision-recommendation.schema.json`, `schemas/registry.json`.
- Implementation: `src/decision-recommendation-validator.ts`.
- New synthetic support: `tests/m7-2-output-helpers.ts`,
  `tests/m7-2-output-coverage.test.ts`.
- Migrated/extended tests: `tests/decision-recommendation-helpers.ts`,
  `tests/decision-guide.test.ts`, `tests/decision-validation-cli.test.ts`,
  `tests/m7-2-pilot.test.ts`, `tests/m7-output-regressions.test.ts`,
  `tests/m7-decision-basis-regressions.test.ts`.
- Mutation test inclusion: `vitest.decision-recommendation-mutation.config.ts`.
- Documentation: this report, `docs/m7-decision-guide-kernel.md`,
  `docs/kernel-decisions.md`, and `docs/README.md`.
- Retained prior work: `docs/m7-2-corpus-audit-report.md`, unchanged.
- Deterministic output: `generated/integrity/markdown-link-integrity.json`.

Next scope is exact-change CI and focused confirmation of these two dispositions,
not another broad corpus audit or runtime implementation. Human approval and any
expanded runtime/corpus authorization remain separate. No commit, push, PR, merge
or branch deletion has been performed in this remediation run.
