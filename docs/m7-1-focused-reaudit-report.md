# M7.1 Focused Re-Audit After Kernel Hardening

## Exit decision

**M7.1 NOT READY for corpus or runtime entry.**

Audited SHA: `c34daabe984aa7f22597610b3b56d91c01fed753` on `main`.
Audit date: 2026-09-08 (Asia/Jakarta). The starting tracked worktree was clean.

Three original Medium findings are closed in this scoped pass. M7.1-AUD-002
remains open: evidence closure does not include the rules actually used to
justify selecting an option. One original Low finding is only partially
remediated; two additional Low findings concern session references and
clarification output. Unresolved counts: **Critical 0, High 0, Medium 1,
Low 3**. Four observations remain as bounded limitations.

This is another adversarial review within the implementing conversation.
It is not an externally independent reviewer attestation. The decision is based
on reproduced component behavior and verified CI logs, not a new approval of
knowledge or permission to begin the next milestone.

## Evidence and scope

Reviewed the [original audit](m7-1-independent-audit-report.md),
[hardening report](m7-1-hardening-report.md), M7.0 entry requirements, migrated
schemas, semantic guide and recommendation gates, CLI, graph/retrieval
projection, citation authority, regression tests, coverage and mutation
configuration, and the committed workflow.

The additional probes use the committed synthetic guide builder, with a new
standalone session/output constructor and explicit positive/negative controls.
They execute the actual schema and semantic APIs from the audited commit.
They do not use test assertions as the definition of correctness.

These are synthetic component-boundary reproductions. Supporting concept
fixtures are deliberately minimal; no claim is made that an invented corpus,
ledger, or lifecycle history passed every repository gate. The repository has
zero production guides. The CLI's full repository gate and future
authentication are separate from the demonstrated semantic API behavior.

## Findings and required dispositions

### M7.1-AUD-002 — Medium — Selection evidence is outside output closure

**Partially remediated, remains open; blocks exit.**

The original dangling nested claim is rejected, including a coordinated update
of the root inventory. Exact snapshots, applicable claim targets, source
admission, locators, and transitive conditions are enforced for evidence that
the output elects to bind. The missing boundary is the evidence for the actual
selection rule.

In [the recommendation validator](../src/decision-recommendation-validator.ts),
lines 190–205 determine eligibility using `recommended_when`, avoidance, and
disqualifier conditions. Lines 218–225 collect roots only from output constraint
results, rejected-option reasons, trade-offs, risks, verification, and evolution
triggers. There is no mandatory selection-basis reference tying the viable option
to its guide rule's `claim_ids`. The later transitive/snapshot/uncertainty checks
therefore never inspect omitted selection evidence.

Reproduction:

1. Keep the valid synthetic affirmative recommendation, with option AKC-900004.
2. Let all output prose and constraint/rejection bindings use high-confidence
   claim A / source A.
3. Bind the only applicable recommendation rule for AKC-900004 to distinct
   low-confidence claim B / source B. Both records are in the supplied model,
   the claim is in the guide inventory, and its rule condition is confirmed.
4. Omit B from output claim IDs, source IDs, snapshots, and uncertainty.

The full recommendation schema-plus-semantic API returns **zero diagnostics**.
The output names only A / source A and contains no uncertainty. This is
structural omission of a decision basis, not a free-text entailment judgment.

Two further variants also return zero diagnostics:

- Remove the selection claim B's locator.
- Derive B from sourced claim C with a separate, unconfirmed parent condition,
  while retaining B/C outside the output evidence inventory.

Controls establish the active enforcement path: binding B into output
verification and adding its inventory/source/snapshot causes
`DR_UNCERTAINTY_LOST`; adding its low-confidence uncertainty restores validity.
The defect is not that the uncertainty validator rejects every result or that
the fixture has no admitted evidence.

Required focused remediation:

- Represent the used selection/rejection basis explicitly, bound to the current
  guide and its version, or define an equivalent deterministic rule-selection
  contract. Validate the reference before collecting supporting evidence.
- Include the actual decision basis and applicable mandatory bindings in the
  root evidence closure, with their transitive conditions, locators, snapshots,
  and uncertainty. Do not solve this by attaching all unrelated guide evidence.
- Test independent and coordinated omissions; distinct claims/sources for
  selection, comparison, and rejection; multiple applicable rules; conditional
  parent evidence; missing locators; and fully valid restoration controls.
- Retain the original dangling-claim, snapshot and source-admission regressions.

### M7.1-AUD-005 — Low — Condition type is checked, identity is not preserved

**Partially remediated; remains open, non-blocking alone.**

[Guide validation](../src/decision-guide-validator.ts), lines 278–293 and
352–369, still reduces the claim-condition comparison to normalized statement
strings. The new recursive type check correctly rejects an architectural-pattern
used as a reusable condition.

However, a claim condition referencing constraint AKC-900005 and a rule condition
referencing assumption AKC-900006 with identical text pass the guide schema and
semantic validator. Replacing reusable scope with edge-local scope while keeping
the same text is likewise not distinguished by the comparison logic; only the
different-reference variant was executed in this pass.

The report's executed control replaces the reference with pattern AKC-900001 and
receives `DG_CONCEPT_TYPE`. Both existence/type checking and structured identity
preservation are needed; one cannot substitute for the other.

The recommendation gate's exact condition identity check is a compensating
control when the relevant evidence is inside its closure. AUD-002 shows why that
cannot be treated as general guide-level closure.

Required disposition: preserve `scope` and the canonical concept-reference set
as well as text, or implement an explicit governed equivalence rule. Retain
genuine edge-local conditions and do not claim string equality proves entailment.

### M7.1-AUD-011 — Low — Required session drivers are not resolved

**New; open, non-blocking alone for this runtime-free kernel.**

[Session schema](../schemas/decision-session.schema.json), `drivers`, accepts
a driver with `concept_id: AKC-999999`, `role: constraint`,
`priority: required`. The concept is absent from the synthetic model.
The recommendation semantic API returns zero diagnostics for the otherwise
valid affirmative result. The validator never reads `session.drivers`.

This does not prove an actual user requirement was discarded by a running
assistant, because no M7 runtime exists. It does mean semantic validation of the
session is incomplete: a future caller could mistake an ignored required driver
for a resolved constraint. The validated guide's declared hard constraints
continue to be checked.

Required disposition: validate driver reference existence, role/type consistency,
and duplicates; define the relationship between required constraint drivers and
the guide/session constraint inventory. An unsupported driver should produce a
diagnostic or an explicit non-affirmative disposition, not silent acceptance.

### M7.1-AUD-012 — Low — No-context clarification cannot satisfy the contract

**New; open, non-blocking alone.**

The session contract permits an empty `context` array. A recommendation repeats
the exact session context, but its `applicable_context` has unconditional
`minItems: 1` in the
[recommendation schema](../schemas/decision-recommendation.schema.json).

With empty context, `status: needs-human-clarification`, no viable options,
and otherwise valid evidence/uncertainty, the semantic API returns
`SCHEMA_INSTANCE`. Inventing a context entry would violate the exact session
comparison. Thus the initial no-context clarification path cannot produce a
valid result.

Required disposition: allow empty applicable context for the relevant
non-affirmative statuses, while retaining the existing required/confirmed
context rules for affirmative recommendations. Add an empty-context positive
clarification and negative affirmative pair. Treat schema changes as migrations.

## One-to-one disposition of every audit item

| Finding | Result at the audited SHA |
| --- | --- |
| M7.1-AUD-001 | Closed for the original exploits. Overlapping options, hard unknowns, singleton multiple-option status, omitted options/constraints and contradictory active rules are rejected; valid and multiple-option controls pass. |
| M7.1-AUD-002 | Partially remediated; Medium remains open. Supplied nested evidence is checked, but evidence for selecting an option can be omitted. |
| M7.1-AUD-003 | Closed. Quantitative string/currency mismatch is rejected; scale/unit/null/ordinal cases and matrix completeness regressions pass. |
| M7.1-AUD-004 | Closed for the audited guide attribution boundary. Two-source isolation, per-binding splits, policy/overview separation, and transitive support pass. Guide-wide source membership alone cannot authorize a unit citation. |
| M7.1-AUD-005 | Partially remediated; Low remains open. Type boundary works; structured reference identity is still lost by string-only comparison. |
| M7.1-AUD-006 | Resolved for kernel consumption. Active or unresolved avoidance/disqualifier rules block an affirmative viable option; conflicting guide knowledge remains represented. |
| M7.1-AUD-007 | Retained observation. Included evidence preserves epistemic snapshots and low-confidence uncertainty. The omitted decision-basis case is counted under AUD-002, not as a second Medium. Confidence, uncertainty and free-text entailment still require a defined content-review boundary. |
| M7.1-AUD-008 | Deferred runtime observation. Provider identity, authorization time/expiry, classifications and egress must be enforced where future provider calls occur. No caller-supplied confirmation is authentication. |
| M7.1-AUD-009 | Deferred observation. Human lookup key policy must be decided before a sizable guide corpus; opaque identity remains stable. |
| M7.1-AUD-010 | Retained observation. Non-empty guides are synthetic, no live-provider quality is measured, and this conversation is not independent reviewer provenance. |
| M7.1-AUD-011 | New Low: required session-driver references can remain unresolved. |
| M7.1-AUD-012 | New Low: empty-context human clarification cannot pass the output contract. |

The four Medium findings from the original audit each have an explicit outcome.
No original Low finding or observation was omitted, and observations are not
silently counted as closed implementation defects.

## Hosted verification at the exact SHA

[GitHub Actions run #41](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34195058628)
is `completed/success`, attempt 1, event `push`, for
`c34daabe984aa7f22597610b3b56d91c01fed753`.
GitHub API metadata and decoded raw logs were fetched during this re-audit.
Each job's checkout log contains the exact audited SHA.

| Job ID | Job | Verified evidence |
| --- | --- | --- |
| 101960862539 | validate (ubuntu-latest) | All 16 steps succeeded; frozen install, formatting, repository/artifact gates, tests and coverage. Logs show 522 passed / 4 DB-skipped tests. |
| 101960862609 | validate (windows-latest) | All 16 steps succeeded; same validation boundary and 522 passed / 4 DB-skipped tests. |
| 101960862341 | mutation | All 14 steps succeeded; legacy, graph, retrieval, RAG and both decision validators executed. |
| 101960862555 | retrieval-integration | All 20 steps succeeded; pgvector/PostgreSQL migration, indexing, currentness, 15 integration/query tests, 46-case retrieval evaluation, 23-case RAG evaluation, benchmark and both smoke commands. |

The hosted retrieval and RAG evaluation logs report `passed: true` and empty
gate failures. Their provider configuration is deterministic/fake. This is
functional and regression evidence; it does not measure live-provider quality.

Mutation values below were read from the exact-SHA job log, not copied from an
earlier handoff or inferred from a green job icon:

| Boundary | Total score | Killed | Timed out | Survived | No coverage | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| Legacy | 78.80% | 1019 | 178 | 273 | 49 | 0 |
| Graph | 83.41% | 953 | 2 | 162 | 28 | 0 |
| Retrieval | 71.92% | 595 | 7 | 216 | 19 | 0 |
| RAG | 75.41% | 910 | 1 | 281 | 16 | 0 |
| Decision guide | 78.43% | 160 | 0 | 41 | 3 | 0 |
| Decision recommendation | 80.52% | 248 | 0 | 58 | 2 | 0 |

Stryker counts timed-out mutants as detected; those counts are not represented
as assertion-killed mutants here. The two decision validators independently
exceed their unchanged 60% thresholds without timeouts. Operator exclusions
remain configured, and mutation scores do not establish semantic completeness.
Local mutation was not repeated in this re-audit because fresh exact-SHA
hosted execution and raw numerical evidence were accessible.

## Local validation

| Check | Observed result |
| --- | --- |
| Frozen pnpm install | Passed in the initially clean tracked workspace; it was not a newly cloned checkout. Existing ignored esbuild build-script warning retained. |
| Formatting | Passed. |
| Full validation and strict typecheck | Passed before report creation: ten categories, 0 errors/warnings. |
| Graph currentness | 13/13 current. |
| Retrieval currentness | 2/2 current. |
| Integrity currentness | 13/13 current before report creation; deterministic regeneration and final checks are recorded below. |
| Full suite through `pnpm test:coverage` | 39 files passed, 522 tests passed; 1 database file / 4 tests skipped. |
| Coverage | 92.97% statements, 84.02% branches, 96.28% functions, 95.27% lines. |
| Standalone adversarial probes | Exit 0: positive controls and intended rejection controls matched; acceptance gaps documented above reproduced. |

The new probes are intentionally outside the committed test suite. Their exit 0
means the asserted audit observations reproduced, not that all inputs were safe.
No implementation, test expectations, thresholds, timeout policy, provider, or
governed content was modified to obtain these results.

No local database was provisioned and database evaluations were not repeated
locally. Local skipped tests are reported separately from the verified hosted
PostgreSQL job. No live model call occurred.

Finalization checks after report creation passed: `pnpm validate` (including
Markdown and link validation) returned 0 errors and 0 warnings;
`pnpm report:check` reported 13/13 current after deterministic regeneration;
`git diff --check` passed. The only tracked change was the Markdown integrity
inventory, with this new report untracked. The audited HEAD remained unchanged.

## Next run and change boundary

Remediate AUD-002 at the decision-basis-to-evidence boundary, with targeted
regressions for the independently varied claims, rules, source locators and
transitive conditions above. Address the three Low findings in the same bounded
kernel run, or record explicit reasoned dispositions. Preserve scope, schema
migration discipline and positive controls. Then run affected coverage/mutation
gates and verify CI for the new SHA before another re-audit.

Corpus, assistant runtime, model integration, and ADR/RFC/PAD generation remain
outside the current authorization. CI success does not grant entry or perform
a human lifecycle transition.

This audit creates this report and regenerates the deterministic Markdown
integrity inventory. The ignored local probe script is retained for reproduction;
its exact source is included below. No commit, push, PR, merge, branch deletion,
or governed-content change is part of this audit.

## Reproduction appendix

Save the following as `.tmp/m7-1-reaudit-probes.ts` in a checkout of the audited
SHA, after `pnpm install --frozen-lockfile`, then run:

```bash
pnpm exec tsx .tmp/m7-1-reaudit-probes.ts
```

The `any` annotations are confined to this deliberately mutated audit harness.
Assertions include valid controls and checks that each stated acceptance or
rejection is actually observed.

```typescript
import assert from 'node:assert/strict';
import { guideModel } from '../tests/decision-guide-helpers.js';
import { recordFromData } from '../tests/helpers.js';
import { validateDecisionRecommendation } from '../src/decision-recommendation-validator.js';
import { validateDecisionGuides } from '../src/decision-guide-validator.js';
import { validateSchemas } from '../src/schema-validator.js';
import { buildGraphArtifacts } from '../src/graph-projector.js';
import { buildRetrievalArtifacts } from '../src/retrieval-units.js';
import { createRagCitationAuthority } from '../src/rag-citation-authority.js';

// Audit-only synthetic boundary probes. No production files are changed.
async function fixture() {
  const model = await guideModel();
  const guide = model.decisionGuides[0]!.data as any;
  const claim = model.claims[0]!.data as any;
  claim.source_locations = [{source_id:'AKS-900001', locator:'Synthetic paragraph'}];
  const bound = {conditions: structuredClone(claim.conditions), claim_ids:[claim.id]};
  guide.recommended_when = [{option_id:'AKC-900004', rationale:'Synthetic selection', ...bound}];
  guide.avoid_when = [{option_id:'AKC-900001', rationale:'Synthetic avoidance', ...bound}];
  const authority = {recommendation_only:true, human_decision_required:true, automation_may_approve:false};
  const session:any = {
    contract_version:2, session_id:'11111111-1111-4111-8111-111111111111', guide_id:guide.id,
    context:[{key:'classification', value:'one', classification:'internal', provenance:'human-provided', confirmed_by_human:true}],
    drivers:[], constraints:[{concept_id:'AKC-900005', satisfied:true, notes:null}],
    condition_evaluations:claim.conditions.map((condition:any)=>({condition:structuredClone(condition), satisfied:true, confirmed_by_human:true})),
    privacy:{persistence:'ephemeral-only',external_provider_authorized:false,external_provider_authorization:null,redacted_keys:[]}, authority,
  };
  const statement = {statement:'Synthetic bounded assessment',claim_ids:[claim.id]};
  const output:any = {
    contract_version:2,session_id:session.session_id,guide_id:guide.id,status:'recommendation',
    applicable_context:structuredClone(session.context),
    constraint_results:[{concept_id:'AKC-900005',hardness:'hard',status:'satisfied',rationale:'Synthetic',claim_ids:[claim.id]}],
    viable_options:['AKC-900004'],rejected_options:[{concept_id:'AKC-900001',reason:'Synthetic exclusion',claim_ids:[claim.id]}],
    tradeoffs:[structuredClone(statement)],risks:[],verification:[structuredClone(statement)],evolution_triggers:[],
    uncertainty:[{statement:'Synthetic low confidence',basis:'low-confidence',claim_ids:[claim.id]}],
    claim_ids:[claim.id],source_ids:['AKS-900001'],evidence_claims:[structuredClone(claim)],authority,
  };
  return {model,guide,claim,session,output};
}
const base = await fixture();
const check = async (f:typeof base) => (await validateDecisionRecommendation(f.model,f.session,f.output)).map(d=>d.code);
const rows:any[] = [];
assert.deepEqual(await check(base),[]);
rows.push({probe:'valid-control',codes:[]});
for(const [name, mutate] of [
  ['overlap',(f:any)=>f.output.rejected_options[0].concept_id='AKC-900004'],
  ['hard-unknown',(f:any)=>{f.session.constraints[0].satisfied=null; f.output.constraint_results[0].status='unknown';}],
  ['multiple-singleton',(f:any)=>f.output.status='multiple-viable-options'],
  ['dangling-claim',(f:any)=>{f.output.tradeoffs[0].claim_ids=['AKL-999999'];f.output.claim_ids.push('AKL-999999');}],
  ['approval',(f:any)=>f.output.authority.automation_may_approve=true],
] as const){const f=structuredClone(base); mutate(f); const codes=await check(f);assert.ok(codes.length);rows.push({probe:name,codes:[...new Set(codes)]});}

// A selection rule uses a different low-confidence claim/source from output prose.
const omitted = structuredClone(base);
omitted.claim.confidence='high';
omitted.output.evidence_claims=[structuredClone(omitted.claim)];
omitted.output.uncertainty=[];
const sourceB=recordFromData({...structuredClone(omitted.model.sources[0]!.data),id:'AKS-900002',url:'https://example.com/selection-only'},'tests/fixtures/synthetic/source-b.yaml');
const conditionB={statement:'Synthetic selection prerequisite.',scope:'edge-local',concept_ids:[]};
const claimB=recordFromData({...structuredClone(omitted.claim),id:'AKL-900002',confidence:'low',conditions:[conditionB],sources:[sourceB.id],source_locations:[{source_id:sourceB.id,locator:'Synthetic selection rule'}]},'tests/fixtures/synthetic/claim-b.yaml');
omitted.model.sources.push(sourceB); omitted.model.claims.push(claimB); omitted.model.records.push(sourceB,claimB);
omitted.guide.evidence.push(claimB.id);
omitted.guide.recommended_when=[{option_id:'AKC-900004',rationale:'Selection requires the separate low-confidence claim',conditions:[conditionB],claim_ids:[claimB.id]}];
omitted.session.condition_evaluations.push({condition:conditionB,satisfied:true,confirmed_by_human:true});
const omissionCodes=await check(omitted);
assert.deepEqual(omissionCodes,[]);
rows.push({probe:'selection-rule-evidence-omitted',codes:omissionCodes,selection_claim:claimB.id,output_claims:omitted.output.claim_ids,output_sources:omitted.output.source_ids,output_uncertainty:omitted.output.uncertainty});
const restored=structuredClone(omitted);
restored.output.verification.push({statement:'Verify selection basis',claim_ids:[claimB.id]});
restored.output.claim_ids.push(claimB.id);restored.output.source_ids.push(sourceB.id);restored.output.evidence_claims.push(structuredClone(claimB.data));
assert.ok((await check(restored)).includes('DR_UNCERTAINTY_LOST'));
rows.push({probe:'selection-claim-bound-control',codes:await check(restored)});
restored.output.uncertainty.push({statement:'Selection evidence is uncertain',basis:'low-confidence',claim_ids:[claimB.id]});
assert.deepEqual(await check(restored),[]);
rows.push({probe:'selection-claim-restored-control',codes:[]});
const unlocated=structuredClone(omitted);
delete unlocated.model.claims[1]!.data.source_locations;
assert.deepEqual(await check(unlocated),[]);
rows.push({probe:'selection-rule-locator-omitted',codes:[]});
const transitive=structuredClone(omitted);
const parent=recordFromData({...structuredClone(claimB.data),id:'AKL-900003',conditions:[{statement:'Synthetic parent prerequisite is not confirmed.',scope:'edge-local',concept_ids:[]}]},'tests/fixtures/synthetic/claim-c.yaml');
transitive.model.claims.push(parent);transitive.model.records.push(parent);
transitive.model.claims[1]!.data.derived_from_claims=[parent.id];
transitive.model.claims[1]!.data.sources=[];transitive.model.claims[1]!.data.source_locations=[];
assert.deepEqual(await check(transitive),[]);
rows.push({probe:'selection-transitive-condition-unconfirmed',codes:[],parent_condition:parent.data.conditions});

// Identical statement with different governed concept references.
const scope = structuredClone(base);
scope.claim.conditions[0]={...scope.claim.conditions[0],scope:'reusable-concept',concept_ids:['AKC-900005']};
scope.guide.recommended_when[0].conditions=[{...scope.claim.conditions[0],concept_ids:['AKC-900006']}];
const scopeCodes=validateDecisionGuides(scope.model).diagnostics.map(d=>d.code);
assert.deepEqual(scopeCodes,[]);
const scopeSchema=await validateSchemas({...scope.model,governedFiles:[{path:scope.model.decisionGuides[0]!.path,absolutePath:scope.model.root+'/tests/fixtures/synthetic/AKG-900001.yaml',format:'yaml',schemaRef:'schemas/decision-guide.schema.json',data:scope.guide}]});
assert.deepEqual(scopeSchema.diagnostics,[]);
rows.push({probe:'same-text-different-condition-identity',codes:scopeCodes,claim:structuredClone(scope.claim.conditions[0]),rule:structuredClone(scope.guide.recommended_when[0].conditions[0])});
scope.guide.recommended_when[0].conditions[0].concept_ids=['AKC-900001'];
assert.ok(validateDecisionGuides(scope.model).diagnostics.some(d=>d.code==='DG_CONCEPT_TYPE'));
rows.push({probe:'wrong-condition-type-control',codes:['DG_CONCEPT_TYPE']});

const drivers=structuredClone(base);
drivers.session.drivers=[{concept_id:'AKC-999999',role:'constraint',priority:'required'}];
assert.deepEqual(await check(drivers),[]);
rows.push({probe:'unresolved-required-driver',codes:[],driver:drivers.session.drivers[0]});
const empty=structuredClone(base);
empty.session.context=[];empty.output.applicable_context=[];empty.output.status='needs-human-clarification';empty.output.viable_options=[];
const emptyCodes=await check(empty);assert.ok(emptyCodes.includes('SCHEMA_INSTANCE'));
rows.push({probe:'empty-context-clarification',codes:emptyCodes});

const matrix=structuredClone(base);
matrix.guide.evaluation_criteria[0].scale='quantitative';matrix.guide.evaluation_criteria[0].unit='milliseconds';
matrix.guide.tradeoff_matrix[0].assessment.value='fast';matrix.guide.tradeoff_matrix[0].assessment.unit='USD';
assert.ok(validateDecisionGuides(matrix.model).diagnostics.some(d=>d.code==='DG_MEASUREMENT_INCOMPATIBLE'));
rows.push({probe:'matrix-mismatched-unit',codes:['DG_MEASUREMENT_INCOMPATIBLE']});
const graph=buildGraphArtifacts(omitted.model);const units=buildRetrievalArtifacts(graph).units;const auth=createRagCitationAuthority(graph);
const option=units.find(u=>u.record_id===omitted.guide.id&&u.section_key==='options')!;
const selected=units.find(u=>u.record_id===omitted.guide.id&&u.section_key==='recommended_when')!;
assert.equal(auth.resolve(omitted.guide.id,sourceB.id,option.unit_id),undefined);
assert.ok(auth.resolve(omitted.guide.id,sourceB.id,selected.unit_id));
assert.equal(auth.resolve(omitted.guide.id,sourceB.id),undefined);
rows.push({probe:'two-source-isolation',option_sources:option.citations.map(c=>c.source_id),selection_sources:selected.citations.map(c=>c.source_id),wrong_section_denied:true});
console.log(JSON.stringify(rows,null,2));
```
