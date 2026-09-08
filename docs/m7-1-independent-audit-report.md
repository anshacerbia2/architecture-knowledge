# M7.1 Decision Guide Validation Kernel Audit

## Decision and review boundary

**M7.1 NOT READY for corpus or runtime entry.**

Audited commit: `16494552acf04d951aab29b92dbbd3b07d125e15` on `main`.
Inspection started on 2026-09-05 and continued on 2026-09-06 (Asia/Jakarta).
The starting tracked worktree was clean.

This is a separate adversarial audit pass by the same assistant that implemented
M7.1. It is not independent reviewer provenance. The filename follows the
repository audit naming convention, not a claim of external independence.
A separate reviewer must confirm the exit decision.

Four Medium findings and one Low finding remain open. Five observations record
bounded limitations or decisions, not additional proven runtime defects.
There are no identified Critical or High findings in this scoped pass.
No production decision-guide corpus or assistant runtime exists. This report
does not approve knowledge, change a lifecycle state, or authorize later phases.

## Scope, method, and evidence strength

Inspected the M7.0 entry requirements, schema migration, semantic validator and
CLI wiring, graph/index projection, retrieval units, citation authority, separate
output contracts, tests, mutation configuration, and cross-platform workflow.

Adversarial probes reused only the committed synthetic fixture builder, not its
assertions. Each guide mutation was checked against the actual guide schema and
`validateDecisionGuides`. Output probes used the actual output schemas.
The projection probe exercised `buildGraphArtifacts`,
`buildRetrievalArtifacts`, and `createRagCitationAuthority` directly.

These are component-boundary reproductions, not claims that a fabricated fixture
passed every repository gate. Synthetic supporting records and allocations are
not a newly admitted corpus. In particular, schema-valid ephemeral outputs are
not repository records; existing generic ID/lifecycle scans do not turn their
syntax-only references into semantically validated outputs.

A valid-guide control passed. Removing a matrix cell produced both
`SCHEMA_INSTANCE` and `DG_MATRIX_MISSING_CELL`. Setting
`automation_may_approve: true` in the recommendation control produced
`SCHEMA_INSTANCE`. These controls show the probes reached active validators.

## Findings

### M7.1-AUD-001 — Medium — Recommendation eligibility is internally inconsistent

**Open; blocks exit.**

Location: [recommendation schema](../schemas/decision-recommendation.schema.json),
particularly status, viable/rejected options, constraint results, and allOf.

Starting with an otherwise shape-valid affirmative result, each independent
mutation still produced zero schema errors:

- the same option appears in both `viable_options` and `rejected_options`;
- a hard constraint is `unknown`, yet status remains `recommendation` with
  no uncertainty entry or bounded-scenario explanation;
- `multiple-viable-options` has exactly one viable option.

The M7.0 requirements explicitly distinguish eligibility from comparison.
This is an executable output-contract hole, not an observed bad assistant
answer: there is no M7 runtime to exercise yet.

Required remediation: a pure, runtime-neutral contract validator should enforce
disjoint option sets, status/cardinality consistency, and a documented
fail-closed or explicitly bounded disposition for missing hard constraints.
Bind results to the guide/session so undeclared options and omitted required
constraints cannot be treated as eligible. Test hard constraints separately
from preferences and conditional non-applicability.

### M7.1-AUD-002 — Medium — Non-empty evidence IDs do not establish output closure

**Open; blocks exit.**

Location: [recommendation schema](../schemas/decision-recommendation.schema.json)
and [kernel analysis](../src/kernel.ts).

An affirmative recommendation's trade-off referenced `AKL-999999`, absent from
both the model and its top-level `claim_ids`; the schema accepted it.
The top-level admitted-looking source ID did not prove any connection to that
statement. The guide validator visits guides, not ephemeral recommendation
objects. No semantic recommendation validator supplies this missing closure.

This contradicts treating affirmative outputs as evidence-bearing merely because
claim/source arrays are non-empty. It does not bypass the existing M6 RAG
validator; it concerns the new, separate M7 contract.

Required remediation: validate nested/top-level evidence closure, source
admission and locators, derivation grounding, option/context applicability,
and preserved qualifications using explicit repository/guide/session inputs.
Keep unresolved outputs non-affirmative. Preserve epistemic labels instead of
inferring factual authority from a syntactically valid ID. This can be a pure
validator without creating orchestration or a model integration.

### M7.1-AUD-003 — Medium — Matrix cells can contradict criterion scale and unit

**Open; blocks exit.**

Location: [guide schema](../schemas/decision-guide.schema.json), definitions
`evaluationCriterion` and `tradeoffCell`;
[guide validator](../src/decision-guide-validator.ts), matrix loop.

A criterion declared `scale: quantitative`, `unit: milliseconds`.
Its cell supplied `value: fast`, `unit: USD`. Both schema and dedicated
semantic validation returned zero diagnostics.

Matrix coordinate completeness works, but does not establish comparability.
No numeric aggregation was executed; the defect is acceptance of internally
incompatible measurement metadata before later consumers exist.

Required remediation: specify and validate value/scale/unit compatibility.
Allow explicit unknown or not-applicable cells without inventing measurements.
Reject implicit conversions and numeric use of ordinal labels; any supported
conversion must be explicit. No weighted-ranking implementation is required.

### M7.1-AUD-004 — Medium — Section retrieval assigns unrelated guide evidence

**Open; blocks exit.**

Location: [retrieval projection](../src/retrieval-units.ts),
`decisionGuideUnits`; [citation authority](../src/rag-citation-authority.ts);
[context citation catalog](../src/rag-context.ts).

A synthetic guide used claim A/source A in its options and claim B/source B
only in `risk_questions`. Guide semantic validation passed. Its options unit
nonetheless carried both A and B as `evidence_claim_ids` and both sources as
citations. The citation authority resolved source B for that guide. The context
catalog binds such accepted citations to the retrieved evidence item using
record-level authority, without narrowing to the section's claim bindings.

Observed projection:

| Field | Result |
| --- | --- |
| Option-bound claims | A only, in both options |
| Options-unit evidence claims | A and risk-only B |
| Options-unit sources | A and risk-only B |
| Risk-only source resolves for guide | true |

Record-level provenance is legitimate, but it must be distinguished from
section-local supporting evidence. Currently those are presented together as
unit citations. The probe proves attribution contamination, not that a live
model produced an unsupported answer.

Required remediation: derive section/chunk supporting evidence from that
section's actual bindings and transitive dependencies. If retaining whole-guide
provenance, label it separately and exclude it from local support validation.
Add a two-source isolation regression, overview/policy-section behavior, and
split-section checks. Keep record-level provenance queryable.

### M7.1-AUD-005 — Low — Reusable condition references lack a type boundary

**Open; non-blocking alone, recommended in the same hardening run.**

Location: [guide validator](../src/decision-guide-validator.ts), `binding`
and condition preservation; [guide schema](../schemas/decision-guide.schema.json),
`qualifiedCondition`.

A reusable condition pointed to existing architectural-pattern `AKC-900001`
instead of a constraint, assumption, or context-condition. Schema and guide
validation accepted it. The validator preserves normalized statement text but
drops scope and concept IDs from its evidence-binding comparison. Generic ID
resolution checks existence, not the reusable-condition role.

Decide the permitted concept types and scope/reference invariants explicitly,
then enforce them across all bindings. Do not ban genuine edge-local text or
claim that string matching proves semantic equivalence.

## Observations and non-blocking boundaries

### M7.1-AUD-006 — Conflicting guide rules need explicit consumption semantics

A guide can recommend, avoid, and disqualify the same option under identical
conditions; the positive fixture already recommends and disqualifies one option
under the same condition. Copying the recommendation into avoidance is accepted.

Conflicting knowledge is permitted by repository policy, and the guide carries
`preserve-conflict-and-escalate`. Therefore this is not classified as a separate
proven runtime defect. Before corpus use, distinguish a deliberately recorded
conflict from accidental contradictory rules, preserve both sides, and specify
that neither may silently win. Include this in AUD-001 regression coverage.

### M7.1-AUD-007 — Uncertainty and epistemic preservation need a defined mapping

A low-confidence inference can support an assessment with `uncertainty: none`
without a guide diagnostic. That reproduces missing consistency enforcement,
but confidence, epistemic type, and decision uncertainty are not identical
quantities. This audit does not prescribe a blanket conversion between them.

Define when independent evidence or bounded context justifies lower decision
uncertainty; otherwise preserve uncertainty and the inference label. Exact
free-text entailment remains a human/content-audit responsibility. Track this
with AUD-002 instead of claiming all sourced claims are factual.

### M7.1-AUD-008 — Provider authorization is a declaration, not runtime enforcement

The session schema accepted an authorization expiring before its authorization
time and permitting only public data alongside internal context. This is
shape-level validation, not evidence of an actual data leak. No provider call,
session store, or M7 runtime exists.

Before runtime, enforce actor authority, expiry/time ordering, intended provider
and purpose, guide policy, classification scope, and redaction at the actual
egress boundary. A caller-supplied confirmation Boolean is not authentication.
Keep this deferred boundary explicit; do not implement a provider during this
audit or infer authorization from schema success.

### M7.1-AUD-009 — Guide human_key decision remains unresolved

The implementation report explicitly defers stable human lookup for guides.
Opaque AKG identity remains intact. Decide mandatory `human_key`, a separate
lookup key, or title-plus-ID before a sizable corpus and migrate registries,
schema, ledger validation, graph, and retrieval consistently if changed.

### M7.1-AUD-010 — Evidence coverage is synthetic and reviewer independence limited

Production guide count is zero by design. Non-empty guide support is exercised
by synthetic tests/probes, not representative architectural decision cases.
Real-provider decision quality, privacy enforcement, and runtime behavior are
unmeasured and out of scope. This reviewer is the implementing assistant.
These limits must remain visible in any later readiness declaration.

The focused mutation configuration targets only `decision-guide-validator.ts`
and excludes several mutation operators, including strings, regexes, and
methods. Its score is evidence for that configured boundary, not for output
schemas or every guide-aware graph/retrieval/citation path. Existing suites
cover some of those paths separately; the regressions above remain necessary.

## One-to-one M7.0 entry disposition

| Entry finding | M7.1 audit disposition |
| --- | --- |
| M7-ENT-001 | Dedicated schema/semantic CLI and core uniqueness/completeness checks delivered; recommendation closure still open in AUD-001/002. |
| M7-ENT-002 | Versioned guide graph/index/retrieval families delivered; section evidence precision remains open in AUD-004. |
| M7-ENT-003 | Separate guide/session/recommendation/draft contracts delivered; output semantics require AUD-001/002 remediation. |
| M7-ENT-004 | Guide nested inventory, applicability, condition strings, admitted-source derivation checks delivered; output closure and projected local support remain AUD-002/004. |
| M7-ENT-005 | Typed context and classification/provenance/confirmation fields delivered; runtime intake and egress enforcement explicitly deferred under AUD-008. |
| M7-ENT-006 | Hardness, priorities, scales, uncertainty and tie vocabulary delivered; measurement compatibility remains AUD-003, output eligibility AUD-001, epistemic mapping AUD-007. |
| M7-ENT-007 | Separate draft/human-authority constants delivered; negative approval control rejects automation authority. No human transition performed. |
| M7-ENT-008 | Deferred decision remains explicit as AUD-009; not silently closed. |
| M7-ENT-009 | Existing predicates retained; guide provenance is distinct from default-deny semantic traversal. No speculative predicate added. |
| M7-ENT-010 | Existing M6 behavior remains a dependency; no M7 assistant runtime or prompt wrapper introduced. |

All ten entry findings and all ten findings/observations in this report have an
explicit disposition. No inherited issue is closed solely because CI is green.

## Exact-SHA hosted evidence

[GitHub Actions run 33880145313, run number 40](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/33880145313)
reported the exact audited SHA and `completed/success` through the GitHub API.

All four jobs and the relevant step conclusions were checked:

- Ubuntu validation: formatting, repository validation, graph/retrieval checks,
  tests, coverage, and report currentness succeeded.
- Windows validation: the same gates succeeded.
- Mutation: legacy, graph, retrieval, RAG, and decision-guide threshold steps
  succeeded.
- PostgreSQL/pgvector integration: migration, indexing, currentness, integration
  tests, retrieval/RAG evaluation, benchmark, and both smoke steps succeeded.

Evidence strength is API job/step metadata matched to the committed workflow.
Raw hosted console logs were not inspected in this pass. No hosted test counts
or numerical mutation scores are inferred from metadata.

Local `RETRIEVAL_DATABASE_URL` is unset. PostgreSQL client is available, but
Docker is not available through PATH and no database was provisioned in this
audit. Database evaluations were not run locally; their hosted step outcomes
are reported separately. No live provider call was made.

## Local validation

| Command | Local result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed from the initially clean tracked worktree; pnpm warned that esbuild build scripts were ignored. |
| `pnpm format:check` | Passed. |
| `pnpm validate` | Passed initially and after report creation; all ten categories, zero errors/warnings. |
| `pnpm graph:check` | Passed, 13/13 current. |
| `pnpm retrieval:units:check` | Passed, 2/2 current. |
| `pnpm report:integrity` / `pnpm report:check` | Regenerated deterministically; 13/13 current after report creation. |
| `pnpm test:mutation:decision-guides` | Passed: 81.16% total, 82.96% covered, threshold 60%; 111 killed, 1 timeout, 23 survived, 3 no coverage, 0 errors. |
| `pnpm test:coverage` | Non-concurrent retry passed: 35 files, 454 tests; 1 database file / 4 tests skipped. Coverage: 92.44% statements, 82.37% branches, 95.85% functions, 94.99% lines. Initial failure detailed below. |
| `pnpm exec tsx .tmp/m7-audit.ts` | Completed; controls rejected malformed input and the accepted adversarial mutations are recorded above. |

Coverage and focused mutation were initially launched concurrently. Coverage
failed with four 15-second test timeouts and one 10-second graph-projection
setup-hook timeout (417 passed, 4 failed, 37 skipped including the affected
suite and 4 database tests). No assertion mismatch was reported in these
failures. The retry without concurrent mutation passed using the unchanged
command, worker count, timeout configuration, and coverage thresholds. All
previously timed-out cases passed. Resource contention is a supported inference,
not a separately measured root cause. The failed run remains part of this record.

Stryker counts a timed-out mutant as detected. Even conservatively treating
that mutant as undetected gives 111/138 = 80.43%, above the unchanged 60%
threshold. The timeout is not represented as an assertion-killed mutant.
Other local mutation suites were not rerun; their exact-SHA hosted steps were
verified as described above. The coverage command executes the full unit and
regression suite; a separate redundant `pnpm test` invocation was not made.

## Exit criteria and recommended next scope

Perform **M7.1 focused kernel hardening only**:

1. Resolve AUD-001 through AUD-004 with pure validators/projection changes and
   adversarial regression cases; include AUD-005 if its type policy is agreed.
2. Preserve conflicts and epistemic boundaries from AUD-006/007. Document the
   deferred privacy enforcement and lookup decision from AUD-008/009.
3. Cover positive and negative cases across graph/retrieval/output boundaries;
   run coverage, focused mutation, and exact-SHA Linux/Windows/database CI.
4. Obtain a separate reviewer audit of the remediation before corpus entry.

Do not create decision guides, session persistence, assistant orchestration,
model integration, or ADR/RFC/PAD generation as part of these repairs.
Keep lifecycle content proposed. No automation may approve decisions.

## Files and authority

The tracked changes are this report and the deterministic Markdown
integrity inventory regenerated by `pnpm report:integrity`. The probe runner
under ignored `.tmp/` is synthetic audit scratch, not implementation or corpus.
No roadmap status, governed source/claim/relationship, schema, validator, runtime,
lifecycle event, identifier allocation, commit, push, PR, or branch is changed.

## Reproduction appendix

At the audited SHA, save the following as `.tmp/m7-audit.ts` and execute
`pnpm exec tsx .tmp/m7-audit.ts` after `pnpm install --frozen-lockfile`.
It reads the committed synthetic builder; changes to that helper in another
commit can change this reproduction. Run it without concurrent heavy test jobs.

```typescript
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { validSemanticModel, conceptRecord, recordFromData } from '../tests/helpers.js';
import { validateSchemas } from '../src/schema-validator.js';
import { validateDecisionGuides } from '../src/decision-guide-validator.js';
import { buildGraphArtifacts } from '../src/graph-projector.js';
import { buildRetrievalArtifacts } from '../src/retrieval-units.js';
import { createRagCitationAuthority } from '../src/rag-citation-authority.js';

// Reuse only the committed synthetic data builder, not its test assertions.
const testSource = await readFile('tests/decision-guide.test.ts', 'utf8');
const builder = ts.transpile(testSource.slice(testSource.indexOf('async function guideModel()')), { target: ts.ScriptTarget.ES2022 });
const make = new Function('validSemanticModel', 'conceptRecord', 'recordFromData', builder + '\nreturn guideModel;')(validSemanticModel, conceptRecord, recordFromData);
async function schema(model: any, name: string, data: any) {
  model.governedFiles = [{path: '.tmp/probe.json', absolutePath: process.cwd()+'/.tmp/probe.json', schemaRef: 'schemas/'+name+'.schema.json', data, format:'json'}];
  return (await validateSchemas(model)).diagnostics.filter(d=>d.severity==='error');
}
async function guideProbe(name: string, edit: (m:any,g:any)=>void) {
  const m = await make(); const g = m.decisionGuides[0].data;
  edit(m,g);
  console.log(JSON.stringify({probe:name,schema:await schema(m,'decision-guide',g),semantic:validateDecisionGuides(m).diagnostics}));
}
await guideProbe('control-valid',()=>{});
await guideProbe('control-missing-matrix',(_,g)=>g.tradeoff_matrix.pop());
await guideProbe('contradictory-guide-rules',(_,g)=>{
  g.avoid_when=[structuredClone(g.recommended_when[0])];
});
await guideProbe('incompatible-matrix-units',(_,g)=>{
  g.evaluation_criteria[0].scale='quantitative'; g.evaluation_criteria[0].unit='milliseconds';
  g.tradeoff_matrix[0].assessment.value='fast'; g.tradeoff_matrix[0].assessment.unit='USD';
});
await guideProbe('condition-concept-type',(_,g)=>{
  g.tradeoff_matrix[0].conditions=[{statement:'The bounded synthetic condition holds.',scope:'reusable-concept',concept_ids:['AKC-900001']}];
});
await guideProbe('inference-certainty-upgrade',(m,g)=>{
  m.claims[0].data.claim_type='inference'; m.claims[0].data.confidence='low';
  g.tradeoff_matrix[0].assessment.uncertainty='none';
});
const model = await make();
const authority={recommendation_only:true,human_decision_required:true,automation_may_approve:false};
const rec:any={contract_version:1,session_id:'11111111-1111-4111-8111-111111111111',guide_id:'AKG-900001',status:'recommendation',applicable_context:[{key:'classification',value:'one',classification:'internal',provenance:'human-provided',confirmed_by_human:true}],constraint_results:[],viable_options:['AKC-900001'],rejected_options:[],tradeoffs:[{statement:'Synthetic tradeoff.',claim_ids:['AKL-900001']}],risks:[],uncertainty:[],verification:[{statement:'Synthetic verification.',claim_ids:['AKL-900001']}],evolution_triggers:[],claim_ids:['AKL-900001'],source_ids:['AKS-900001'],authority};
for (const variant of ['control','rejected-viable','hard-unknown','dangling-evidence','multiple-singleton','approval-flag']) {
  const r=structuredClone(rec);
  if(variant==='rejected-viable') r.rejected_options=[{concept_id:'AKC-900001',reason:'Disqualified.',claim_ids:['AKL-900001']}];
  if(variant==='hard-unknown') r.constraint_results=[{concept_id:'AKC-900005',hardness:'hard',status:'unknown',rationale:'Not supplied.',claim_ids:[]}];
  if(variant==='dangling-evidence') r.tradeoffs[0].claim_ids=['AKL-999999'];
  if(variant==='multiple-singleton') r.status='multiple-viable-options';
  if(variant==='approval-flag') r.authority.automation_may_approve=true;
  console.log(JSON.stringify({probe:'recommendation-'+variant,schema:await schema(model,'decision-recommendation',r)}));
}
const session:any={contract_version:1,session_id:rec.session_id,guide_id:rec.guide_id,context:rec.applicable_context,drivers:[],constraints:[],privacy:{persistence:'ephemeral-only',external_provider_authorized:true,external_provider_authorization:{authorized_by:'Synthetic Human',authorized_at:'2026-09-05T10:00:00Z',purpose:'Synthetic',provider_id:'synthetic',classifications:['public'],expires_at:'2026-09-04T10:00:00Z'},redacted_keys:[]},authority};
console.log(JSON.stringify({probe:'expired-incompatible-provider-scope',schema:await schema(model,'decision-session',session)}));

// Two bound claims from different sources: only the risk section uses B.
const m=await make();
const source=recordFromData({...structuredClone(m.sources[0].data),id:'AKS-900002',url:'https://example.com/risk-only'},'tests/fixtures/synthetic/source-b.yaml');
const claim=recordFromData({...structuredClone(m.claims[0].data),id:'AKL-900002',sources:[source.id],source_locations:[{source_id:source.id,locator:'Risk-only locator'}]},'tests/fixtures/synthetic/claim-b.yaml');
m.sources.push(source);m.claims.push(claim);m.records.push(source,claim);
const g=m.decisionGuides[0].data;g.evidence.push(claim.id);g.risk_questions[0].claim_ids=[claim.id];
const graph=buildGraphArtifacts(m);const units=buildRetrievalArtifacts(graph).units;
const option=units.find(u=>u.record_id===g.id && u.section_key==='options')!;
const auth=createRagCitationAuthority(graph);
console.log(JSON.stringify({probe:'section-evidence-leak',guideSemantic:validateDecisionGuides(m).diagnostics,optionBoundClaims:g.options.map((o:any)=>o.claim_ids),projectedClaims:option.metadata.evidence_claim_ids,projectedSources:option.citations.map(c=>c.source_id),riskOnlySourceAuthorizedForGuide:Boolean(auth.resolve(g.id,source.id))}));
```
