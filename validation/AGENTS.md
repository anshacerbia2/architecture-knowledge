# Validation Policy Instructions

- Every registered relationship predicate must have exactly one cycle policy.
- Add policy changes with positive, negative, and edge-case tests.
- Do not move a predicate to a weaker cycle policy merely to accept bad data.
- Markdown heuristics must report stable diagnostic codes and include regression
  fixtures for false-positive fixes.
- Policy changes must not silently resolve ontology questions.
