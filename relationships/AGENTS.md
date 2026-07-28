# Relationship Instructions

Relationships are qualified graph assertions.

- Use only predicates registered in `ontology/relationship-types.yaml`.
- Confirm endpoint record kinds and, where constrained, endpoint concept types.
- Set direction exactly as registered; store a symmetric edge once in a
  deterministic endpoint order.
- Do not create self-relations unless a future predicate explicitly allows one.
- Cite claim IDs as evidence. Do not bypass claims by citing sources directly.
- Include structured conditions whenever the predicate requires them.
- Treat `causes` and `solves` as strong claims requiring a supported mechanism
  or bounded acceptance criteria.
- Prefer a precise predicate over `influences`; use `related-to` only when the
  missing semantic distinction is documented.
- Compatibility, improvement, degradation, mitigation, and alternatives are
  contextual, not universal.
