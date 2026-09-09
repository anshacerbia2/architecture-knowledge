# M7.1 Final Technical Re-Audit

## Decision and provenance

**M7.1 READY as a scoped technical exit recommendation.**

Audited SHA: `12aaeff178380c3a8475559595df9877cd37558f` on `main`.
Date: 2026-09-09 (Asia/Jakarta).
[PR #10](https://github.com/anshacerbia2/architecture-knowledge/pull/10) merged
implementation commit `a349819e1fdc5f55adf710ebcac34466bcbb05c4`.
The merge and implementation trees are identical (`git diff --exit-code a349819 HEAD`).
The starting tracked worktree was clean.

M7.1-AUD-002, 005, 011 and 012 are closed for the reproduced scoped defects.
Earlier closures remain supported. Unresolved implementation findings:
**Critical 0, High 0, Medium 0, Low 0**. Four observations remain (007-010).
No new blocking implementation defect was identified in this pass.

This is a separate adversarial pass by the implementing assistant, not an
externally independent reviewer attestation. Technical closure does not satisfy
a requirement for a distinct reviewer by itself. Human acceptance and any
required independent reviewer confirmation remain separate. This report neither
approves M7.1 on behalf of Ansha Cerbia nor authorizes corpus, runtime, model
integration or artifact generation. No governed content becomes reviewed,
published or canonical.

## Scope and method

Read the [original audit](m7-1-independent-audit-report.md),
[focused re-audit](m7-1-focused-reaudit-report.md),
[remediation report](m7-1-decision-basis-remediation-report.md), current
guide/session/recommendation schemas, validator changes and unchanged surrounding
checks, semantic CLI, roadmap boundary, tests and CI evidence.

The audit harness below uses the synthetic guide/model builders but constructs
its own session, output, separate selection claim/source and expected decision
basis. It does not import the recommendation fixture, test assertions, condition
key helper or production decision-basis projection to compute expected outcomes.
All 30 assertions passed with exit code 0. This strengthens reproducibility
without implying independent authorship or representative corpus quality.

The fixtures exercise component APIs. They do not constitute new registered
knowledge, source admissions, ledger allocations or a fabricated corpus that
passed the full repository gate. The CLI additionally validates the actual
repository. The production decision-guide corpus remains empty.

## One-to-one dispositions

| Finding | Final scoped disposition | Evidence and boundary |
| --- | --- | --- |
| M7.1-AUD-001 | Closed; retained | Full suite retains overlap, partition, hard-constraint, cardinality and conflicting-rule regressions. Standalone probes reject overlap, omitted alternatives and singleton multiple-option status. |
| M7.1-AUD-002 | Closed | Independently reconstructed mandatory basis defeats coordinated omission of pointers, claims, sources, snapshots and uncertainty. Distinct low-confidence selection support is required even when output prose cites another claim. Transitive conditions, locators and snapshots are enforced. |
| M7.1-AUD-003 | Closed; retained | Current full suite retains matrix coordinate, value/scale/unit and explicit unknown/not-applicable controls; measurement implementation was not changed by this remediation. |
| M7.1-AUD-004 | Closed; retained | Standalone graph/retrieval/citation probe rejects the selection-only source for an options unit, accepts it for the selection unit, and rejects unqualified record-level source resolution. Existing split-binding and projection tests pass. |
| M7.1-AUD-005 | Closed | Structural scope/reference identity is preserved by the guide gate and session confirmation lookup. Different valid condition references with the same prose do not substitute. Genuine edge-local conditions and normalized whitespace remain valid. Committed tests additionally cover set ordering, substitution, subset and case changes. |
| M7.1-AUD-006 | Resolved at the kernel consumption boundary | All active selection/exclusion rules are retained in the basis. Active or unknown exclusions block affirmative viable options. Rejection requires an active exclusion rather than arbitrary removal of an alternative. Deliberate guide conflicts still coexist. |
| M7.1-AUD-007 | Retained bounded observation | Exact epistemic snapshots and low-confidence uncertainty now cover mandatory and transitive evidence. Free-text entailment and the relationship between claim confidence and decision uncertainty remain content-review concerns, not automatically proven by validation. |
| M7.1-AUD-008 | Deferred runtime observation | Confirmation flags and provider authorization objects are declarations, not authentication. Actor authority, expiry/time ordering, provider/purpose, guide policy, classification and redaction must be enforced at future egress. No provider/runtime is introduced. |
| M7.1-AUD-009 | Deferred terminology/lookup observation | Decide guide human-key policy before a sizable corpus, with coordinated migration if required. Opaque AKG identifiers remain stable. |
| M7.1-AUD-010 | Retained evidence-limit observation | Non-empty guides are synthetic; live-provider quality and runtime behavior remain unmeasured. Same-assistant audit provenance and mutation exclusions remain explicit. |
| M7.1-AUD-011 | Closed | Probes reject unresolved required drivers, mismatched roles, duplicate drivers and attempts to promote preferences to required hard constraints. Committed positive controls cover all four declared roles and reject undeclared membership. |
| M7.1-AUD-012 | Closed | Both empty-context clarification and insufficient-evidence results pass without invented support; relabeling those objects affirmative fails. Non-affirmative status cannot retain viable options. |

All twelve prior audit IDs have a disposition. No observation is counted as a
closed implementation defect merely because CI is green.

## Adversarial results

| Probe group | Observed outcome |
| --- | --- |
| Valid distinct selection support, reordered basis, normalized whitespace | Accepted without diagnostics. |
| Omitted selection pointer; wrong pointer family | `DR_DECISION_BASIS`. |
| Coordinated removal of pointer, claim, source, snapshot and uncertainty | `DR_DECISION_BASIS`, `DR_CLAIM_INVENTORY`, `DR_SOURCE_INVENTORY`, `DR_EVIDENCE_SNAPSHOT`, `DR_UNCERTAINTY_LOST`. |
| Missing uncertainty, blank locator, changed evidence confidence | Respectively `DR_UNCERTAINTY_LOST`, `DR_SOURCE_LOCATOR_MISSING`, `DR_EVIDENCE_SNAPSHOT`. |
| Coordinated stale session/output guide versions | `DR_GUIDE_VERSION`. |
| False or unconfirmed selection condition; same-prose different identity | Eligibility fails; substituted identity additionally gives `DR_CONDITION_INVENTORY`. |
| Unconfirmed transitive prerequisite, then fully restored confirmation | `DR_CLAIM_CONDITION`, then accepted. |
| Unknown/mistyped/duplicated driver; required preference | Stable driver diagnostics, including `DR_DRIVER_REQUIRED_HARDNESS`. |
| Overlap, omitted option, dangling prose claim, automation approval, singleton multiple status | Rejected by semantic or schema gate. |
| Empty-context clarification and insufficient-evidence; affirmative relabeling | Both non-affirmative controls accepted; both relabeled controls rejected. |
| Guide condition scope substitution | `DG_CLAIM_CONDITION_LOST`. |
| Selection-only source offered as options evidence | Denied; section-local positive control accepted. |

These are executable outcomes, not a proof that arbitrary natural-language
claims are entailed. The policy deliberately prefers clarification over
unimplemented score-based ranking or conditional exceptions to hard constraints.
Session drivers and supplied confirmations are not independently discovered
real-world requirements. The repository passed to the reusable API is input
data, not an attestation.

## Exact-SHA hosted evidence

[Run #43](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34317990118)
is completed/success, attempt 1, event push, on the exact audited merge SHA.
API job/step metadata and decoded raw logs were inspected. All four checkout
logs record the exact SHA; all expected steps succeeded.

| Job ID | Job | Verified raw-log evidence |
| --- | --- | --- |
| 102358176541 | validate (ubuntu-latest) | Frozen install, formatting, repository/graph/retrieval/integrity gates, 574 tests passed with 4 DB tests skipped, coverage gates passed. |
| 102358176211 | validate (windows-latest) | Same gates; 574 tests passed with 4 DB tests skipped; coverage gates passed. |
| 102358176416 | retrieval-integration | PostgreSQL/pgvector migration/index/currentness, 15 integration/query tests passed, 46-case retrieval evaluation and 23-case RAG evaluation with empty failures and passed=true, benchmark and query/answer smoke execution. |
| 102358176464 | mutation | All six configured targets completed above their unchanged 60% thresholds, including final expanded M7 preflight test selection. |

Both OS coverage logs report statements 93.05%, branches 84.22%, functions
96.38%, lines 95.36%. Database skip counts in the OS matrix are separated from
the actual PostgreSQL integration job. Fake/deterministic providers supply
functional evidence, not live-provider semantic quality.

| Mutation target | Total score | Killed | Timeout | Survived | No coverage | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| Legacy | 77.42% | 1056 | 120 | 294 | 49 | 0 |
| Graph | 83.41% | 953 | 2 | 162 | 28 | 0 |
| Retrieval | 71.92% | 595 | 7 | 216 | 19 | 0 |
| RAG | 75.41% | 910 | 1 | 281 | 16 | 0 |
| Decision guide | 80.00% | 164 | 0 | 38 | 3 | 0 |
| Decision recommendation | 84.52% | 344 | 0 | 61 | 2 | 0 |

Stryker counts timed-out mutants as detected. The two decision targets have
zero timeouts in this hosted run, unlike the earlier local implementation
measurement. These hosted results supersede that measurement for exact-SHA
handoff. Surviving/uncovered mutants and configured operator exclusions remain
limits; scores are not completeness proofs.

## Local validation and mutation discipline

| Check | This audit result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed in an initially clean existing tracked worktree, not a newly cloned checkout. Existing ignored esbuild build-script warning retained; no dependency upgrade performed. |
| `pnpm validate` | Strict typecheck plus ten validation categories passed, 0 errors and 0 warnings. |
| `pnpm format:check` | Passed. |
| `pnpm graph:check` | 13/13 current. |
| `pnpm retrieval:units:check` | 2/2 current. |
| `pnpm report:check` | 13/13 current before report creation. |
| `pnpm test:coverage` | Full suite passed, exit 0; coverage 93.05/84.22/96.38/95.36%, all gates passed. Database integration remains skipped locally. |
| `pnpm exec tsx .tmp/m7-1-final-audit-probes.ts` | 30 audit assertions passed, exit 0. |
| Mutation/evaluation rerun policy | No redundant local mutation or DB evaluation run: new exact-SHA hosted raw logs supply those results. No local database provisioned and no live model call authorized or made. |

No source, test assertion, schema, threshold, mutation exclusion or governed
knowledge was changed to make an audit probe pass. Only this report and the
deterministically regenerated Markdown integrity inventory are deliverables.
The standalone ignored harness is included below for reproducibility.
No commit, push, PR, merge, branch operation or roadmap/lifecycle transition
was performed during this audit.

## Finalization and next boundary

After report creation, deterministic integrity regeneration and final
`pnpm validate` passed with 0 errors and 0 warnings; `pnpm report:check`
reported 13/13 current and `git diff --check` passed. The only tracked
modification is the Markdown integrity inventory; this report is newly added.
The technical blocker set is empty for the audited scope. A distinct reviewer
can reproduce the supplied probes and inspect exact-SHA hosted evidence without
repeating every expensive mutation run. Human acceptance of M7.1 and explicit
authorization of the next bounded scope remain required. Resolve guide lookup
policy before a sizable corpus; define and enforce runtime privacy/authority
and uncertainty boundaries before any provider or assistant runtime work.

## Reproduction appendix

At the audited SHA, after frozen pnpm installation, save the following as
`.tmp/m7-1-final-audit-probes.ts` and run the command above. The `any`
annotations are restricted to deliberate mutations in this audit harness.

```typescript
import assert from 'node:assert/strict';
import { guideModel } from '../tests/decision-guide-helpers.js';
import { recordFromData } from '../tests/helpers.js';
import { validateDecisionRecommendation } from '../src/decision-recommendation-validator.js';
import { validateDecisionGuides } from '../src/decision-guide-validator.js';
import { buildGraphArtifacts } from '../src/graph-projector.js';
import { buildRetrievalArtifacts } from '../src/retrieval-units.js';
import { createRagCitationAuthority } from '../src/rag-citation-authority.js';

// Audit-only synthetic component harness. No production fixture/assertion constructor.
const model = await guideModel();
const guide = model.decisionGuides[0]!.data as any;
const a = model.claims[0]!.data as any;
a.confidence = 'high';
a.source_locations = [{source_id:'AKS-900001',locator:'Synthetic comparison'}];
const condition = {statement:'Separate synthetic selection prerequisite',scope:'edge-local',concept_ids:[]};
const source = recordFromData({...structuredClone(model.sources[0]!.data),id:'AKS-900002',url:'https://example.com/audit-selection'},'tests/fixtures/synthetic/audit-source.yaml');
const b = recordFromData({...structuredClone(a),id:'AKL-900002',confidence:'low',conditions:[condition],sources:[source.id],source_locations:[{source_id:source.id,locator:'Synthetic selection'}]},'tests/fixtures/synthetic/audit-selection.yaml');
model.sources.push(source); model.claims.push(b); model.records.push(source,b);
guide.evidence.push(b.id);
guide.recommended_when = [{option_id:'AKC-900004',rationale:'Synthetic selection',conditions:[condition],claim_ids:[b.id]}];
guide.avoid_when = [{option_id:'AKC-900001',rationale:'Synthetic exclusion',conditions:structuredClone(a.conditions),claim_ids:[a.id]}];
const authority = {recommendation_only:true,human_decision_required:true,automation_may_approve:false};
const session:any = {
  contract_version:3,guide_version:1,session_id:'22222222-2222-4222-8222-222222222222',guide_id:guide.id,
  context:[{key:'classification',value:'two',classification:'internal',provenance:'human-provided',confirmed_by_human:true}],
  drivers:[],constraints:[{concept_id:'AKC-900005',satisfied:true,notes:null}],
  condition_evaluations:[...a.conditions,condition].map(c=>({condition:structuredClone(c),satisfied:true,confirmed_by_human:true})),
  privacy:{persistence:'ephemeral-only',external_provider_authorized:false,external_provider_authorization:null,redacted_keys:[]},authority,
};
const statement={statement:'Synthetic bounded comparison',claim_ids:[a.id]};
const output:any = {
  contract_version:3,guide_version:1,session_id:session.session_id,guide_id:guide.id,status:'recommendation',
  applicable_context:structuredClone(session.context),
  constraint_results:[{concept_id:'AKC-900005',hardness:'hard',status:'satisfied',rationale:'Synthetic',claim_ids:[a.id]}],
  viable_options:['AKC-900004'],rejected_options:[{concept_id:'AKC-900001',reason:'Synthetic exclusion',claim_ids:[a.id]}],
  tradeoffs:[structuredClone(statement)],risks:[],verification:[structuredClone(statement)],evolution_triggers:[],
  claim_ids:[a.id,b.id],source_ids:['AKS-900001',source.id],evidence_claims:[structuredClone(a),structuredClone(b.data)],
  uncertainty:[{statement:'Selection evidence uncertain',basis:'low-confidence',claim_ids:[b.id]}],authority,
  decision_basis:['/options/0','/options/1','/constraints/0','/assumptions/0','/recommended_when/0','/disqualifiers/0','/avoid_when/0'].map(guide_pointer=>({guide_pointer,claim_ids:[guide_pointer==='/recommended_when/0'?b.id:a.id]})),
};
const base={model,session,output};
const check=async(f:any)=>(await validateDecisionRecommendation(f.model,f.session,f.output)).map(d=>d.code);
const rows:any[]=[];
async function probe(name:string,mutate:(f:any)=>void,expected:string|null=null) {
  const f=structuredClone(base); mutate(f); const codes=await check(f);
  if(expected) assert.ok(codes.includes(expected),name+': '+JSON.stringify(codes));
  else assert.deepEqual(codes,[],name);
  rows.push({name,codes:[...new Set(codes)]}); return f;
}
await probe('distinct-selection-positive',()=>{});
for(const [name,mutate,code] of [
  ['selection-pointer-omitted',f=>f.output.decision_basis.splice(4,1),'DR_DECISION_BASIS'],
  ['coordinated-selection-omission',f=>{f.output.decision_basis.splice(4,1);f.output.claim_ids.pop();f.output.source_ids.pop();f.output.evidence_claims.pop();f.output.uncertainty=[];},'DR_CLAIM_INVENTORY'],
  ['selection-uncertainty-omitted',f=>f.output.uncertainty=[],'DR_UNCERTAINTY_LOST'],
  ['selection-locator-blank',f=>{f.model.claims[1].data.source_locations[0].locator=' ';f.output.evidence_claims[1]=structuredClone(f.model.claims[1].data);},'DR_SOURCE_LOCATOR_MISSING'],
  ['selection-snapshot-tampered',f=>f.output.evidence_claims[1].confidence='high','DR_EVIDENCE_SNAPSHOT'],
  ['coordinated-stale-guide-version',f=>{f.session.guide_version=2;f.output.guide_version=2;},'DR_GUIDE_VERSION'],
  ['wrong-pointer-family',f=>f.output.decision_basis[4].guide_pointer='/avoid_when/0','DR_DECISION_BASIS'],
  ['selection-condition-false',f=>f.session.condition_evaluations[1].satisfied=false,'DR_RECOMMENDATION_NOT_APPLICABLE'],
  ['selection-condition-unconfirmed',f=>f.session.condition_evaluations[1].confirmed_by_human=false,'DR_RECOMMENDATION_NOT_APPLICABLE'],
  ['same-prose-other-condition-reference',f=>{f.session.condition_evaluations[1].condition.scope='reusable-concept';f.session.condition_evaluations[1].condition.concept_ids=['AKC-900005'];},'DR_CONDITION_INVENTORY'],
  ['unresolved-required-driver',f=>f.session.drivers=[{concept_id:'AKC-999999',role:'constraint',priority:'required'}],'DR_DRIVER_UNRESOLVED'],
  ['wrong-driver-role',f=>f.session.drivers=[{concept_id:'AKC-900005',role:'quality-attribute',priority:'high'}],'DR_DRIVER_TYPE'],
  ['required-preference',f=>{f.session.drivers=[{concept_id:'AKC-900005',role:'constraint',priority:'required'}];f.model.decisionGuides[0].data.constraints[0].hardness='preference';f.output.constraint_results[0].hardness='preference';},'DR_DRIVER_REQUIRED_HARDNESS'],
  ['duplicate-driver',f=>f.session.drivers=[1,2].map(()=>({concept_id:'AKC-900005',role:'constraint',priority:'high'})),'DR_DRIVER_DUPLICATE'],
  ['option-overlap',f=>f.output.rejected_options[0].concept_id='AKC-900004','DR_OPTION_PARTITION'],
  ['option-omission',f=>f.output.rejected_options=[],'DR_OPTION_OMITTED'],
  ['dangling-prose-and-root',f=>{f.output.tradeoffs[0].claim_ids=['AKL-999999'];f.output.claim_ids.push('AKL-999999');},'DR_CLAIM_UNRESOLVED'],
  ['automation-approval',f=>f.output.authority.automation_may_approve=true,'SCHEMA_INSTANCE'],
  ['singleton-multiple-status',f=>f.output.status='multiple-viable-options','SCHEMA_INSTANCE'],
] as [string,(f:any)=>void,string][]) await probe(name,mutate,code);
await probe('basis-order-does-not-matter',f=>f.output.decision_basis.reverse());
await probe('whitespace-normalized-confirmation',f=>f.session.condition_evaluations[1].condition.statement='  Separate   synthetic selection prerequisite  ');
const parent=structuredClone(base) as any;
const prerequisite={statement:'Synthetic transitive prerequisite',scope:'edge-local',concept_ids:[]};
const c=recordFromData({...structuredClone(b.data),id:'AKL-900003',conditions:[prerequisite]},'tests/fixtures/synthetic/audit-parent.yaml');
parent.model.claims.push(c);parent.model.records.push(c);
parent.model.claims[1].data.sources=[];parent.model.claims[1].data.source_locations=[];parent.model.claims[1].data.derived_from_claims=[c.id];
parent.output.evidence_claims=parent.model.claims.map(x=>structuredClone(x.data));parent.output.uncertainty[0].claim_ids.push(c.id);
assert.ok((await check(parent)).includes('DR_CLAIM_CONDITION'));rows.push({name:'transitive-unconfirmed',rejected:true});
parent.session.condition_evaluations.push({condition:prerequisite,satisfied:true,confirmed_by_human:true});
assert.deepEqual(await check(parent),[]);rows.push({name:'transitive-restored',accepted:true});
for(const status of ['needs-human-clarification','insufficient-evidence']) {
  const f=structuredClone(base);f.session.context=[];f.session.constraints[0].satisfied=null;
  Object.assign(f.output,{status,applicable_context:[],viable_options:[],rejected_options:[],tradeoffs:[],verification:[],claim_ids:[],source_ids:[],evidence_claims:[],decision_basis:[],uncertainty:[{statement:'Need context',basis:'unknown-context',claim_ids:[]}]});
  f.output.constraint_results[0].status='unknown';f.output.constraint_results[0].claim_ids=[];
  assert.deepEqual(await check(f),[]);rows.push({name:status+'-empty-positive',accepted:true});
  f.output.status='recommendation';assert.ok((await check(f)).includes('SCHEMA_INSTANCE'));rows.push({name:status+'-affirmative-negative',rejected:true});
}
const identity=structuredClone(base);const g=identity.model.decisionGuides[0]!.data as any;
g.recommended_when[0].conditions=[{...condition,scope:'reusable-concept',concept_ids:['AKC-900005']}];
assert.ok(validateDecisionGuides(identity.model).diagnostics.some(d=>d.code==='DG_CLAIM_CONDITION_LOST'));rows.push({name:'guide-scope-identity',rejected:true});
const graph=buildGraphArtifacts(base.model);const units=buildRetrievalArtifacts(graph).units;const auth=createRagCitationAuthority(graph);
const option=units.find(u=>u.record_id===guide.id&&u.section_key==='options')!;
const selection=units.find(u=>u.record_id===guide.id&&u.section_key==='recommended_when')!;
assert.equal(auth.resolve(guide.id,source.id,option.unit_id),undefined);assert.ok(auth.resolve(guide.id,source.id,selection.unit_id));assert.equal(auth.resolve(guide.id,source.id),undefined);
rows.push({name:'graph-retrieval-citation-isolation',passed:true});
console.log(JSON.stringify({probe_count:rows.length,rows},null,2));
```
