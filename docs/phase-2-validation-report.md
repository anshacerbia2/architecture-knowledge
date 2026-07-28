# Phase 2 Validation Kernel Report

Date: 2026-07-29

Status: implementation report. It is not a human review, approval,
publication, or canonical designation.

## Scope

Only Phase 2 was implemented. No production knowledge unit, reference unit,
decision-guide example, case study, learning path, or production source was
created.

## Toolchain

- Node.js 24.11.1;
- pnpm 10.23.0;
- TypeScript 5.9.3 and tsx 4.20.6;
- AJV 8.17.1 and ajv-formats 3.0.1;
- yaml 2.8.1;
- Vitest 4.0.16;
- Prettier 3.8.1.

All versions are exact and `pnpm-lock.yaml` is committed. The rationale and
trade-offs are recorded in ADR 0001.

## Validators

The committed CLI implements:

- strict YAML and JSON parsing, Draft 2020-12 metaschema checks, schema-reference
  resolution, registered record mapping, and non-coercing instance validation;
- global IDs, record-kind prefixes, ledger allocation and retirement, aliases,
  controlled keys, and cross-record references;
- source admission, quality completion, restrictions, claim epistemic types,
  evidence requirements, and stale or rejected source handling;
- relationship endpoint kinds and concept types, direction, self-relations,
  conditions, evidence, duplicates, conflicts, inverse consistency, precision
  warnings, and predicate-specific cycles;
- lifecycle event chains, valid transitions, human-only authorization, and
  replacement requirements;
- knowledge-unit headings, required and empty sections, placeholders,
  unqualified absolutes, trade-offs, failure modes, threat assumptions, and
  claim/source references;
- local Markdown file and anchor links.

## Tests and fixtures

The suite contains synthetic valid, invalid, boundary, and regression fixtures.
Nine test files contain 25 tests. Every validator has positive and negative
coverage, with edge cases for duplicate YAML keys, retired IDs, deprecated
evidence, unauthorized lifecycle events, allowed and forbidden cycles,
imprecise relationships, not-applicable reasons, missing links, duplicate
controlled keys, cycle-policy coverage, and stale generated output.

Fixture identifiers use the isolated `900000` range and are excluded from
production discovery.

## Generated reports

Twelve deterministic JSON reports are generated under `generated/integrity/`:

- duplicate IDs;
- duplicate keys;
- unresolved references;
- orphan records;
- relationship cycles;
- source usage;
- deprecated source usage;
- lifecycle distribution;
- ontology vocabulary coverage;
- schema coverage;
- Markdown link integrity;
- overall diagnostic summary.

Generated files validate against the integrity-report schema and are checked
byte-for-byte by `pnpm report:check`.

## Commands and observed results

The implementation run executed:

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm validate:schema
pnpm validate
pnpm test
pnpm report:integrity
pnpm report:integrity
pnpm report:check
```

Observed final results:

- formatting check: passed;
- complete validation: 0 errors, 0 warnings;
- tests: 9 files passed, 25 tests passed;
- report generation: 12 reports written;
- second-generation freshness check: 12 of 12 current.

The dependency directory was removed and restored from the frozen lockfile
before the final audit commands.

## M2 hardening audit follow-up

The independent audit reproduced three gaps in the initial boundary: nullable
concept `human_key` values, ontology registry changes that could drift from
schema enums, and cyclic claim derivations with no admitted source foundation.
The hardening run corrected all three without creating production knowledge.

Additional committed controls:

- Git baseline commit `9299075` on `main`;
- non-null, globally unique `human_key` values for active concept allocations;
- registry-schema consistency checks for concept, domain, dimension, lifecycle,
  maturity, claim, relationship, and source vocabularies and conditional rules;
- claim derivation cycle detection and transitive admitted-source grounding;
- regression coverage for previously untested ID, evidence, lifecycle, and
  relationship diagnostics;
- coverage gates of 90% statements, 70% branches, 90% functions, and 90% lines;
- focused mutation testing with a 60% breaking threshold;
- a GitHub Actions matrix for `ubuntu-latest` and `windows-latest`.

Observed local hardening results:

- validation: 0 errors and 0 warnings;
- tests: 13 files and 42 tests passed;
- coverage: 97.83% statements, 82.72% branches, 97.97% functions, and 98.11%
  lines;
- mutation score: 70.16%, above the 60% breaking threshold;
- integrity reports: 12 generated twice and 12/12 confirmed current.

Remote Linux and Windows workflow results remain the final M2 release gate.
## ID strategy assessment

The opaque record-kind IDs remain appropriate, but sequential allocation is
unsafe under uncoordinated parallel authoring. The new immutable ledger detects
duplicate allocation, wrong prefixes, path drift, missing allocations, and
retired-ID reuse. It does not provide a distributed allocation lock.

ADR 0002 recommends retaining existing IDs, keeping human-readable keys outside
canonical identity, and requiring a non-null concept `human_key` before concurrent M3 authoring.

## Known gaps

- Git history now begins at the explicit baseline commit, but validators do not
  yet compare ledger allocations against historical revisions.
- Human authorization evidence is structurally required but cannot be verified
  cryptographically or organizationally.
- Explicit inverse edges are checked for consistency when present; inverse edge
  materialization is not required.
- Markdown link validation covers inline links and headings, not every
  reference-style Markdown extension.
- Absolute-language and threat-assumption checks are deterministic heuristics
  and require audit against a larger synthetic corpus.
- Source-admission transition rules are committed in code because M1 did
  not define a machine-readable transition registry.
- The phase produces integrity reports, not the future knowledge graph or
  semantic indexes.

## Remaining release gate

Push `main` to the intended remote and require both clean Linux and Windows CI
jobs to pass. M3 must remain blocked until that evidence exists. Heuristic
false-positive review and source-transition registry extraction remain explicit
follow-up risks; neither authorizes production knowledge generation by itself.
