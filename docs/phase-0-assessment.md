# Phase 0 Repository Assessment

Date: 2026-07-28

## Initial state

The working directory contained no files and was not a Git repository. There
were no conventions, package manager configuration, licenses, existing
knowledge, generated output, or repository-local instructions to preserve.

Available bootstrap tooling:

- Node.js 24.11.1 and npm 11.6.2;
- Python 3.13.3;
- PyYAML 6.0.3;
- jsonschema 4.21.1;
- Git 2.39.0.

No dependencies were downloaded. Phase 2 must choose and pin a repository
toolchain rather than depend on globally installed Python packages.

## Scope resolution

The attached master prompt asks the immediate task to implement Phases 1–6,
while the run-specific instruction limits work to Phases 0–1 and explicitly
forbids the 20 reference knowledge units. The narrower run instruction governs.

## Assessment findings

The proposed repository tree prematurely separates `anti-patterns`,
`failure-modes`, `fitness-functions`, and other concept types from `knowledge/`.
That would encode concept type in paths while other types live by domain. This
kernel instead treats storage layout as non-semantic and makes type, domain, and
dimension explicit metadata.

The proposed ontology mixes record kinds (`Source`, `Claim`, `Relationship`),
concept types (`Pattern`, `Tactic`), and specialized entities
(`QualityAttributeScenario`). These are separated into record kinds and concept
types.

The proposed concept list also mixes abstraction levels:

- `Pattern` is broader than design, integration, data, and architecture
  patterns.
- `Artifact` can mean documentation, deployable, or runtime artifact.
- `Control` is normally a security or governance mechanism, not a peer of every
  architecture concept.
- `QualityAttributeScenario` is an assessment record about a quality attribute,
  not itself a quality attribute.
- `Alternative` is usually a role a concept plays within a decision, not a
  durable intrinsic concept type.

The proposed lifecycle conflicts with examples that use `draft`, while the
normative lifecycle uses `drafted`. The kernel selects `drafted` and documents
the discrepancy.

The suggested concept-type-specific IDs would become misleading after valid
reclassification. The kernel uses opaque record-kind namespaces.

## Missing architecture dimensions

The original decomposition, internal structure, interaction, and execution
examples are necessary but incomplete. The kernel adds data ownership and
consistency, state management, tenancy, trust, resilience, observability,
delivery/evolution, governance, and organizational ownership as independent
dimensions.

## Bootstrap validation procedure

Until Phase 2 commits validators, the applicable checks are:

1. Parse every YAML file using a YAML 1.2-compatible parser.
2. Parse every JSON Schema and validate its metaschema.
3. Verify local Markdown links resolve.
4. Check registry IDs and keys for duplicates.
5. Check schema enums against ontology registries.
6. Confirm no lifecycle value implies review, approval, publication, or
   canonical status for created content.

Results from this run are reported in the final handoff; this document does not
claim ongoing automated enforcement.
