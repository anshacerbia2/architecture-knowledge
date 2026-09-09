# M7.1 Second-Reviewer Confirmation

## Technical decision and authority boundary

**M7.1 READY as a scoped technical exit recommendation.**

Reviewed SHA: `d8dfe281d744f2fb03cc78b42fee48eb8a16aa8a`.
Date: 2026-09-09 (Asia/Jakarta). The starting tracked worktree was clean.
The implementation, schema, test, dependency and CI boundary is unchanged from
`12aaeff178380c3a8475559595df9877cd37558f`; intervening changes only preserve
the [technical re-audit report](m7-1-final-technical-reaudit-report.md) and
deterministic Markdown inventory.

The user authorized continuation to the previously stated distinct-reviewer
confirmation. Reviewer agent `m71_second_review` received a fresh context
without this conversation's implementation history. It inspected repository
instructions, source, contracts, earlier finding reports, tests and its own
adversarial probes. The primary agent separately verified current hosted
evidence and local repository/artifact gates and compiled this report.

This is a distinct AI reviewer pass, not an externally independent organization,
human reviewer, or human milestone approval. The same project artifacts and
synthetic repository builder remain shared evidence. No stronger independence
is claimed. Explicit acceptance by Ansha Cerbia and authorization of any next
scope remain separate. No M7.2, corpus, runtime, model integration or artifact
generator work is authorized by this recommendation.

Result: **0 unresolved Critical, High, Medium or Low implementation findings**
in this scoped review; **4 retained observations**. No new reproducible
implementation defect was identified.

## One-to-one finding confirmation

| Finding | Second-reviewer disposition |
| --- | --- |
| M7.1-AUD-001 | Closed; retained. Overlap, omitted alternatives, hard-unknown and cardinality probes reject invalid eligibility; focused tests retain valid multiple-option controls. |
| M7.1-AUD-002 | Closed. Mandatory basis reconstruction precedes output inventory checking. Coordinated omission is rejected with basis, claim/source inventory, snapshot and uncertainty diagnostics. Distinct selection support, transitive restoration and locator/snapshot controls produce their expected outcomes. |
| M7.1-AUD-003 | Closed; retained. All 11 focused matrix regressions pass. |
| M7.1-AUD-004 | Closed; retained. Selection-only evidence cannot authorize either options binding, an unqualified record-level citation, or a forged unit ID. The correct section citation resolves. |
| M7.1-AUD-005 | Closed. Condition identity retains normalized case-sensitive text, scope and reference set. Same-text reference substitutions and conflicting duplicate confirmations fail; whitespace normalization remains accepted. |
| M7.1-AUD-006 | Resolved for kernel consumption. Active and unknown exclusions block affirmative eligibility; justified rejection and parallel active-rule regressions pass. |
| M7.1-AUD-007 | Retained observation. Evidence snapshots/uncertainty are preserved, but free-text entailment and claim-confidence-to-decision-uncertainty interpretation require content review. |
| M7.1-AUD-008 | Deferred runtime observation. Caller confirmation and authorization declarations are not authentication or egress enforcement. No provider/runtime is implemented. |
| M7.1-AUD-009 | Deferred lookup-policy observation. Decide guide human-key policy before a sizable corpus, with coordinated migration if changed. |
| M7.1-AUD-010 | Retained evidence/provenance observation. Synthetic fixtures, shared builder and no live-provider evaluation limit the claim; this distinct AI pass is not external human review. |
| M7.1-AUD-011 | Closed. Unresolved, mistyped, undeclared, duplicated and required-preference drivers are rejected. Independent positive controls for all four roles pass. |
| M7.1-AUD-012 | Closed. Both empty-intake non-affirmative statuses pass without invented evidence. Affirmative relabeling and retained viable options fail. |

The reviewer inspected mandatory-basis reconstruction and root derivation in
[the recommendation validator](../src/decision-recommendation-validator.ts)
(lines 251 and 334 at the reviewed SHA), driver checks (142-164), condition
lookup (220-226), structured condition preservation in
[the guide validator](../src/decision-guide-validator.ts) (281 and 500),
status-conditional cardinality in
[the recommendation schema](../schemas/decision-recommendation.schema.json)
(125 and 166), and the unit-local resolution boundary in
[citation authority](../src/rag-citation-authority.ts) (69-83).

## Reviewer-executed evidence

- Standalone harness: **41 probe groups passed, exit 0**. Expected session,
  output and decision basis were independently assembled; the recommendation
  fixture and production basis/key helpers were not used as expectation oracles.
  Each recommendation API probe also checks that input objects remain unchanged.
- Focused regression execution: **8 files, 130 tests passed, exit 0**.
  Files: decision-guide, decision-validation-cli, m7-output-regressions,
  m7-retrieval-regressions, m7-preflight-regressions, m7-matrix-regressions,
  m7-decision-basis-regressions and m7-condition-identity.
- CLI negative probe: two syntactically valid but schema-invalid JSON objects
  produced expected exit 1 and `SCHEMA_INSTANCE`, with no synthetic secret
  marker in diagnostic output.

The reviewer ran:

```bash
pnpm exec tsx .tmp/m71-second-review/probes.ts
pnpm test -- tests/decision-guide.test.ts tests/decision-validation-cli.test.ts tests/m7-output-regressions.test.ts tests/m7-retrieval-regressions.test.ts tests/m7-preflight-regressions.test.ts tests/m7-matrix-regressions.test.ts tests/m7-decision-basis-regressions.test.ts tests/m7-condition-identity.test.ts
pnpm decision:validate -- .tmp/m71-second-review/malformed-session.json .tmp/m71-second-review/malformed-output.json
```

The two CLI probe files each contain
`{"private_marker":"REVIEW_SECRET_MUST_NOT_APPEAR_2384"}`.
That is a synthetic test marker, not user data. The application serializer omits
messages and values; pnpm still echoes command arguments. Diagnostic redaction
does not promise filesystem-path confidentiality. The CLI performs the full
repository gate before reading supplied JSON, but no nonempty production guide
corpus was fabricated to claim an end-to-end accepted CLI case.

Harness SHA-256:
`CFC39CC8453A115F74DC279852091127A8B0F1B0AB160B60C7056B48E212C3A2`.
The primary agent verified this against the local harness file. The source
appears in the appendix so the ignored temporary files are not the sole record
of how to reproduce the review.

## Primary-agent hosted and artifact verification

[Run #45](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34338945815)
is completed/success, attempt 1, at the exact reviewed SHA. All four expected
jobs and steps succeeded. Decoded raw logs were retrieved and contain that SHA.

| Job ID | Boundary | Raw-log evidence |
| --- | --- | --- |
| 102424898084 | Linux validation | 574 tests passed / 4 DB tests skipped; coverage 93.05% statements, 84.22% branches, 96.38% functions, 95.36% lines. |
| 102424898064 | Windows validation | Same test counts and coverage; all repository/artifact gates passed. |
| 102424897819 | PostgreSQL/pgvector | 15 integration/query tests passed; retrieval and RAG evaluation gates passed with empty failures. |
| 102424897665 | Mutation | All six configured targets passed; decision guide 80.00%, recommendation 84.52%, both with zero timeouts. |

Decision-guide mutation: 164 killed, 38 survived, 3 uncovered. Recommendation:
344 killed, 61 survived, 2 uncovered. Both report zero errors. Other configured
scores: legacy 76.89%, graph 83.41%, retrieval 71.92%, RAG 75.41%. Those legacy
targets include timeouts in detected counts; they are not assertion-only kill
rates. Configured thresholds and operator exclusions are unchanged.

The primary agent reran `pnpm validate` (0 errors/warnings),
`pnpm graph:check` (13/13 current), `pnpm retrieval:units:check` (2/2 current),
`pnpm report:check` (13/13 current) and `git diff --check`, all successfully.
No redundant local full coverage/mutation or database evaluation was run in this
confirmation: the exact-SHA hosted raw evidence covers those gates. The reviewer
did not separately re-fetch hosted logs; that evidence belongs to the primary
agent's verification, not the reviewer's independent execution.

## Handoff and finalization

This report and deterministic Markdown integrity inventory are the only
repository deliverables. The reviewer added three ignored temporary probe
files. No implementation, committed tests, schemas, knowledge, roadmap,
lifecycle, branch, commit, push or PR was changed during this confirmation.

After report creation, deterministic regeneration and `pnpm validate` passed
with 0 errors and 0 warnings; `pnpm report:check` reported 13/13 current and
`git diff --check` passed. Final Markdown/link checks also passed.
The distinct AI technical review step is complete. Human milestone acceptance
is still pending; no further semantic re-audit is implied merely by a
documentation-only handoff of this result. Any newly changed executable boundary
or new defect evidence requires proportionate review. A next-scope proposal must
retain the four observations and explicitly define its corpus/runtime boundary.

## Reproduction appendix

Save this source as `.tmp/m71-second-review/probes.ts` in the reviewed checkout
with locked pnpm dependencies installed. The `any` annotations are confined to
deliberately mutated synthetic probe data. Run the first command above.

```typescript
import assert from 'node:assert/strict';
import { guideModel } from '../../tests/decision-guide-helpers.js';
import { recordFromData } from '../../tests/helpers.js';
import { validateDecisionRecommendation } from '../../src/decision-recommendation-validator.js';
import { validateDecisionGuides } from '../../src/decision-guide-validator.js';
import { buildGraphArtifacts } from '../../src/graph-projector.js';
import { buildRetrievalArtifacts } from '../../src/retrieval-units.js';
import { createRagCitationAuthority } from '../../src/rag-citation-authority.js';

// Reviewer-authored synthetic API probes: expected basis is enumerated independently.
const model = await guideModel();
const g: any = model.decisionGuides[0]!.data;
const a: any = model.claims[0]!.data;
a.confidence = 'high';
a.source_locations = [{source_id: 'AKS-900001', locator: 'Synthetic A paragraph'}];
const separate = {statement:'Selection prerequisite.',scope:'edge-local',concept_ids:[]};
const source = recordFromData({...structuredClone(model.sources[0]!.data), id:'AKS-900002',url:'https://example.com/separate-review-selection'}, 'tests/fixtures/synthetic/review-source.yaml');
const b = recordFromData({...structuredClone(a),id:'AKL-900002',confidence:'low',conditions:[separate],sources:[source.id],source_locations:[{source_id:source.id,locator:'Synthetic B paragraph'}]}, 'tests/fixtures/synthetic/review-claim.yaml');
model.sources.push(source); model.claims.push(b); model.records.push(source,b);
g.evidence.push(b.id);
g.recommended_when = [{option_id:'AKC-900004',rationale:'Synthetic selection',conditions:[separate],claim_ids:[b.id]}];
g.avoid_when[0].option_id = 'AKC-900001';
const authority = {recommendation_only:true,human_decision_required:true,automation_may_approve:false};
const session:any = {contract_version:3,guide_version:1,session_id:'44444444-4444-4444-8444-444444444444',guide_id:g.id,context:[{key:'classification',value:'one',classification:'internal',provenance:'human-provided',confirmed_by_human:true}],drivers:[],constraints:[{concept_id:'AKC-900005',satisfied:true,notes:null}],condition_evaluations:[...a.conditions,separate].map(condition=>({condition:structuredClone(condition),satisfied:true,confirmed_by_human:true})),privacy:{persistence:'ephemeral-only',external_provider_authorized:false,external_provider_authorization:null,redacted_keys:[]},authority};
const statement = {statement:'Synthetic scoped output',claim_ids:[a.id]};
const output:any = {contract_version:3,guide_version:1,guide_id:g.id,session_id:session.session_id,status:'recommendation',applicable_context:structuredClone(session.context),constraint_results:[{concept_id:'AKC-900005',hardness:'hard',status:'satisfied',rationale:'Synthetic constraint',claim_ids:[a.id]}],viable_options:['AKC-900004'],rejected_options:[{concept_id:'AKC-900001',reason:'Synthetic exclusion',claim_ids:[a.id]}],tradeoffs:[statement],risks:[],verification:[statement],evolution_triggers:[],uncertainty:[{statement:'Selection evidence remains uncertain',basis:'low-confidence',claim_ids:[b.id]}],claim_ids:[a.id,b.id],source_ids:['AKS-900001',source.id],evidence_claims:[structuredClone(a),structuredClone(b.data)],decision_basis:[...['/options/0','/options/1','/constraints/0','/assumptions/0','/disqualifiers/0','/avoid_when/0'].map(guide_pointer=>({guide_pointer,claim_ids:[a.id]})),{guide_pointer:'/recommended_when/0',claim_ids:[b.id]}],authority};
const base:any = {model,session,output};
const rows:any[]=[];
async function run(name:string, mutate:(f:any)=>void, expected:string[] = []) {
  const f = structuredClone(base); mutate(f);
  const before=structuredClone(f);
  const ds=await validateDecisionRecommendation(f.model,f.session,f.output);
  const codes=[...new Set(ds.map(d=>d.code))];
  if(expected.length) for(const code of expected) assert.ok(codes.includes(code),`${name}: missing ${code}; got ${codes}`);
  else assert.deepEqual(codes,[],name);
  assert.deepEqual(f,before,`${name}: mutated inputs`);
  rows.push({name,codes});
}
await run('independently assembled distinct-selection control',()=>{});
await run('coordinated selection omission',f=>{f.output.decision_basis=f.output.decision_basis.filter(x=>x.guide_pointer!='/recommended_when/0');f.output.claim_ids=[a.id];f.output.source_ids=['AKS-900001'];f.output.evidence_claims=[structuredClone(a)];f.output.uncertainty=[];},['DR_DECISION_BASIS','DR_CLAIM_INVENTORY','DR_SOURCE_INVENTORY','DR_EVIDENCE_SNAPSHOT','DR_UNCERTAINTY_LOST']);
await run('pointer duplicate with different claim',f=>f.output.decision_basis.push({guide_pointer:'/recommended_when/0',claim_ids:[a.id]}),['DR_DECISION_BASIS']);
await run('basis permutations',f=>f.output.decision_basis.reverse());
await run('missing selection uncertainty',f=>f.output.uncertainty=[],['DR_UNCERTAINTY_LOST']);
await run('blank selection locator',f=>{f.model.claims[1].data.source_locations[0].locator=' \t ';f.output.evidence_claims[1]=structuredClone(f.model.claims[1].data);},['DR_SOURCE_LOCATOR_MISSING']);
await run('epistemic snapshot upgrade',f=>f.output.evidence_claims[1].confidence='high',['DR_EVIDENCE_SNAPSHOT']);
await run('coordinated stale guide versions',f=>{f.session.guide_version=2;f.output.guide_version=2;},['DR_GUIDE_VERSION']);
for(const state of [false,null]) await run(`selection truth ${state}`,f=>f.session.condition_evaluations[1].satisfied=state,['DR_RECOMMENDATION_NOT_APPLICABLE']);
await run('selection unconfirmed',f=>f.session.condition_evaluations[1].confirmed_by_human=false,['DR_RECOMMENDATION_NOT_APPLICABLE']);
await run('transitive condition omitted',f=>{
 const p=recordFromData({...structuredClone(b.data),id:'AKL-900003',conditions:[{statement:'Independent parent prerequisite.',scope:'edge-local',concept_ids:[]}]},'tests/fixtures/synthetic/review-parent.yaml');
 f.model.claims.push(p);f.model.records.push(p);f.model.claims[1].data.derived_from_claims=[p.id];f.output.evidence_claims=f.model.claims.map(c=>structuredClone(c.data));f.output.uncertainty[0].claim_ids.push(p.id);
},['DR_CLAIM_CONDITION']);
await run('mandatory option extra condition',f=>{const item=f.model.decisionGuides[0].data.options[1];item.conditions=[...item.conditions,{statement:'Extra binding precondition.',scope:'edge-local',concept_ids:[]}];},['DR_BASIS_CONDITION']);
await run('transitive condition restored',f=>{
 const condition={statement:'Independent parent prerequisite.',scope:'edge-local',concept_ids:[]};
 const p=recordFromData({...structuredClone(b.data),id:'AKL-900003',conditions:[condition]},'tests/fixtures/synthetic/review-parent.yaml');
 f.model.claims.push(p);f.model.records.push(p);f.model.claims[1].data.derived_from_claims=[p.id];f.output.evidence_claims=f.model.claims.map(c=>structuredClone(c.data));f.output.uncertainty[0].claim_ids.push(p.id);f.session.condition_evaluations.push({condition,satisfied:true,confirmed_by_human:true});
});
await run('normalized condition whitespace',f=>f.session.condition_evaluations[1].condition.statement='  Selection   prerequisite.  ');
await run('same prose changed structural identity',f=>{f.session.condition_evaluations[1].condition.scope='reusable-concept';f.session.condition_evaluations[1].condition.concept_ids=['AKC-900005'];},['DR_CONDITION_INVENTORY','DR_RECOMMENDATION_NOT_APPLICABLE']);
await run('duplicate conflicting confirmations',f=>f.session.condition_evaluations.push({...structuredClone(f.session.condition_evaluations[1]),satisfied:false}),['DR_CONDITION_INVENTORY']);
for(const [label,driver,code] of [
 ['unresolved',{concept_id:'AKC-999999',role:'constraint',priority:'required'},'DR_DRIVER_UNRESOLVED'],
 ['mismatched',{concept_id:'AKC-900005',role:'quality-attribute',priority:'required'},'DR_DRIVER_TYPE'],
 ['undeclared',{concept_id:'AKC-900001',role:'constraint',priority:'required'},'DR_DRIVER_OUTSIDE_GUIDE'],
] as any) await run(`${label} driver`,f=>f.session.drivers=[driver],[code]);
await run('duplicate driver',f=>f.session.drivers=[{concept_id:'AKC-900005',role:'constraint',priority:'high'},{concept_id:'AKC-900005',role:'constraint',priority:'low'}],['DR_DRIVER_DUPLICATE']);
await run('required preference',f=>{f.session.drivers=[{concept_id:'AKC-900005',role:'constraint',priority:'required'}];f.model.decisionGuides[0].data.constraints[0].hardness='preference';f.output.constraint_results[0].hardness='preference';},['DR_DRIVER_REQUIRED_HARDNESS']);
for(const role of ['constraint','quality-attribute','assumption','context']) await run(`declared ${role} driver control`,f=>{
 const concept_id=role==='constraint'?'AKC-900005':role==='quality-attribute'?'AKC-900002':'AKC-900006';
 if(role==='context')f.model.concepts.find(c=>c.id===concept_id).data.type='context-condition';
 f.session.drivers=[{concept_id,role,priority:'required'}];
 if(role==='quality-attribute')f.output.decision_basis.push({guide_pointer:'/quality_attributes/0',claim_ids:[a.id]});
});
for(const status of ['needs-human-clarification','insufficient-evidence']) {
 const empty=(f:any)=>{f.session.context=[];f.session.condition_evaluations=[];f.session.constraints[0].satisfied=null;f.output.applicable_context=[];f.output.status=status;f.output.constraint_results[0].status='unknown';f.output.constraint_results[0].claim_ids=[];for(const key of ['viable_options','rejected_options','tradeoffs','verification','claim_ids','source_ids','evidence_claims','decision_basis'])f.output[key]=[];f.output.uncertainty=[{statement:'No context supplied',basis:'unknown-context',claim_ids:[]}];};
 await run(`empty ${status}`,empty);
 await run(`empty ${status} relabelled affirmative`,f=>{empty(f);f.output.status='recommendation';},['SCHEMA_INSTANCE']);
 await run(`nonaffirmative ${status} retains viable`,f=>{f.output.status=status;},['SCHEMA_INSTANCE']);
}
await run('overlapping partition',f=>f.output.rejected_options[0].concept_id='AKC-900004',['DR_OPTION_PARTITION']);
await run('omitted alternative',f=>f.output.rejected_options=[],['DR_OPTION_OMITTED']);
await run('hard unknown',f=>{f.session.constraints[0].satisfied=null;f.output.constraint_results[0].status='unknown';},['SCHEMA_INSTANCE']);
await run('multiple singleton',f=>f.output.status='multiple-viable-options',['SCHEMA_INSTANCE']);
await run('active conflicting exclusion',f=>f.model.decisionGuides[0].data.disqualifiers[0].option_id='AKC-900004',['DR_OPTION_DISQUALIFIED_OR_UNKNOWN']);
await run('unknown exclusion',f=>f.model.decisionGuides[0].data.disqualifiers.push({option_id:'AKC-900004',rationale:'Synthetic unknown',conditions:[...a.conditions,{statement:'Unknown exclusion',scope:'edge-local',concept_ids:[]}],claim_ids:[a.id]}),['DR_OPTION_DISQUALIFIED_OR_UNKNOWN']);
await run('authority upgrade',f=>f.output.authority.automation_may_approve=true,['SCHEMA_INSTANCE']);
const conditionModel=structuredClone(model); const cg:any=conditionModel.decisionGuides[0]!.data;
conditionModel.claims[1]!.data.conditions=[{...separate,scope:'reusable-concept',concept_ids:['AKC-900005']}];
cg.recommended_when[0].conditions=[{...separate,scope:'reusable-concept',concept_ids:['AKC-900006']}];
assert.ok(validateDecisionGuides(conditionModel).diagnostics.some(d=>d.code==='DG_CLAIM_CONDITION_LOST'));
rows.push({name:'guide same-text different-reference rejected',codes:['DG_CLAIM_CONDITION_LOST']});
const graph=buildGraphArtifacts(model);const units=buildRetrievalArtifacts(graph).units;const auth=createRagCitationAuthority(graph);
const optionUnits=units.filter(u=>u.record_id===g.id&&u.section_key==='options');const selection=units.find(u=>u.record_id===g.id&&u.section_key==='recommended_when')!;
assert.equal(optionUnits.length,2);
for(const option of optionUnits)assert.equal(auth.resolve(g.id,source.id,option.unit_id),undefined);
assert.ok(auth.resolve(g.id,source.id,selection.unit_id));assert.equal(auth.resolve(g.id,source.id),undefined);assert.equal(auth.resolve(g.id,source.id,selection.unit_id+'spoof'),undefined);
rows.push({name:'separate-selection section isolation and forged-unit rejection',codes:[]});
console.log(JSON.stringify({passed:true,probe_count:rows.length,rows},null,2));
```
