# Architecture Knowledge System

This repository is the kernel of a version-controlled architecture reasoning
system. It defines how architecture knowledge will be identified, classified,
supported by evidence, related, governed, and evolved before substantive
knowledge units are authored.

## Current scope

The repository currently implements M0 through M6: project definition,
knowledge and validation kernels, the reference corpus, a deterministic
knowledge graph/query layer, hybrid retrieval, and a governed architecture RAG
implementation under focused audit remediation:

- ontology registries and architecture classification facets;
- stable canonical identifier rules;
- JSON Schemas for kernel records;
- source, claim, and evidence governance;
- lifecycle and contribution rules;
- layered instructions for future agents;
- a strategic milestone roadmap;
- deterministic TypeScript validators, fixtures, CI, and integrity reports;
- twenty drafted reference knowledge units plus four supporting failure-mode
  concepts, with first-class claims, admitted evidence, and typed relationships;
- versioned graph and exact metadata indexes with a default-deny query CLI;
- deterministic semantic retrieval units, PostgreSQL full-text search,
  pgvector, weighted rank fusion, governed graph expansion, and bounded
  evidence packets.
- versioned RAG request/context/output contracts, epistemically labeled answers,
  application-resolved citations, fail-closed grounding checks, deterministic
  evaluation, and a production OpenAI Responses adapter.

It intentionally contains no decision-guide examples, decision-assistant
workflow, ADR generation, conversational memory, graph database, or publication
output. Those belong to later milestones.

## Classification model

Classification is multi-axial:

1. `record_kind` distinguishes stored records such as concepts, sources,
   claims, and relationships.
2. `type` gives a concept exactly one primary semantic type.
3. `secondary_types` records justified secondary interpretations.
4. `domain` and `subdomains` locate subject matter without defining what the
   concept is.
5. `dimensions` records independently composable architecture dimensions such
   as decomposition, interaction, deployment, and data consistency.

The registries under [`ontology/`](ontology/) are the controlled vocabulary.
The contracts under [`schemas/`](schemas/) are the machine-enforced shape.

## Canonical IDs

Canonical identifiers are opaque within broad record-kind namespaces:

```text
AKC-000001  concept
AKS-000001  source
AKL-000001  claim
AKR-000001  relationship
AKG-000001  decision guide
```

IDs are never reused and do not change when a title, file path, domain, or
concept type changes. See
[`ontology/identifier-namespaces.yaml`](ontology/identifier-namespaces.yaml).

## Lifecycle

Knowledge content begins at `proposed`. Automation may advance it only through
validation-oriented states up to `human-review`. Only an explicitly authorized
human may transition content to `reviewed` or `published`. Nothing in this
repository is currently reviewed, approved, published, or canonical.

Source records use a separate source-admission lifecycle. A source marked
`approved` means approved for use as evidence; it does not approve any claim or
knowledge unit.

## Project direction

- [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md): stable purpose, north star,
  boundaries, and success criteria.
- [`ROADMAP.md`](ROADMAP.md): milestones M0–M9, current position, and next
  bounded scope.

## Repository map

- `ontology/`: controlled vocabularies and semantic constraints.
- `schemas/`: JSON Schema Draft 2020-12 contracts.
- `sources/`: source admission policy and the source registry.
- `claims/`: instructions for first-class claim records.
- `relationships/`: instructions for typed graph edges.
- `knowledge/`: domain-local authoring rules; no knowledge units yet.
- [`docs/`](docs/README.md): ordered historical reports, audits, remediations,
  ADRs, and provisional kernel decisions.
- `roadmap/`: machine-readable implementation plan.
- `ids/` and `governance/`: immutable allocation ledger and lifecycle events.
- `validation/`: predicate-cycle and Markdown validation policy.
- `src/` and `tests/`: committed validation kernel and synthetic fixtures.
- `generated/integrity/`: deterministic, generated integrity reports.
- `generated/graph/` and `generated/indexes/`: deterministic M4 graph and exact
  metadata views; never hand-edit them.
- `generated/retrieval/`: deterministic M5 retrieval units and manifest;
  vectors remain operational database state and are not committed.

## Extending the kernel

Before authoring content, read the root `AGENTS.md`, then every `AGENTS.md`
between the repository root and the target file. Follow
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the authoring workflow and
[`CODE_OF_KNOWLEDGE.md`](CODE_OF_KNOWLEDGE.md) for evidence rules.

M2 hardening is complete. M3 passed its final independent regression re-audit.
M4 passed its independent adversarial audit. M5 then passed its focused
independent evidence re-audit after its initial audit returned inconclusive only
because runtime evidence was unavailable in that environment. See
[`docs/m5-focused-evidence-reaudit-report.md`](docs/m5-focused-evidence-reaudit-report.md)
for the `M6 READY` entry decision. The first M6 audit and its focused re-audit
both recorded `M6 NOT READY`. A second focused remediation addresses the two
remaining citation-authority and adversarial-evaluation blockers, but still
requires exact-SHA hosted validation and independent re-audit. M7 is not open.

## Validation commands

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm validate
pnpm validate:vocabulary
pnpm validate:claim-grounding
pnpm test
pnpm test:coverage
pnpm test:mutation
pnpm report:check
pnpm graph:generate
pnpm graph:check
pnpm graph:query -- get AKC-000018
pnpm test:mutation:graph
pnpm retrieval:units:check
pnpm retrieval:db:up
pnpm retrieval:migrate
pnpm retrieval:index
pnpm retrieval:check
pnpm retrieval:query -- "AKC-000014" --mode hybrid --json
pnpm retrieval:evaluate
pnpm retrieval:benchmark
pnpm test:mutation:retrieval
pnpm rag:context -- "What issuer check is required for an OpenID Connect ID Token?"
pnpm rag:answer -- "What issuer check is required for an OpenID Connect ID Token?" --json
pnpm rag:evaluate
pnpm test:mutation:rag
```

Focused `validate:*` commands are listed in the root `AGENTS.md` and
`package.json`.
