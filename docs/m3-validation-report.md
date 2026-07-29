# M3 Validation Report

Status: implementation report for the M3 reference corpus. This report does not
approve, review, publish, or canonize any content record.

## Scope delivered

M3 now contains the twenty draft reference knowledge units named in the project
execution specification:

1. First-Principles Thinking
2. Systems Thinking
3. Constraint
4. Availability
5. Reliability
6. Quality Attribute Scenario
7. Modular Monolith
8. Microservices
9. Hexagonal Architecture
10. Event-Driven Architecture
11. Idempotency
12. Retry
13. Circuit Breaker
14. Transactional Outbox
15. Saga
16. Eventual Consistency
17. OAuth 2.x
18. OpenID Connect
19. Observability
20. Architecture Decision Record

Four proposed supporting failure-mode nodes were added because the validation
policy requires failure-sensitive styles, patterns, tactics, and protocols to
reference first-class failure modes:

- Cascading Failure Amplification
- Boundary Erosion
- Token Role Confusion
- Unreconciled State Divergence

The supporting nodes are not part of the twenty-unit draft deliverable and
remain at `proposed`.

## Source governance

Ansha Cerbia explicitly approved AKS-000001 through AKS-000022 for source
admission on 2026-07-29, subject to every boundary in
`docs/m3-source-admission-proposal.md`. The authorization explicitly excluded
approval of claims, relationships, knowledge units, recommendations,
architecture decisions, and canonical status.

The source registry records all twenty-two sources as `approved`. LCE-000001
through LCE-000022 record the human-authorized source transitions. Admission
means evidence eligibility only.

All twenty-two admitted sources are used by at least one claim.

## Corpus inventory

| Record class | Count | Lifecycle distribution |
| --- | ---: | --- |
| Required reference concepts | 20 | 20 drafted |
| Supporting failure-mode concepts | 4 | 4 proposed |
| Claims | 48 | 40 sourced, 8 proposed |
| Relationships | 24 | 20 sourced, 4 proposed |
| Sources | 22 | 22 approved |
| Total governed records | 118 | mixed pre-review states |

The forty sourced claims and twenty sourced relationships reached their states
through automation-authorized lifecycle transitions. No content record crossed
the human-review boundary.

## Claim and relationship model exercise

The corpus exercises:

- normalized source claims, synthesis, and conditional recommendations;
- literal and governed-record claim objects;
- cross-domain relationships among foundations, constraints, quality,
  application architecture, distributed systems, integration, security,
  observability, and documentation;
- symmetric alternatives and compatibility;
- directed requirements, dependencies, constraints, enablement, introduction,
  mitigation, improvement, degradation, influence, and documentation;
- first-class failure-mode references and quality-attribute impact evidence.

Recommendations remain conditional. Relationship evidence resolves through
claims to admitted sources.

## Taxonomy findings and unresolved alternatives

### Idempotency

Current primary type: `tactic`.

Risk: idempotency is first a semantic property of an operation, while the
knowledge unit also describes tactics that implement that property. The current
ontology has no assignable `semantic-property` type.

Competing alternatives:

1. retain one tactic-oriented unit and make the property boundary explicit;
2. add `semantic-property` and retype the current unit;
3. split an idempotency semantic-property concept from one or more
   implementation tactics.

No ontology change was made during M3.

### Eventual consistency

Current primary type: `data-pattern`.

Risk: eventual consistency is a consistency model, not necessarily a reusable
problem-solution pattern. The ontology lacks an assignable
`consistency-model` type.

Competing alternatives are to add `consistency-model`, introduce a broader
`data-semantics` type, or retain `data-pattern` with an explicit
qualification. No ontology change was made.

### Modular monolith

Current primary type: `architectural-style`.

Risk: literature and practitioners use style, pattern, and architecture form
interchangeably. The current choice emphasizes system-level organizing
constraints and a shared deployment boundary. An `architectural-pattern`
classification remains plausible when the problem-context-solution form is
emphasized.

### Observability

Current primary type: `quality-attribute`.

Risk: observability is used both for a system capability and for an engineering
and operational practice. The current record models the system capability;
instrumentation and telemetry operation are implementation practices, not
secondary types on the same record.

### OAuth 2.x

Current primary type: `protocol`.

Risk: the label is a family-facing human key while the admitted sources cover
the OAuth 2.0 framework and current security guidance. Future OAuth revisions
may require distinct versioned protocol concepts and explicit supersession or
compatibility relationships.

### Failure-mode recursion

The Markdown policy requires a failure-mode concept to carry failure-mode
references because `failure-mode` itself is classified as failure-sensitive.
The four supporting nodes therefore reference related failure mechanisms. This
passes the current contract but may overstate recursive composition. A future
kernel review should decide whether a failure-mode record needs references to
other failure modes or only a non-empty mechanism analysis.

## Cross-domain ontology result

The graph supports cross-domain qualified edges without changing the
relationship vocabulary. Representative paths include:

- First-Principles Thinking compatible with Systems Thinking;
- Systems Thinking influencing an Architecture Decision Record;
- Constraint constraining Microservices;
- Quality Attribute Scenario documented by an Architecture Decision Record;
- Transactional Outbox enabling Event-Driven Architecture;
- OpenID Connect depending on and remaining distinct from OAuth 2.x;
- Observability conditionally improving Reliability.

No forbidden relationship cycle was produced.

## Assumptions introduced

- Twenty-two sources are sufficient for a seed corpus, not for exhaustive
  coverage.
- Vendor guidance is used only inside the admitted mechanism or first-party
  scope.
- The twenty required units may reference proposed supporting failure-mode
  concepts without expanding the twenty-unit deliverable.
- `drafted` means authored content exists; it does not imply content
  validation or human review.
- Source count does not determine claim confidence.
- Source-admission authorization is preserved as lifecycle evidence and does
  not transfer to any content approval.

## Validation results

Executed with Node 24.11.1 and pnpm 10.23.0:

- `pnpm validate`: 0 errors, 0 warnings;
- `pnpm test:coverage`: 16 test files and 56 tests passed;
- coverage: 95.87% statements, 82.48% branches, 99.07% functions, and
  96.94% lines;
- deterministic integrity reports: 12 of 12 current;
- unresolved references: 0 across 687 checked references;
- orphan concepts: 0 across 24 concepts;
- relationship cycles: 0;
- admitted source usage: 22 of 22;
- `git diff --check`: passed.

Mutation testing was not repeated because M3 changes governed data rather than
validation code. The previously proven M2 mutation baseline remains unchanged.

## Lifecycle and review boundary

No concept, claim, relationship, recommendation, or decision is marked
`human-review`, `reviewed`, `published`, or canonical. The twenty reference
units stop at `drafted`; supporting records stop at `proposed`.

## Recommended next scope

Before M4 graph implementation, run an independent M3 semantic and human-content
audit focused on:

1. source-to-claim fidelity and unsupported generalization;
2. idempotency and eventual-consistency concept-type decisions;
3. architectural style versus pattern consistency;
4. quality-attribute impact direction and conditions;
5. security review of OAuth 2.x and OpenID Connect;
6. whether supporting failure-mode recursion is the intended kernel contract;
7. editorial consistency and human review decisions record by record.

M4 should begin only after the audit either accepts these risks or records
explicit ontology changes.
