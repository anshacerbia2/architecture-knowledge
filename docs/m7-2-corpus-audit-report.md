# M7.2 Focused Corpus Audit

Date: 2026-09-10 (Asia/Jakarta).
Audited SHA: `9a21e019d85a458a796151437bd088c36201ce3b`.
Starting branch: `main`; tracked worktree clean and synchronized with origin.

## Decision and independence

**M7.2 NEEDS FOCUSED REMEDIATION for its advertised selection/output scope.**
There are **0 Critical, 0 High, 2 Medium, 0 Low findings and 5 observations**.
The corpus and implementation are machine-valid; the exact-SHA hosted CI is
successful. This is not another retrieval-integration failure. Two real-corpus
decision-contract coverage gaps remain before relying on the pilot as decision
support or widening its scope. Proposed records may remain stored for review.

This is a same-agent critical review, not an independent second reviewer. The
reviewing agent has implementation history, including the retrieval fix. Its
new probes are distinct from the committed pilot scenario builder but use the
same validators and condition-key helper. No organizational, human, fresh-agent,
or stronger independence is claimed. Findings below stand on reproducible
inputs, source inspection, and explicit counterexamples, not CI success alone.

Scope: all three AKG guides, thirteen new claims, twelve locator-updated parent
claims, source admission boundaries, selection/exclusion coverage, matrices,
uncertainty, graph/retrieval projection, and the post-pilot retrieval regression.
This is not a complete re-audit of M0-M7.1 or authorization for runtime work.
No implementation, governed content, lifecycle, benchmark, or threshold changed.

## Findings and one-to-one disposition

| ID | Severity | Disposition | Scope |
|---|---|---|---|
| M7.2-AUD-001 | Medium | Open; blocks complete pilot selection coverage | Inactive complementary option cannot be represented without an active exclusion |
| M7.2-AUD-002 | Medium | Open; blocks faithful multi-option explanations | Output statement applicability incorrectly targets every viable option |
| M7.2-AUD-003 | Observation | Retained pilot limitation; resolve before broad decision use | Structurally complete matrices are deliberately thin comparative evidence |
| M7.2-AUD-004 | Observation | Retained bounded modeling decision | Guide keys and multiple independent project constraints remain unmodeled |
| M7.2-AUD-005 | Observation | Retain existing M7.1 boundary; not a newly reopened finding | Free-text entailment and human-confirmation authentication are not validated |
| M7.2-AUD-006 | Observation | Retained evidence limitation | Fake-provider ranking, absent guide-search quality cases, and mutation timeouts |
| M7.2-AUD-007 | Observation | Explicit review limitation | Same-agent review and living-source historical-byte uncertainty |

### M7.2-AUD-001: inactive is not equivalent to rejected

Locations: [fault-response guide](../decisions/AKG-000002.yaml), lines 5, 179,
211; [inquiry guide](../decisions/AKG-000003.yaml), lines 5, 178, 198;
[recommendation validator](../src/decision-recommendation-validator.ts), lines
93-100 and 289-299 at the audited SHA.

The guides expressly offer a single control/lens or a combination. Affirmative
outputs must partition every declared option into viable or rejected. Rejection
requires an active avoidance/disqualifier rule. The guides do not cover an
otherwise permissible second option whose positive applicability is false.

Counterexamples with complete known context and scoped human-confirmation
declarations, not real project assertions:

- Retry is safe and transient, within deadline/load limits, and breaker state
  is explicitly coordinated as disabled. No sustained shared-capacity threat
  exists, but a blocked-call response would be acceptable. Retry selection is
  true; breaker selection and its only exclusion are both false.
- Only a material premise needs examination in the bounded availability
  inquiry. No cross-boundary/lifecycle analysis is material. Premise selection
  is true; systems-thinking selection and both sole-lens exclusions are false.

For each, listing the unused option as rejected produces solely
`DR_REJECTION_NOT_JUSTIFIED` in the complete probe. Omitting it instead produces
`DR_OPTION_OMITTED` plus expected inventory/basis diagnostics. Making it viable
would contradict its known-false selection condition. A non-affirmative result
is safe, but does not implement the advertised single-option decision path.
The corresponding two-option positive controls both pass.

Impact: incomplete decision coverage, not unsafe automatic approval. This is a
latent contract/authoring mismatch exposed by the real pilot, not evidence that
the earlier active-exclusion enforcement should be weakened.

Competing remedies: model a separately justified not-applicable/nonselected
option state through a versioned contract migration; add narrowly supported
guide rules where genuine exclusion is justified; or explicitly narrow the
pilot's supported outcomes and keep other paths non-affirmative. Do not turn
every false recommendation condition into an exclusion, pretend a useful but
unneeded control is unsafe, or remove partition/evidence checks.

Exit evidence: standalone Retry, standalone Breaker, each single inquiry lens,
combined controls/lenses, neither applicable, and unknown conditions, with
noncontradictory scenario facts and exact selection/exclusion evidence.

### M7.2-AUD-002: multi-option output cannot carry option-local evidence

Locations: [recommendation schema](../schemas/decision-recommendation.schema.json),
lines 73-77 and 257; [recommendation validator](../src/decision-recommendation-validator.ts),
lines 330-332 and applicability checking at 395-409; and
[pilot test](../tests/m7-2-pilot.test.ts), the common comparison statement used in
both trade-offs and verification while risks remain empty.

Every claim attached to a trade-off, risk, verification statement, or evolution
trigger is checked against **all** viable options. The statement schema has no
option target field. This prevents useful option-specific statements in a
multi-option result even when the claim is declared, sourced, qualified, and
already present in the exact evidence closure.

Reproduction: begin with the valid Retry + Circuit Breaker result. Add a scoped
statement about Retry's transient-failure/deadline/load conditions, citing
AKL-000026. Nothing else changes. Validation returns solely
`DR_CLAIM_APPLICABILITY`: AKL-000026 concerns Retry and availability, not Circuit
Breaker. Replacing it with a shared coordination statement citing AKL-000028
passes. This is not missing evidence or an unsupported claim.

Impact: a result comparing complementary options can suppress their individual
risks, costs, verification, or evolution needs to satisfy an all-target check.
The pilot's shared-statement controls do not test this realistic output shape.
Guide-level matrix cells themselves retain option-local bindings correctly.

Preferred direction: a coordinated schema/validator migration with explicit
per-statement option targets, checked against declared result options and claim
applicability to each target. Preserve shared claims for actual joint statements,
exact inventories, qualifiers, and transitive evidence. Do not broaden claim
applicability falsely or accept an arbitrary claim for any one viable option.

Exit evidence: both option-specific and shared statements in a multi-option
result; missing, fabricated, duplicate, and outside-result targets; a claim for
the wrong target; evidence/condition omissions; and unchanged single-option and
human-authority controls.

## Content, taxonomy, and source-fidelity assessment

All 3 guides remain `proposed` with null review dates and empty reviewer lists.
All 13 new claims are `sourced`, not human-reviewed. Source admission remains
separate from accepting selection judgments. No new sources or concepts were
introduced by the pilot. Synthesis/inference/recommendation labels and inherited
low-confidence uncertainty are visible rather than converted to source mandates.

The taxonomy boundaries are appropriate for this small catalog: deployment
alternatives, complementary fault-response controls, and complementary reasoning
lenses are separate questions. The guide does not make OAuth/OIDC, Outbox/Saga,
or internal hexagonal design into false exclusive architecture alternatives.
No measured availability improvement or universal winner is asserted.

Source pages were inspected on 2026-09-10. The following mapping reports source
support for mechanisms and stated derivations, not human endorsement of advice.

| Source | Inspected support and limits |
|---|---|
| AKS-000001 | [First-principles section](https://plato.stanford.edu/entries/aristotle-mathematics/#StrMatSciFirPri): historical propositions, not a modern software method; transfer labels are necessary and retained |
| AKS-000002 | [NASA handbook](https://www.nasa.gov/wp-content/uploads/2018/09/nasa_systems_engineering_handbook_0.pdf): systems/lifecycle scope and section 4.1.1.2.2 constraint definition; printed page 48 is PDF page 58, not a project-compliance certificate |
| AKS-000005 | [SRE Indicators](https://sre.google/sre-book/service-level-objectives/): service usability and successful well-formed requests support the narrow operational availability indicator |
| AKS-000006 | [GitLab design](https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/modular_monolith/hexagonal_monolith/): Summary, Application domain, and Enforcing boundaries support a first-party modularization case, not a universal runtime topology |
| AKS-000007 | [Lewis/Fowler microservices](https://martinfowler.com/articles/microservices.html): independent deployment/business capabilities and design-for-failure input; alternatives remain scoped |
| AKS-000008 | [Microsoft microservices](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices): management/skills and distributed-system challenges support conditional capability judgments, not intrinsic reliability loss |
| AKS-000012 | [Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry): transient faults, deadlines/load, duplicate side effects, and coordination support bounded retry; no general measured gain |
| AKS-000013 | [Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker): open/probe behavior and caller handling support the mechanism and conditional capacity inference, not guaranteed recovery |

The GitLab page required a read-only HTTP fallback after the web reader failed
to expose its relevant section. No third-party source body was persisted.

### One-to-one new-claim dispositions

| Claim | Disposition in this audit |
|---|---|
| AKL-000070 | Bounded monolith candidate follows mechanism claim 000007; low-confidence judgment preserved |
| AKL-000071 | Independent-deployment/capability recommendation retains synthesis parent 000008 and scoped Microsoft input |
| AKL-000072 | Single-deployable incompatibility exclusion is qualified; project requirement truth is external input |
| AKL-000073 | Deferral retains low-confidence parent 000036 and absent-capability condition |
| AKL-000074 | Unsafe repetition/deadline-load exclusion has direct Retry support and mechanism parent; not a general cascading-failure claim |
| AKL-000075 | Breaker candidate retains 000027's capacity/open-response conditions and inference uncertainty |
| AKL-000076 | Open-response prerequisite is a repository judgment from the breaker mechanism; not a quoted mandate |
| AKL-000077 | Premise-lens recommendation visibly remains a software transfer from 000001 |
| AKL-000078 | Interaction/lifecycle candidate derives from 000002; transfer qualifications remain in the evidence chain |
| AKL-000079 | Sole-lens exclusion does not exclude combined inquiry; operational coverage gap is AUD-001 |
| AKL-000080 | Same sole-lens boundary and AUD-001 limitation; no method superiority claim |
| AKL-000081 | Narrow NASA constraint paraphrase and exact locator supported; no project authority inferred |
| AKL-000082 | Narrow Google SRE operational indicator and locator supported; not universal definition or improvement evidence |

Parent-claim review included each of the 12 locator-updated claims: 000001,
000002, 000007, 000008, 000012, 000013, 000021, 000022, 000026, 000027, 000028,
and 000036. Their qualified mechanism, synthesis, inference, and comparison roles
remain distinct. In particular, 000026's prose requires safe repetition although
its structured condition only names transience/deadline/load. AKG-000002 adds
safe repetition explicitly in its selection rule; the pilot does not drop that
safeguard. Reusing 000026 elsewhere still requires preserving its full prose.

## Observations and unresolved decisions

**AUD-003:** 12/12 matrix cells exist, but each guide has only two criteria and
primarily describes mechanisms or unknown project impact. Unknown is preferable
to invented scores; it is not a substitute for eventually covering costs,
failure modes, security/data/operational consequences, and verification evidence.
The deployment guide's generic project-fit uncertainty does not provide separate
latency/data-consistency/operating-cost comparisons. The inquiry guide does not
claim experimental effectiveness. Retain this as a small review pilot, not a
comprehensive architecture-selection corpus. No new metrics are required merely
to fill cells; add only governed evidence or explicitly scope out a dimension.

**AUD-004:** exact AKG IDs plus catalog titles are an explicit temporary lookup
choice, not working aliases. One generic Constraint concept per guide records
scope; it cannot distinguish multiple independently checkable project limits.
Empty reusable-assumption arrays do not mean absence of assumptions: local
conditions remain. Decide guide-key migration and constraint identity before
broad authoring. Do not allocate decorative concepts to hide these limits.

**AUD-005:** the probe replacing valid trade-off prose with an unsupported
synthetic universal claim still passes. This confirms the existing
[M7.1 AUD-007/008 boundary](m7-1-second-reviewer-confirmation.md): structural
evidence applicability/snapshots are not prose entailment or authentication.
Human-confirmation fields and ephemeral/provider policies are declarations,
not runtime identity or egress controls. Retain, rather than falsely reclassify,
these previously documented runtime/content-review obligations. The future
runtime must not present `decision:validate` success as semantic approval.

**AUD-006:** existing 46-case retrieval and 23-case RAG benchmarks passed but
predate guide-specific search-quality cases. Exact guide lookup and binding-local
projection tests are not guide-ranking evaluation. The fake-only token-overlap
fix preserves real-provider behavior; common content words can still produce
false positives and it does not establish semantic quality. Hosted mutation
passed with timeouts (116 legacy, 2 graph, 7 retrieval, 1 RAG); do not report
those scores as exclusively killed mutants. Decision-guide and recommendation
mutation had zero timeouts. These are retained limitations, not CI failures.

**AUD-007:** source pages match the scoped meanings at inspection time, but no
archived-byte equivalence to their July admission revisions was proved. The
same-agent review cannot provide the fresh independent-review evidence requested
as the eventual milestone gate. A distinct reviewer can focus on the two fixes,
the scenario matrix, and remaining boundaries rather than repeat unrelated
milestone audits.

## Validation and provenance

[Hosted run 49](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34383376370)
is completed/success, attempt 1, and matches the audited full SHA. All four jobs
and their steps were verified. Raw decoded job logs were retrieved in this audit
and contain that SHA; these are not screenshot-only or earlier-commit claims.

| Job | ID | Verified evidence |
|---|---|---|
| Linux | 102573442507 | 609 tests passed, 5 DB skips; coverage 93.30/84.77/96.80/95.47%; repository/artifact gates passed |
| Windows | 102573442423 | Same tests/coverage; repository/artifact gates passed |
| PostgreSQL/pgvector | 102573442411 | 16 integration/query tests; both evaluations with empty failures; RAG invocation accuracy 1 overall/development/holdout; benchmark and smoke steps successful |
| Mutation | 102573442183 | Legacy 78.74%, graph 83.41%, retrieval 70.49%, RAG 76.41%, decision-guide 80.00%, recommendation 84.52%; thresholds unchanged |

Local commands were run in the existing workspace, not a new clean checkout:

| Command/check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; existing esbuild build-script warning retained without changing policy |
| `pnpm validate` | Pass, typecheck and all semantic/schema/Markdown/link gates; 0 errors, 0 warnings |
| `pnpm format:check` | Pass |
| `pnpm graph:check` | 13/13 current |
| `pnpm retrieval:units:check` | 2/2 current |
| `pnpm report:check` | 13/13 current before report addition |
| `pnpm test:coverage` | 609 passed, 5 DB tests skipped; 44 files passed, 1 skipped |
| Coverage | Statements 93.30%, branches 84.77%, functions 96.80%, lines 95.47% |
| Focused pilot/retrieval tests | 35 passed across `m7-2-pilot.test.ts` and `retrieval-fake-relevance.test.ts` |
| Standalone audit probes | Both combination controls pass; both single-option cases expose AUD-001; option-local/shared-statement pair exposes AUD-002; free-text probe confirms AUD-005 |

Full local mutation was not repeated: the exact-SHA hosted six-target evidence
was read directly. Local database evaluation was not executed in this audit;
the 5 local DB skips are not represented as passes. No live provider was called.
Re-running tests cannot resolve the two uncovered scenario semantics without
new regression expectations and an explicitly scoped remedy.

## Recommended next run

Only focused M7.2 decision-coverage remediation for AUD-001 and AUD-002, with a
documented versioned contract migration if selected. Preserve the existing
evidence, exclusion, privacy, uncertainty, human-authority, and benchmark gates.
Exercise all single/complementary/neither/unknown cases and option-local/shared
statements, then obtain fresh exact-change Linux, Windows, database evaluation,
and mutation evidence. Keep runtime, model integration, expanded corpus, and
ADR/RFC/PAD generators outside scope. No claim or guide is human-approved here.

This audit only adds this report and regenerates the deterministic Markdown
inventory; no commit, push, PR, merge, or branch operation is performed.
After report creation, `pnpm validate` again passed with 0 errors and 0 warnings,
`pnpm report:check` confirmed 13/13 current reports, and `git diff --check` passed.

## Reproduction appendix

Save the following fixture-only harness as `.tmp/m72-audit-probes.ts` at the
audited SHA and execute `pnpm exec tsx .tmp/m72-audit-probes.ts`. It uses public
repository data and synthetic context, never a real project session. It does
not write or mutate the loaded repository. Additional inventory diagnostics
after deliberately omitting an option do not change the isolated rejection
failure from the otherwise complete single-option cases.

```typescript
import { loadRepository } from '../src/model.js';
import { validateDecisionRecommendation } from '../src/decision-recommendation-validator.js';
import { decisionConditionKey } from '../src/decision-guide-validator.js';
const model = await loadRepository(process.cwd());
const claims = new Map(model.claims.map(c => [c.id,c.data]));
const authority={recommendation_only:true,human_decision_required:true,automation_may_approve:false};
function fixture(n:number, both:boolean) {
 const g:any=model.decisionGuides.find(g=>g.id===`AKG-00000${n}`)!.data;
 const basis=['/options/0','/options/1','/constraints/0','/recommended_when/0',...(both?['/recommended_when/1']:[])].map(guide_pointer=>{
   const [,field,i]=guide_pointer.split('/');return {guide_pointer,claim_ids:g[field][+i].claim_ids};
 });
 const comparison=n===2?'AKL-000028':'AKL-000021';
 const roots=[...new Set([...basis.flatMap(b=>b.claim_ids),comparison])].sort();
 const chain=new Set<string>(); const visit=(id:string)=>{if(chain.has(id))return;chain.add(id);(claims.get(id)!.derived_from_claims as string[]).forEach(visit);};roots.forEach(visit);
 const conditions=new Map<string,any>(); const collect=(v:any)=>{
 if(Array.isArray(v))v.forEach(collect); else if(v&&typeof v==='object'){
 if(typeof v.statement==='string'&&typeof v.scope==='string'&&Array.isArray(v.concept_ids))conditions.set(decisionConditionKey(v),v);
 Object.values(v).forEach(collect);}};
 collect(g);chain.forEach(id=>collect(claims.get(id)));
 const trueKeys=new Set<string>();
 // Fixed scenario decisions: scope, first option's selection, and optional second selection.
 for(const item of [g.constraints[0],g.recommended_when[0],...(both?[g.recommended_when[1]]:[])])for(const c of item.conditions)trueKeys.add(decisionConditionKey(c));
 // For retry-only, combination coordination describes the disabled breaker policy;
 // for premise-only, no interactions are material, so combined-coverage is false.
 const context=g.context_variables.map((v:any)=>({key:v.key,value:n===2?'Synthetic call: safe transient repeat, bounded budget; no sustained capacity threat; blocked-call failure is acceptable.':'Synthetic availability inquiry: one uncertain premise; no material cross-boundary interactions; premise examination only.',classification:'internal',provenance:'human-provided',confirmed_by_human:true}));
 const session:any={contract_version:3,guide_version:1,session_id:'33333333-3333-4333-8333-333333333333',guide_id:g.id,context,drivers:[],constraints:[{concept_id:'AKC-000003',satisfied:true,notes:'Synthetic scope'}],condition_evaluations:[...conditions].map(([k,condition])=>({condition,satisfied:trueKeys.has(k),confirmed_by_human:true})),privacy:{persistence:'ephemeral-only',external_provider_authorized:false,external_provider_authorization:null,redacted_keys:[]},authority};
 // For a single option, use that option's descriptive claim rather than a
 // conditional combination claim for the synthetic verification statement.
 if(!both&&!basis.some(b=>b.claim_ids.includes(comparison))){const i=roots.indexOf(comparison);roots.splice(i,1);chain.clear();roots.forEach(visit);}
 if(both){for(const id of chain)for(const c of (claims.get(id)!.conditions as any[]))session.condition_evaluations.find((e:any)=>decisionConditionKey(e.condition)===decisionConditionKey(c)).satisfied=true;}
 const cited=both?comparison:g.options[0].claim_ids[0];
 const statement={statement:'Synthetic check of the supplied mechanism evidence; no project approval.',claim_ids:[cited]};
 const output:any={contract_version:3,guide_version:1,session_id:session.session_id,guide_id:g.id,status:both?'multiple-viable-options':'recommendation',applicable_context:structuredClone(context),constraint_results:[{concept_id:'AKC-000003',hardness:'hard',status:'satisfied',rationale:'Synthetic scoped limit',claim_ids:['AKL-000081']}],viable_options:both?g.options.map((o:any)=>o.concept_id):[g.options[0].concept_id],rejected_options:both?[]:[{concept_id:g.options[1].concept_id,reason:'Not applicable in this bounded scenario, not unsafe or prohibited.',claim_ids:g.options[1].claim_ids}],tradeoffs:[statement],verification:[structuredClone(statement)],risks:[],evolution_triggers:[],claim_ids:roots,source_ids:[...new Set([...chain].flatMap(id=>claims.get(id)!.sources as string[]))].sort(),evidence_claims:[...chain].sort().map(id=>structuredClone(claims.get(id))),decision_basis:basis,uncertainty:[...chain].filter(id=>claims.get(id)!.confidence==='low').map(id=>({statement:'Synthetic unresolved low-confidence input',basis:'low-confidence',claim_ids:[id]})),authority};
 return {session,output};
}
for(const [label,n,both] of [['retry+breaker control',2,true],['lenses control',3,true],['retry only',2,false],['premise only',3,false]] as const){
 const {session,output}=fixture(n,both);
 console.log(label,JSON.stringify((await validateDecisionRecommendation(model,session,output)).map(d=>({code:d.code,message:d.message}))));
 if(!both){const omitted=structuredClone(output);omitted.rejected_options=[];console.log(label+' omit unused option',JSON.stringify((await validateDecisionRecommendation(model,session,omitted)).map(d=>d.code)));}
}
// Scope-boundary test: arbitrary prose can cite a real claim but is not entailed.
const p=fixture(2,true);p.output.tradeoffs[0].statement='Synthetic false assertion: retries eliminate every failure and require zero capacity.';
console.log('unentailed prose limitation',JSON.stringify((await validateDecisionRecommendation(model,p.session,p.output)).map(d=>d.code)));
const scoped=fixture(2,true);
scoped.output.risks=[{statement:'Retry is conditional on transient failures, deadline fit, and bounded retry load; no measured availability gain is asserted.',claim_ids:['AKL-000026']}];
console.log('retry-scoped statement in complementary result',JSON.stringify((await validateDecisionRecommendation(model,scoped.session,scoped.output)).map(d=>d.code)));
scoped.output.risks=[{statement:'Retry and circuit-breaker policies require coordination.',claim_ids:['AKL-000028']}];
console.log('shared coordination statement control',JSON.stringify((await validateDecisionRecommendation(model,scoped.session,scoped.output)).map(d=>d.code)));
```
