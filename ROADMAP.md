# Strategic Roadmap

This is the single human-readable source for project milestones and current
position. Its machine-readable counterpart is
[`roadmap/implementation.yaml`](roadmap/implementation.yaml).

Historical execution reports use “Phase 0–2”; for those completed runs, Phase N
maps directly to milestone MN. New planning should use milestone IDs M0–M9.
Implementation status does not imply human review, approval, publication, or
canonical status.

## Current position

```text
M0 Project Definition          → implemented in repository
M1 Knowledge Kernel            → implemented; ontology questions remain open
M2 Validation Kernel           → implemented; hosted CI proven
M3 Reference Knowledge Corpus  → implemented; final independent re-audit passed
M4 Knowledge Graph             → implemented; independent M4 audit is next
M5 Hybrid Retrieval            → future
M6 Architecture RAG            → future
M7 Decision Assistant          → future
M8 Review Platform             → future
M9 Production Platform         → future
```

## M2 release-gate result

The independent M2 audit and local hardening are complete:

- active concept allocations require unique non-null `human_key` values, while `previous_human_keys` preserve rename resolution and reserve old keys;
- a governed vocabulary mapping registry detects registry-only, schema-only, missing, stale, duplicate, and assignability drift;
- claim grounding rejects direct and indirect cycles, unresolved claim references, forbidden sources, and invalid mixed evidence chains;
- source lifecycle states, transitions, authority, evidence eligibility, terminality, and replacement requirements are machine-readable;
- 16 test files and 56 tests pass, including negative and regression cases;
- coverage gates pass at 95.73% statements and 82.31% branches;
- focused mutation testing passes at 71.15% globally with a 60% break threshold; relationship validation is the weakest file at 59.72%;
- the workflow runs full tests and coverage on Linux and Windows, plus mutation testing on Linux, from a frozen pnpm lockfile.

Hosted run 30431428690 passed on Ubuntu, Windows, and the separate Linux
mutation job for commit `c47f391`. M2 is complete. M3 is eligible for an
explicitly scoped next run; no production knowledge or reference unit was created
during hardening.
## M0 — Project Definition

Purpose: establish project direction and boundaries.

Implemented outputs:

- project charter and north star;
- goals and non-goals;
- target product boundaries;
- initial domain coverage;
- success criteria;
- strategic roadmap.

Status: implemented in repository; project charter accepted by the project
owner on 2026-07-29.

## M1 — Knowledge Kernel

Purpose: establish the grammar and governance of the knowledge system.

Implemented outputs:

- ontology and taxonomy registries;
- concept and relationship types;
- claim and evidence model;
- canonical ID model;
- lifecycle and source governance;
- JSON Schemas;
- repository structure;
- layered `AGENTS.md` instructions.

Status: implemented and bootstrap-validated. Unresolved taxonomy questions and
ontology risks remain documented.

## M2 — Validation Kernel

Purpose: enforce repository contracts deterministically.

Implemented outputs:

- schema, ID, source, claim, relationship, lifecycle, Markdown, and link
  validators;
- immutable ID ledger and lifecycle event registry;
- valid, invalid, boundary, and regression fixtures;
- test suite, coverage gates, focused mutation testing, and cross-platform CI;
- registry-schema consistency and transitive claim-grounding checks;
- deterministic integrity reports;
- stable pnpm commands.

Exit criteria currently satisfied in the local execution environment:

```text
Clean checkout
→ pnpm install --frozen-lockfile
→ pnpm validate
→ pnpm test
→ pnpm test:coverage
→ pnpm test:mutation
→ pnpm report:check
→ all pass
```

Status: implemented. Clean-checkout validation passed on hosted Ubuntu and
Windows, and the separate Linux mutation job passed.

## M3 — Reference Knowledge Corpus

Purpose: prove that the ontology and validators work against researched
architecture concepts.

Initial scope is the 20 draft reference knowledge units defined by the project
execution specification, with registered sources, first-class claims, typed
relationships, trade-offs, failure modes, alternatives, and quality-attribute
impacts.

Exit criteria:

- every unit passes all validators;
- important claims have admitted evidence;
- references and relationships resolve;
- orphan concepts are explained or corrected;
- all content remains below human-reviewed lifecycle states unless humans act.

Status: implemented, machine-validated, remediated, and independently
re-audited. The final M3 regression re-audit recorded `M4 READY`; see
`docs/m3-final-regression-reaudit-report.md`. No content crossed the
human-review boundary.

## M4 — Knowledge Graph and Query Layer

Purpose: make governed relationships programmatically consumable.

Implemented outputs:

- concept, relationship, source, and claim indexes;
- generated knowledge graph;
- graph query CLI or API;
- traversal and dependency rules;
- deterministic generated-artifact checks.
- versioned graph manifest, traversal policy, and orphan analysis;
- exact record, neighbor, traversal, path, claim, evidence, explanation,
  dependent, list, and structured-query commands;
- focused graph coverage, mutation, production-contract, and cross-platform CI
  gates.

Example query:

```text
Find patterns that:
- improve recoverability;
- require idempotency;
- introduce eventual consistency.
```

Status: implemented; independent M4 audit is next. The production projection
contains 139 nodes and 261 edges, accounts for all 24 relationship records, and
permits 8 governed relationships in default traversal while preserving 16
explicit exclusions. Hosted Ubuntu, Windows, legacy mutation, focused graph
mutation, and graph-currentness gates passed on implementation commit
`9825216cffc97c162cc2514a44b09f0283c9d7be`. M5 has not started; see
`docs/m4-implementation-report.md`.

## M5 — Search and Hybrid Retrieval

Purpose: retrieve relevant knowledge accurately while preserving traceability.

Target pipeline:

```text
Query
→ metadata filtering
→ keyword or full-text retrieval
→ vector retrieval
→ graph expansion
→ reranking
→ context assembly
```

An initial implementation may use PostgreSQL full-text search plus pgvector.
Elasticsearch or a dedicated graph database should be introduced only when
measured requirements justify them.

Exit criteria:

- exact terminology is retrievable;
- semantic queries retrieve relevant concepts;
- related concepts can be expanded through governed edges;
- evidence and citations remain attached.

Status: future; depends on M4 and sufficient corpus coverage.

## M6 — Architecture RAG MVP

Purpose: answer architecture questions from governed repository evidence.

Planned outputs:

- ingestion and chunking pipeline;
- embedding and hybrid retrieval pipeline;
- graph-aware context builder;
- citation generation;
- prompt and tool contracts;
- evaluation dataset.

Answers must distinguish sourced claims, synthesis, inference, recommendation,
and unresolved uncertainty.

Exit criteria:

- answers include resolvable citations;
- retrieval relevance and unsupported claims are measurable;
- recommendations incorporate context and constraints.

Status: future; depends on M5.

## M7 — Architecture Decision Assistant

Purpose: turn governed knowledge into contextual decision support.

Planned capabilities:

- context intake and architectural-driver extraction;
- constraint and quality-attribute prioritization;
- option generation and filtering;
- trade-off and risk comparison;
- evolution triggers;
- ADR, RFC, and PAD draft generation.

```text
Project Context
→ Architectural Drivers
→ Candidate Options
→ Constraint Filtering
→ Trade-off Evaluation
→ Recommendation
→ Decision Artifact
```

Automation must not approve decisions.

Status: future; depends on M6 and representative decision guides.

## M8 — Architecture Review Platform

Purpose: assist reviews of designs and engineering repositories.

Planned capabilities:

- review RFC, PAD, and SAD artifacts;
- detect missing quality requirements and unsupported decisions;
- detect absent alternatives and cargo-cult reasoning;
- map implementation to standards and decisions;
- generate traceable review findings;
- track waivers and exceptions.

Status: future; depends on M6–M7.

## M9 — Production Knowledge Platform

Purpose: operate the platform sustainably within an organization.

Planned outputs:

- documentation website;
- authentication and authorization;
- ownership and review workflow;
- audit log and versioning;
- freshness checks;
- observability and feedback;
- usage analytics and cost controls.

Status: future; depends on demonstrated value from earlier milestones.

## Parallel workstreams

### Knowledge track

```text
Ontology
→ reference concepts
→ domain batches
→ cross-domain relationships
→ continuous review
```

### Platform track

```text
Repository
→ validators
→ graph and indexes
→ retrieval
→ RAG
→ product applications
```

### Governance track

```text
Source policy
→ review workflow
→ approval authority
→ freshness policy
→ quality metrics
```

Platform delivery must not outrun knowledge quality or governance maturity.

## Domain expansion order

After the reference corpus stabilizes:

1. Foundations and Quality Attributes
2. Distributed Systems and Integration
3. Application Architecture
4. Data Architecture
5. Security Architecture
6. Cloud and Platform Architecture
7. Reliability and Observability
8. Delivery and Deployment
9. Governance and Documentation
10. Business and Enterprise Architecture

The order puts quality attributes and constraints before patterns and
technologies so later recommendations can be explained contextually.
