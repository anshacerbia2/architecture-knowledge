# Architecture Knowledge System

This repository is the kernel of a version-controlled architecture reasoning
system. It defines how architecture knowledge will be identified, classified,
supported by evidence, related, governed, and evolved before substantive
knowledge units are authored.

## Current scope

The repository currently implements M0 (project definition), M1 (knowledge
kernel), and M2 (validation kernel):

- ontology registries and architecture classification facets;
- stable canonical identifier rules;
- JSON Schemas for kernel records;
- source, claim, and evidence governance;
- lifecycle and contribution rules;
- layered instructions for future agents;
- a strategic milestone roadmap;
- deterministic TypeScript validators, fixtures, CI, and integrity reports.

It intentionally contains no reference knowledge units, decision-guide
examples, generated knowledge graph, or publication output. Those belong to
later milestones.

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
- `docs/`: historical execution reports, ADRs, and provisional kernel decisions.
- `roadmap/`: machine-readable implementation plan.
- `ids/` and `governance/`: immutable allocation ledger and lifecycle events.
- `validation/`: predicate-cycle and Markdown validation policy.
- `src/` and `tests/`: committed validation kernel and synthetic fixtures.
- `generated/integrity/`: deterministic, generated integrity reports.

## Extending the kernel

Before authoring content, read the root `AGENTS.md`, then every `AGENTS.md`
between the repository root and the target file. Follow
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the authoring workflow and
[`CODE_OF_KNOWLEDGE.md`](CODE_OF_KNOWLEDGE.md) for evidence rules.

The M2 hardening audit is complete locally. Reference knowledge must remain
draft and M3 must not begin until the Linux and Windows jobs in the committed CI
matrix both pass from a clean remote checkout.

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
```

Focused `validate:*` commands are listed in the root `AGENTS.md` and
`package.json`.