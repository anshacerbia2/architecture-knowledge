# Decision Guide Authoring

These are reusable governed guides, not project decisions or executable agents.

- Keep new guides `proposed`; leave human review fields empty until authorized.
- Allocate AKG IDs in the ledger. For the M7.2 pilot, use opaque IDs for exact
  graph lookup and the catalog for human-readable titles. Titles are not aliases.
- Bind selection judgments to recommendation claims; descriptive mechanism
  evidence does not by itself establish a recommendation or measured benefit.
- Preserve each claim condition and transitive evidence qualifier. Conditions
  needed for safe selection belong in selection rules, not only in a matrix.
- Distinguish alternatives from complementary controls and reasoning lenses.
  Do not compare an architectural style with an orthogonal internal pattern.
- Mark unmeasured assessments `unknown`; do not invent scores or causal effects.
- An edge-local constraint binding must name its scope. A generic Constraint
  node is not proof of project compliance or several independent constraints.
- Keep conditions as text when local to the guide. Introduce reusable concepts
  only with a separately justified semantic allocation and evidence.
- New bindings need admitted sources and locator-complete transitive support.
  A source admission is not approval of the resulting selection judgment.
- Run full validation, graph/retrieval generation and freshness checks, and
  real-corpus integration tests after edits. Do not hand-edit generated files.
- No project sessions, personal data, credentials, runtime, provider calls,
  accepted decisions, or generated ADR/RFC/PAD artifacts belong here.

See the [pilot catalog and boundaries](../docs/m7-2-corpus-pilot.md).
