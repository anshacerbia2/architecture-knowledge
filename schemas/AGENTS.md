# Schema Instructions

Schemas use JSON Schema Draft 2020-12.

- Keep common primitives in `_defs.schema.json`.
- Use `additionalProperties: false` for governed records.
- Coordinate enums with ontology registries.
- Prefer explicit nullable fields over omission when absence has lifecycle
  meaning.
- Add conditional constraints for epistemic, lifecycle, and relationship rules
  where JSON Schema can express them.
- Do not weaken a contract merely to accept an invalid fixture.
- Breaking changes require migration notes and a repository schema-version
  decision.
- M2 validators must enforce semantic constraints that JSON Schema cannot,
  including uniqueness, reference existence, lifecycle transition authority,
  predicate endpoint types, and Markdown section contracts.
