# Repository Instructions

## Mission and precedence

Build a durable architecture reasoning system, not a collection of articles.
Repository-local instructions closer to a file add constraints but cannot
weaken this file. In conflicts, preserve evidence traceability, explicit
uncertainty, human review authority, and stable identifiers.

## Scope boundaries

- Treat ontology, schema, and identifier changes as migrations.
- Do not create substantive knowledge units until the validation kernel exists.
- Do not hand-edit future files under `generated/`.
- Do not mark content `reviewed` or `published`, or describe it as approved or
  canonical, without an explicit authorized human transition.

## Source and claim policy

- Significant factual and normative statements require first-class claims.
- Claims must identify their epistemic type and registered source support.
- Recommendations require context, conditions, alternatives, and trade-offs.
- Inferences, hypotheses, and opinions must remain visibly classified.
- Conflicting claims must coexist with scope and contradiction records; do not
  silently choose a winner.
- Never mirror source text. Use short attributed quotations only when necessary.

## Ontology rules

- Give each concept exactly one primary concept type.
- Do not use a domain or architecture dimension as a concept type.
- Use secondary types sparingly and explain them in content.
- Model independently composable dimensions separately.
- Use only registered relationship predicates and obey their domain, range,
  direction, condition, and evidence rules.
- Prefer precise predicates over `related-to`.

## Identifier rules

- Allocate IDs from `ontology/identifier-namespaces.yaml`.
- IDs are immutable, globally unique, never recycled, and independent of title,
  path, domain, and detailed concept type.
- Renames and moves retain IDs. Merges and splits require explicit migration
  records; never silently repurpose an ID.

## Lifecycle rules

- New knowledge begins at `proposed`.
- Automation may not cross either human-only transition:
  `human-review -> reviewed` or `reviewed -> published`.
- Validation success is evidence about a record, not human approval.
- Source `approved` status only admits a source for evidentiary use.

## Content quality

For every architectural choice, require applicability, non-applicability,
forces, benefits, costs, risks, failure modes, alternatives, operational and
security consequences, quality-attribute effects, and verification. Avoid
unqualified universal language such as "always," "never," and "best."

## Validation

Use pnpm only. The committed validation boundary is:

- `pnpm validate`: strict typecheck plus schema, ID, source, claim,
  decision-guide, relationship, lifecycle, Markdown, and link validation.
- `pnpm validate:schema`: YAML/JSON parsing, metaschema, reference resolution,
  and registered instance validation without coercion.
- `pnpm validate:ids`, `validate:sources`, `validate:claims`, `validate:decision-guides`,
  `validate:relationships`, `validate:lifecycle`, `validate:markdown`, and
  `validate:links`: focused semantic gates.
- `pnpm report:integrity`: regenerate deterministic reports under
  `generated/integrity/`.
- `pnpm report:check`: fail when generated reports are missing or stale.
- `pnpm test`: execute positive, negative, boundary, and regression fixtures.
- `pnpm test:coverage`: enforce coverage gates on the high-risk validation boundary.
- `pnpm test:mutation`: enforce the mutation-score gate for ID, claim,
  relationship, and lifecycle logic.
- `pnpm format:check`: check the executable M2 boundary.

Run `pnpm install --frozen-lockfile` from a clean checkout. Do not hand-edit
files under `generated/`.

## Definition of done

A kernel change is done only when affected registries and schemas agree,
examples remain non-authoritative, cross-references resolve, migrations and
unresolved questions are recorded, and no status exceeds authorized lifecycle
boundaries.

## Navigation

- `ontology/AGENTS.md`: semantic registries and migration discipline.
- `schemas/AGENTS.md`: schema compatibility and validation contracts.
- `sources/AGENTS.md`: source admission and quality assessment.
- `claims/AGENTS.md`: claim and evidence representation.
- `relationships/AGENTS.md`: edge semantics.
- `knowledge/AGENTS.md`: future knowledge-unit authoring.
- `knowledge/security/AGENTS.md`: security evidence rules.
- `knowledge/data/AGENTS.md`: data concern separation.
- `knowledge/distributed-systems/AGENTS.md`: distributed-system assumptions.
- `ids/AGENTS.md`: immutable allocation and tombstone rules.
- `governance/AGENTS.md`: lifecycle event authority and audit rules.
- `validation/AGENTS.md`: validator policy change discipline.
- `tests/AGENTS.md`: synthetic fixture and regression requirements.
- `generated/AGENTS.md`: generated-output protection.
