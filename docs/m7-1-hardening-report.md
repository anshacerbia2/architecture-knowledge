# M7.1 Focused Kernel Hardening

Status: proposed implementation handoff, not independent audit clearance.
Date: 2026-09-06. Baseline: `16494552acf04d951aab29b92dbbd3b07d125e15`.

## Scope and authority

Ansha Cerbia authorized remediation after the scoped M7.1 audit. This run changes
validation contracts, their projections, tests, and documentation only. It does
not author a guide corpus, implement an assistant runtime or provider integration,
persist sessions, generate ADR/RFC/PAD artifacts, or promote lifecycle content.
Passing validation is not a human decision, authentication, or approval.

The earlier [audit report](m7-1-independent-audit-report.md) is preserved as
historical evidence. This implementation report does not independently close its
findings. The same implementing assistant performed the earlier audit pass.

## Migration and design decisions

| Boundary | Change and compatibility |
| --- | --- |
| Schema registry | Version 4 to 5, still proposed. |
| Reusable guide | Schema version 2 to 3. Measurement compatibility and reusable-condition type rules are tightened. No production instances exist. |
| Ephemeral session | Contract 1 to 2. Adds explicit condition evaluations with known/unknown values and confirmation declarations. No persistence or new identifier namespace. |
| Recommendation | Contract 1 to 2. Includes exact evidence claim snapshots, including transitive dependencies. Adds status/cardinality/hard-constraint schema guards plus a semantic gate. |
| Retrieval generator | Version 2 to 3. Rebuild deterministic units and any database generation; row shape and database schema stay unchanged. |
| Graph | Contract remains 2. No node/edge shape change; currentness artifacts are regenerated if their input fingerprint changes. |
| Draft artifact | Remains contract 1, draft-only. No generator is implemented. |

V1 sessions/recommendations are not silently coerced or supplied with invented
confirmations. Callers must construct v2 inputs explicitly and rerun the gate.
Guide v2 authors must verify measurement metadata before setting version 3.
All fixtures remain synthetic and excluded from repository knowledge discovery.

### Recommendation semantic gate

`validateDecisionRecommendation(model, session, recommendation)` is a read-only
validator. It validates the input schemas, guide/evidence semantics and shapes,
then cross-checks the guide, session, and output. It neither generates an answer
nor calls a model. Its model argument is supplied data, not an authenticity token.

The CLI additionally loads and validates the actual repository before inspecting
the two caller-supplied JSON files:

```bash
pnpm decision:validate -- session.json recommendation.json
```

The CLI returns nonzero on invalid input and emits only diagnostic codes,
severity, and pointers. It does not echo private context, save input copies,
write reports, or modify the repository. An invalid invocation or read/parse
failure produces a generic error. No production guide means no production
recommendation can pass yet; non-empty success cases are synthetic tests.

Affirmative output requires disjoint, declared viable/rejected options and a
complete accounting of alternatives. A single recommendation has one viable
option; multiple-viable-options has at least two. Required context must match the
session and guide declaration, including value type, sensitivity, and declared
confirmation. Constraint results must match the complete guide/session inventory
and cannot demote hardness. Missing or unsatisfied hard constraints prevent an
affirmative status. Preferences do not silently become hard constraints.

Condition truth is supplied explicitly in the session, not inferred from prose
by this kernel. The validator checks known condition identities and computes
rule conjunctions. A viable option needs a satisfied recommendation rule and
no satisfied or unknown avoidance/disqualifier rule. Conflicting rules remain
in the guide; they cannot silently produce an affirmative choice. Missing or
unconfirmed evaluations stay unknown. This is consistency checking against
declared inputs, not proof of their real-world truth or the human's identity.

For this bounded kernel, all declared hard constraints must be satisfied before
an affirmative result. Conditional non-applicability is not silently inferred;
it requires a later explicit contract extension or a non-affirmative result.
No universal scoring or free-text condition evaluator is introduced.

Every material output binding must name applicable guide claims. Nested root IDs
must exactly match `claim_ids`; transitive sources must exactly match `source_ids`.
Each source must be admitted and have a nonblank locator on its supporting claim.
The complete `evidence_claims` snapshots must exactly match the current model,
preserving type, confidence, conditions, scope, normative qualifiers, and version.
Snapshots are copies of evidence, not new claims or lifecycle transitions.
Transitive evidence is checked, including low-confidence uncertainty references.
Unknown conditions cannot be converted to an affirmative assessment.

Global trade-off/risk/verification/evolution statements are conservatively checked
against every viable option. If later output needs option-local statements, add
an explicit scoped binding contract rather than weakening applicability checks.
Free-text entailment and architectural judgment still require content review.

### Matrix and retrieval

Quantitative assessments require a finite numeric value and an exact match to the
criterion's nonblank unit. Qualitative/ordinal assessments cannot smuggle numeric
scores or units into the comparison. Unknown/not-applicable cells retain null
measurements and explicit uncertainty. There is no implicit conversion or numeric
aggregation. Reusable condition references resolve to constraint, assumption,
or context-condition concepts; genuine edge-local text remains permitted.

Guide sections are chunked per evidence-bearing binding. Each binding's chunks
carry only its direct and transitive claim/source support. `binding_pointer`
identifies the originating binding; long text does not borrow an adjacent
binding's evidence. Overview and policy units have no supporting citations.
Whole-guide claim/source IDs remain separately labeled as `guide_provenance_*`
metadata, and the full graph retains record-level provenance.

Guide citation authority now requires the exact retrieval unit ID and reconstructs
allowed unit/source pairs from the graph using the deterministic projector.
A guide-wide source ID alone cannot authorize a section citation. Existing
non-guide citation authority remains unchanged. Reindex existing retrieval
databases after deterministic generation because generator version changed.

Trade-offs: exact snapshots increase output size and must be refreshed when the
governed claims change. Strict condition identity can reject a semantically
equivalent paraphrase; copying the current structured condition is the supported
path. Conservative eligibility can yield clarification instead of a choice.
These costs avoid inventing conversions, context, or evidence. Guide citation
authority reconstructs units in memory, so large-corpus cost remains unmeasured.
Deployment must reindex before querying the new retrieval generation; existing
currentness gates detect a stale generation instead of silently mixing versions.

## One-to-one audit disposition

| Finding | Implementation disposition; independent confirmation still required |
| --- | --- |
| M7.1-AUD-001 | Remediated by option partition, status cardinality, exact context/constraint binding, and eligibility conditions. Includes hard-unknown, hardness downgrade, omitted alternative, and conflicting-rule regressions. |
| M7.1-AUD-002 | Remediated by schema-plus-semantic output gate, exact evidence inventory and snapshots, admitted transitive source locators, applicability and uncertainty preservation. CLI validates repository inputs first. |
| M7.1-AUD-003 | Remediated by scale/value/unit compatibility, explicit null unknown/not-applicable cells, and nonnumeric ordinal handling. |
| M7.1-AUD-004 | Remediated by binding-local citations, separate guide provenance, and unit-bound citation authority. Two-source, long-binding, policy, and transitive evidence tests added. |
| M7.1-AUD-005 | Included: reusable condition references have an explicit type boundary. No requirement to promote edge-local text. |
| M7.1-AUD-006 | Conflicting guide rules are retained but block an affirmative eligible option when active or unresolved. No conflict is silently resolved. |
| M7.1-AUD-007 | Exact claim snapshots preserve epistemic labels and qualifiers; low-confidence derivation evidence requires an explicit uncertainty reference. No claim that confidence and decision uncertainty are interchangeable. Guide assessment uncertainty vocabulary still needs later content review. |
| M7.1-AUD-008 | Deferred runtime boundary: no egress, authentication, clock-based expiry enforcement, or provider authorization execution exists. Session declarations cannot establish permission to send data. |
| M7.1-AUD-009 | Deferred non-blocker: active-guide human_key remains unresolved before a sizable corpus. No identifier migration inferred. |
| M7.1-AUD-010 | Retained: no production corpus, live provider measurement, or independent reviewer provenance is claimed. |

## Validation evidence

The audit's matrix exploit was added as a regression test and failed against the
unmodified validator before the fix. The prior report records the other original
accepted exploits with an exact-SHA reproduction. New negative cases test both
isolated and coordinated metadata changes; positive cases prevent closing the
boundary merely by rejecting every input.

Local coverage and mutation
are run sequentially to avoid the contention observed in the prior audit. Existing
Linux/Windows CI executes the expanded tests and coverage, and the focused
decision-guide mutation command now includes the recommendation validator. The
retrieval mutation target now covers the whole retrieval-unit module instead of
line ranges that would miss part of the extended guide projector.
No threshold or timeout has been relaxed.

The first combined two-validator mutation invocation was stopped early because
each guide mutant also selected the expensive output-schema tests. It is not
reported as a pass. The same command now runs two component mutation invocations
sequentially: the complete guide validator with guide/matrix tests, then the
complete recommendation validator with output regressions. Each must independently
meet 60%, rather than one score hiding a weaker component. Full integration tests
remain in the normal coverage suite; no source mutation operator exclusion or
score threshold was added to accelerate this run.

| Local gate | Result |
| --- | --- |
| Frozen pnpm install | Passed; no dependency changes. Existing esbuild build-script warning retained, not approved automatically. |
| Full validation and strict typecheck | Passed; ten categories, 0 errors/warnings. |
| Formatting | Passed. |
| Full test suite through coverage | 39 files passed, 522 tests passed; 1 database file / 4 tests skipped. |
| Coverage | 92.97% statements, 84.02% branches, 96.28% functions, 95.27% lines. |
| Recommendation validator coverage | 97.39% statements, 96.29% branches, 100% functions, 98.19% lines. |
| Graph currentness | 13/13 current. |
| Retrieval currentness | 2/2 current. |
| Integrity currentness | 13/13 current after deterministic regeneration. |
| Guide mutation | Passed: 78.43% total / 79.60% covered; 160 killed, 41 survived, 3 no coverage, 0 timeout/error. |
| Recommendation mutation | Passed: 80.52% total / 81.05% covered; 248 killed, 58 survived, 2 no coverage, 0 timeout/error. Independent 60% threshold passed. |

During development, AJV strict mode caught missing array type declarations in a
new conditional schema; these were corrected without relaxing strict mode.
Tests also caught a shared-array alias in the synthetic multi-option fixture and
a CLI table-test typing error. Those fixtures were corrected; no production
validator was weakened to satisfy them. Final suite and typecheck results above
are from the corrected implementation.

Local database integration was skipped because no retrieval database was
configured. No new clean-checkout or hosted exact-SHA result is claimed, and no
live provider call was made. Required hosted evidence remains a handoff gate.
Legacy, graph, focused RAG, and focused retrieval mutation commands were not
rerun locally in this remediation. Their new exact-SHA hosted steps remain
required; prior scores are not reused as evidence for these changes.

The sequential mutation command completed with exit code 0. Guide mutation took
about 14 minutes and recommendation mutation about 42 minutes on this Windows
host. These scores measure the configured operators/tests, not exhaustive
semantic correctness; surviving and uncovered mutants are retained in the local
reports under `.tmp/`. No commit, push, PR, merge, or branch operation was performed.

## File inventory

- New implementation: [recommendation validator](../src/decision-recommendation-validator.ts)
  and [read-only validation CLI](../src/decision-validation-cli.ts).
- Changed implementation: `decision-guide-validator.ts`, `retrieval-units.ts`,
  `retrieval-types.ts`, `rag-citation-authority.ts`, `rag-context.ts`, and
  `rag-types.ts` under `src/`.
- Contracts: the guide, session, recommendation schemas and `schemas/registry.json`.
- Tests: new matrix, output, retrieval and CLI regression suites, a shared synthetic
  guide helper extracted from the existing test, and updated guide/retrieval/citation
  tests. No fixture is a production decision guide.
- Quality gates: `package.json`, `vitest.config.ts`, two focused Vitest mutation
  configs, two decision-validator Stryker configs, and the widened retrieval config.
  The existing CI workflow invokes these commands on its existing jobs.
- Documentation: this report, `docs/m7-decision-guide-kernel.md`, `docs/README.md`,
  and root `AGENTS.md`. The pre-existing uncommitted audit report is preserved.
- Deterministic outputs: Markdown integrity inventory and retrieval manifest.
  Graph and retrieval generators were run; unchanged outputs were not hand-edited.

## Next boundary

After local gates, preserve the implementation through the normal human-controlled
commit/PR workflow, verify new exact-SHA hosted Linux/Windows and database results,
and request a separate focused re-audit. Old green CI is not evidence for these
uncommitted changes. Corpus/runtime entry remains ungranted by this report.
