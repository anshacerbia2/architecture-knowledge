# M7.0 Entry Alignment and Decision Model Audit

## Decision

**M7.0 COMPLETE — M7.1 NOT AUTHORIZED**

Ansha Cerbia explicitly approved M6 completion and authorized only M7.0 entry
alignment and decision-model audit work on 2026-09-01. This run does not
implement an assistant runtime, create a decision-guide corpus, allocate an
`AKG` identifier, promote lifecycle state, or approve an architecture decision.

M6 is aligned as complete based on the final independent V4 re-audit at
`4f032f15e34c3f69039b7d010563ba656ecda947` and its merged preservation on
`main`. M7 has entered a proposed design state, but implementation must not
start until the entry conditions in this report are explicitly authorized.

## Scope

This audit covers:

- M6 exit and M7 entry-state alignment;
- the boundaries among reusable decision guides, project-specific decision
  sessions, recommendations, and draft decision artifacts;
- taxonomy and ontology fitness for contextual architectural decisions;
- the current decision-guide schema, identifiers, relationships, lifecycle,
  graph, retrieval, validation, and human-authority boundaries;
- failure modes, competing alternatives, unresolved questions, and an ordered
  next-run recommendation.

Explicitly excluded:

- runtime context intake, orchestration, model calls, or conversational memory;
- ADR, RFC, or PAD generation;
- decision-guide or evaluation corpus authoring;
- schema, ontology, identifier, graph, retrieval, or lifecycle migration;
- appointment of reviewers or owners; and
- any reviewed, approved, published, accepted, or canonical status transition.

## Audited baseline and method

The repository baseline was clean `main` at
`dd7faff702d089b8789aa0da276e07a9e8bcce12`. The audit inspected the final M6
V4 re-audit, human-readable and machine-readable roadmaps, record-kind and
relationship registries, identifier namespaces, decision-guide schema, schema
registry, repository model loader, semantic validators, graph projection,
retrieval-unit projection, RAG boundaries, tests, and governance instructions.

The schema was also challenged in memory with a synthetic decision guide. The
current JSON Schema accepted an object containing duplicate context keys,
duplicate option concepts, duplicate criterion keys, an empty trade-off matrix,
empty guide-level evidence, and a condition without a concept reference. The
probe did not create a repository record or allocate an identifier.

## Existing decision-model inventory

The kernel already contains useful foundations:

- `decision-guide` is a registered record kind with the `AKG` namespace;
- the record-kind definition correctly describes a guide as contextual support,
  not a universal scoring rule;
- `schemas/decision-guide.schema.json` requires a decision question, context
  variables, constraints, quality attributes, at least two concept-backed
  options, criteria, trade-offs, risks, conditions, evidence, lifecycle review,
  and version information;
- the schema registry maps future `decisions/*.yaml` records to that schema;
- registered relationship predicates permit selected guide-to-concept,
  concept-to-guide, provenance, governance, applicability, and avoidance edges;
  and
- the generic model loader and ID-reference scan recognize decision guides.

There are currently no decision-guide records. That absence is correct for this
run and must not be interpreted as a validation failure.

## Required model boundaries

### Reusable decision guide

A reusable decision guide is governed repository knowledge. It frames a stable
decision question, names context variables and constraints, compares reusable
concept-backed options, and grounds qualified assessments in claims. It receives
an immutable `AKG` ID and begins at `proposed` when a future authorized run
creates it.

A guide is not a project decision, a universal ranking function, an execution
trace, or evidence that an option was accepted.

### Decision session

A decision session is the project-specific application of one or more guides to
supplied context. It includes potentially sensitive inputs, extracted drivers,
constraint values, considered options, and intermediate reasoning. It is
ephemeral by default and is not a knowledge record or an `AKG` record.

Persisting sessions would require a separately governed contract, retention and
privacy policy, access control, and identifier decision. Those choices are
deferred; the current decision-guide schema must not be stretched to store a
session.

### Recommendation

A recommendation is a contextual, epistemically labeled output from a session.
It must expose applicable context, hard constraints, viable and rejected
options, claim-backed trade-offs, risks, uncertainty, verification, and
evolution triggers. It is advice, not approval and not a lifecycle transition.

### Draft decision artifact

An ADR, RFC, or PAD produced by automation is a draft projection of the session
and recommendation. It cannot assert that a decision is accepted, approved,
reviewed, published, or canonical. Human acceptance of a project decision is
separate from the knowledge-content lifecycle and remains outside automation.

## Decision flow and authority

The safe future flow is:

```text
Authorized project context
-> explicit context and privacy boundary
-> driver and constraint extraction
-> human-confirmed problem frame
-> governed guide and evidence retrieval
-> option eligibility filtering
-> qualified trade-off and risk comparison
-> recommendation with uncertainty
-> draft decision artifact
-> human decision and external approval workflow
```

Automation may extract, retrieve, compare, explain, recommend, validate, and
draft. It may not silently invent missing context, turn a soft preference into a
hard constraint, accept a project decision, appoint an approver, or cross a
human-only content lifecycle transition.

## Taxonomy and ontology stress test

### Architectural drivers

`architectural-driver` remains better modeled as a contextual role played by a
goal, constraint, quality scenario, concern, assumption, risk, or stakeholder
need. Making it a primary concept type would mix durable knowledge identity with
session-specific importance. This remains an unresolved kernel question rather
than a migration in M7.0.

### Options and alternatives

An option is a role played by an existing concept in a particular decision
guide. `alternative` should not be introduced as a primary type merely to serve
the decision workflow. Competing options may use `alternative-to` only when the
relationship is reusable and properly conditioned; membership in a single
guide is not itself a global semantic relationship.

### Constraints, assumptions, and context

Reusable conditions should resolve to first-class concepts. Project-local
values, deadlines, budgets, regulatory facts, and deployment facts belong to a
decision session. Edge-local or cell-local qualifiers should remain qualified
text when promoting them to concepts would create non-reusable knowledge.

The current schema does not distinguish hard constraints from preferences,
assumptions, observed context, or goals. It also cannot express value type,
unit, sensitivity, provenance, requiredness, or who confirmed a context value.

### Quality attributes and evaluation criteria

Quality attributes are durable concepts. Evaluation criteria are guide-local
questions or measures used to examine options against those concepts. They are
not interchangeable. A future model must make the link explicit and must not
pretend that ordinal prose assessments form a universal numeric score.

### Cross-domain relationships

The predicate registry can express several useful cross-domain relationships
for guides, including `depends-on`, `requires`, `constrains`, `addresses`,
`governed-by`, `derived-from`, `applies-when`, and `avoid-when`. This is enough
to establish ontology feasibility without adding broad predicates now.

However, the executable graph currently has only concept, claim, source, and
relationship node families. A future relationship with a decision-guide
endpoint would therefore project an edge whose guide endpoint has no graph
node, and graph validation would reject it as unresolved. Registry permission
alone does not yet provide executable cross-domain support.

## Findings and dispositions

| ID | Severity | Finding | M7.0 disposition |
|---|---|---|---|
| M7-ENT-001 | High | No decision-guide semantic validator exists. Schema validation cannot enforce unique keys and options, declared option/criterion membership, matrix completeness, claim applicability, or recommendation-evidence closure. | Accepted as a blocking implementation precondition. Build the semantic validation kernel before any guide corpus. |
| M7-ENT-002 | High | Decision guides are absent from graph node/index families and retrieval-unit kinds. Permitted guide relationships would produce unresolved graph endpoints, while standalone guides would be invisible to retrieval and RAG. | Accepted as a blocking implementation precondition. Design a versioned graph and retrieval migration before corpus authoring. |
| M7-ENT-003 | High | The current schema can be misused to conflate reusable guides with project sessions, recommendations, and draft artifacts. | Boundary fixed by this report. Separate contracts are required; do not overload `decision-guide`. |
| M7-ENT-004 | Medium | Trade-off and guide-level evidence can be incomplete even when the schema passes; no rule proves that every material assessment, disqualifier, or recommendation is claim-backed and applicable to the option and criterion. | Require explicit semantic closure rules and negative tests in the next kernel run. |
| M7-ENT-005 | Medium | Context variables are untyped questions with no unit, sensitivity, provenance, requiredness, validation, or confirmation semantics. | Define an intake contract and data-classification boundary before runtime. No context is persisted in M7.0. |
| M7-ENT-006 | Medium | Constraint hardness, criterion priority, uncertainty, tie handling, and measurement scales are undefined. A naive weighted score could create false precision. | Use constraint filtering plus qualified comparison by default. Any quantitative method must declare scale, unit, provenance, sensitivity, and aggregation semantics. |
| M7-ENT-007 | Medium | The content lifecycle does not represent human acceptance of a project decision, and using it for both would create false authority. | Keep knowledge lifecycle and project-decision authority separate. Define only draft output semantics before runtime. |
| M7-ENT-008 | Low | Active `human_key` is mandatory only for concepts, so future guides would have opaque IDs without a governed stable lookup key. | Decide during the identifier/schema migration whether active guides require unique `human_key`; do not change the ledger in M7.0. |
| M7-ENT-009 | Observation | The existing relationship vocabulary appears adequate for initial guide semantics if membership and session-local facts remain outside the global graph. | Add predicates only from demonstrated guide cases, with migration analysis. |
| M7-ENT-010 | Observation | M6 can provide bounded evidence answers, but it does not perform decision framing, option eligibility, or human-confirmed context extraction. | Preserve M6 behavior as a dependency; do not disguise a prompt wrapper as M7. |

No finding is omitted. High and Medium findings are not defects in an already
delivered M7 implementation; they are blockers against starting corpus or
runtime work with the current bootstrap model.

## Failure and abuse cases for future gates

The next implementation phases must include negative and regression cases for:

- an undeclared option or criterion appearing in a trade-off cell;
- a missing or duplicated option/criterion cell;
- a recommendation supported only by unrelated or ungrounded claims;
- a disqualified option returning as the recommendation;
- a missing hard constraint being treated as false instead of unknown;
- incompatible units or ordinal scales being aggregated numerically;
- adversarial project text attempting to override governance or evidence rules;
- sensitive context leaving the authorized provider boundary;
- a draft artifact asserting accepted or approved status;
- a decision-guide relationship producing a missing graph endpoint;
- retrieval omitting guide evidence or returning stale guide versions; and
- runtime output silently converting uncertainty into a definite choice.

## Decisions fixed for the next design run

The following are M7 entry architecture decisions, not content approvals:

1. `decision-guide` represents reusable governed decision support only.
2. Options and architectural drivers are contextual roles, not new primary
   concept types by default.
3. Session state is ephemeral by default and separate from repository knowledge.
4. Recommendations and generated ADR/RFC/PAD artifacts remain drafts under
   explicit human authority.
5. Hard-constraint filtering precedes trade-off comparison.
6. The default comparison model is qualitative and evidence-backed; universal
   weighted scoring is rejected.
7. Every material option assessment and recommendation path must remain
   traceable to applicable claims and admitted sources.
8. Decision-guide graph and retrieval support must be first-class and versioned,
   not inferred from generic ID resolution.

## Unresolved decisions and competing alternatives

1. **Persisted session identity:** keep sessions entirely external, introduce a
   `decision-session` record kind, or store only redacted snapshots. The privacy
   and audit requirements must drive this choice.
2. **Decision artifact identity:** keep ADR/RFC/PAD drafts in an external tool,
   add a distinct artifact record, or use repository Markdown with a separate
   contract. None may reuse `AKG` semantics.
3. **Guide lookup:** require `human_key` for active guides, add a separate stable
   slug, or rely on title plus opaque ID.
4. **Context model:** use a small typed value system or JSON-Schema fragments per
   guide. The latter is more expressive but increases migration and security
   complexity.
5. **Matrix completeness:** require every option-criterion pair, or permit
   explicit `not-applicable` cells. Silent absence is not acceptable.
6. **Recommendation support:** require direct claim IDs on recommendation rules,
   or derive them only through matrix cells. Direct support is clearer but can
   duplicate references.
7. **Graph representation:** make guides first-class nodes in the existing graph
   contract or maintain a separate decision projection. A single graph improves
   traversal; a separate projection reduces coupling.
8. **Conditions:** determine when `concept_ids` must be non-empty and when
   genuinely local qualified text is sufficient.
9. **Uncertainty:** choose an explicit vocabulary for missing, conflicting,
   low-confidence, and context-dependent evidence before output contracts exist.
10. **Evaluation corpus:** define representative decision cases, adversarial
    cases, and holdouts only after the validation and authority contracts are
    stable.

## M7.1 entry conditions

Before any representative guide or runtime is created, a separately authorized
M7.1 Decision Guide Kernel run should:

1. design and record the schema/ontology/identifier/graph/retrieval migrations;
2. refine the decision-guide schema and define separate session,
   recommendation, and draft-artifact contracts without implementing runtime;
3. implement a dedicated semantic validator with focused CLI/category support;
4. add positive, negative, boundary, regression, coverage, and mutation tests;
5. add first-class decision-guide graph indexes/nodes and retrieval units with
   deterministic currentness checks;
6. define evidence applicability, matrix completeness, uncertainty, and
   authority invariants;
7. define privacy, prompt-injection, retention, and external-provider boundaries;
8. validate cleanly on Linux and Windows; and
9. undergo independent review before corpus authoring begins.

Only after that kernel is green should a later run create a small representative
decision-guide corpus. Assistant runtime and decision-artifact generation should
remain separate subsequent scopes.

## Validation applicable to M7.0

This run changes only documentation and roadmap state. Applicable gates are:

- deterministic Markdown and link validation;
- full repository validation and integrity-currentness after regenerating the
  generated Markdown inventory;
- the existing test and coverage suites to detect accidental contract drift;
- exact diff review proving no schema, ontology, ID allocation, governed
  knowledge, graph, retrieval, RAG runtime, or lifecycle event changed.

Mutation testing is not an applicable local change gate because M7.0 changes no
executable code. The normal hosted workflow remains the exact-SHA evidence gate
for the branch.

### Local results

- `pnpm format:check`: passed;
- `pnpm validate`: passed with 0 errors and 0 warnings across schema,
  vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and
  links;
- `pnpm test`: 33 files passed, 1 PostgreSQL integration file skipped; 440 tests
  passed and 4 database tests skipped because no local database was requested;
- `pnpm test:coverage`: passed at 92.11% statements, 82.67% branches, 95.61%
  functions, and 94.70% lines;
- `pnpm graph:check`: 12/12 artifacts current;
- `pnpm retrieval:units:check`: 2/2 artifacts current; and
- `pnpm report:check`: 12/12 integrity reports current.

The first sandboxed Vitest launch was denied by Windows process isolation with
`spawn EPERM` before test collection. Both test commands were rerun unchanged
with process-spawn permission and passed. This was an execution-environment
retry, not a waived or relaxed validation gate.

### Files changed

- `README.md` and `ROADMAP.md` align the M6 exit and bounded M7.0 state;
- `roadmap/implementation.yaml` records M7 as proposed without claiming
  implementation;
- `docs/README.md` adds the final M6 V4 audit and this M7.0 audit to the reading
  order;
- `docs/kernel-decisions.md` records unresolved foundational decision-model
  questions;
- this report records the audit; and
- `generated/integrity/markdown-link-integrity.json` is regenerated
  deterministically.

No schema, ontology registry, identifier allocation, source, claim,
relationship, knowledge unit, lifecycle event, graph artifact, retrieval
artifact, RAG implementation, decision guide, or runtime file changed.

## Recommended next scope

The recommended next run is **M7.1 — Decision Guide Validation Kernel only**.
It should implement the preconditions above without creating the representative
guide corpus or assistant runtime. M7.1 is recommended, but it is not authorized
by this report or by the authorization for M7.0.
