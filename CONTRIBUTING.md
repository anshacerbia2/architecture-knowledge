# Contributing

## Before a change

Read all applicable `AGENTS.md` files. Determine whether the change affects a
record, ontology vocabulary, schema contract, or repository governance. For
ontology and schema changes, document compatibility and migration consequences
before editing.

## Kernel workflow

1. State the problem and affected contracts.
2. Check whether the proposal confuses record kind, concept type, domain, or
   architecture dimension.
3. Compare alternatives and choose the most reversible adequate model.
4. Update ontology and schema together.
5. Record unresolved questions instead of forcing false certainty.
6. Run all validation applicable to the current phase.
7. Leave lifecycle status at or below `human-review`.

## Future content workflow

For future production content:

1. Register candidate sources and evaluate them using the source-quality rubric.
2. Extract first-class claims with explicit epistemic types.
3. Resolve or represent source conflicts.
4. Author a knowledge unit from supported claims.
5. Add typed, conditional relationships.
6. Validate schemas, IDs, references, links, content, and lifecycle.
7. Request human review. Automation must not record the review outcome.

## Change compatibility

Adding optional fields or vocabulary values is normally backward compatible.
Removing or renaming fields, narrowing allowed values, changing predicate
semantics, or reusing an identifier is breaking. Breaking changes require a
documented migration and a repository version increment.

## Pull-request evidence

Changes should report files affected, decisions and assumptions introduced,
validation actually run, failures or warnings, and unresolved issues. Never
describe unreviewed material as canonical.
