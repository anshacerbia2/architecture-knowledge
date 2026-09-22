# Architecture Knowledge System

This repository is the kernel of a version-controlled architecture reasoning
system. It defines how architecture knowledge will be identified, classified,
supported by evidence, related, governed, and evolved before substantive
knowledge units are authored.

## Local app workspace

Atlas lives in [apps/atlas](apps/atlas/README.md), with a compiled public kernel API
and one pnpm lockfile. From this repository root: `pnpm install --frozen-lockfile`,
`pnpm build`, then `pnpm app:start`. Open http://127.0.0.1:4310.
Server configuration belongs in `apps/atlas/.env` (ignored by Git).
See [structural hardening](docs/structural-integration-hardening.md) for snapshot
semantics, principal-review dispositions and validation evidence.

Atlas includes provider adapters for OpenAI, OpenRouter free and Antigravity CLI
in its existing Search/Ask flows; see [app setup and limits](apps/atlas/README.md).
These integrations are separate from the M7 decision-assistant runtime.
The [M7.3 runtime plan](docs/m7-3-decision-assistant-plan.md),
[snapshot-validation prerequisite](docs/m7-3-snapshot-validation.md), and
[local evaluator](docs/m7-3-local-evaluator.md) are now connected through the
[M7.3 implementation](docs/m7-3-implementation-report.md). Atlas exposes the
ephemeral Decision Assistant API/UI; independent audit and owner completion remain pending.

## Current scope

The repository currently implements M0 through M6, has completed M7.0, implements
the M7.1 validation kernel, and has owner-approved completion of the bounded
M7.2 three-guide pilot: project definition, knowledge and
validation kernels, the reference corpus, a deterministic knowledge graph/query
layer, hybrid retrieval, and a governed architecture RAG implementation:

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

The three decision guides remain proposed content. A local, deterministic kernel
runtime evaluates ephemeral sessions through the Atlas Decision Assistant API/UI.
There are no persisted project decision sessions, ADR generation,
conversational memory, graph database, or publication output.

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
knowledge corpus is currently reviewed, published, or canonical. Milestone
completion approval is separate from content review and source admission.

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
- `knowledge/`: reference concepts and domain-local authoring rules.
- `decisions/`: three proposed decision guides in the bounded M7.2 pilot.
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
for the `M6 READY` entry decision. The final independent M6 V4 re-audit closed
the remaining evaluation-provenance finding and recorded `M6 READY`; Ansha
Cerbia then explicitly approved M6 completion and M7.0, and authorized M7.1's
validation kernel. M7.1 implements closed guide, session, recommendation, and
draft-artifact contracts plus semantic, graph, retrieval, privacy, authority,
coverage, and mutation gates. The bounded M7.2 pilot is now complete with owner
approval; its three guides remain proposed. M7 decision-assistant runtime,
broader corpus expansion and artifact generators have not started. Atlas provider
integration for M6 Search/Ask is implemented separately. See
[`docs/m7-2-completion-approval.md`](docs/m7-2-completion-approval.md) and
[`docs/m7-decision-guide-kernel.md`](docs/m7-decision-guide-kernel.md).

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
