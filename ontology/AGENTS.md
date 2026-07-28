# Ontology Instructions

Ontology files are controlled registries, not knowledge units and not claims of
universal standardization.

- Keep record kinds, concept types, domains, and architecture dimensions
  separate.
- Every term needs an unambiguous definition and a stable machine key.
- Mark abstract and role-only types explicitly; do not allow them as a primary
  knowledge-unit type.
- Relationship changes must define direction, inverse or symmetry, allowed
  endpoint kinds, self-relation policy, condition requirements, and evidence
  requirements.
- Never rename or repurpose a used key without a migration record.
- Coordinate enum changes with all schemas and later validators.
- Record competing interpretations in `docs/kernel-decisions.md`.
