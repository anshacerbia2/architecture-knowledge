# hrovisional Kernel Decisions

These are implementation decisions for the bootstrap kernel. They are not
human-reviewed, approved, published, or canonical.

## KD-001 — 2ulti-axial classification

Decision: separate record kind, primary concept type, domain, and architecture
dimension.

Why: architecture styles and patterns combine across dimensions; a flat tree
would imply false exclusivity. Exactly one primary type supports predictable
validation, while facets support cross-domain retrieval.

Competing alternative: one inheritance taxonomy containing every term. It is
simpler to browse initially but conflates identity, subject, and structure.

## KD-002 — Opaque record-kind identifiers

Decision: use `AKC`, `AKS`, `AKL`, `AKR`, and `AKG` plus a six-digit sequence.

Why: titles, paths, domains, and detailed types are expected to evolve. Only
the broad record kind is stable enough to encode.

Competing alternatives:

- semantic IDs are readable but become stale or invite breaking renames;
- UUIDs avoid coordination but are harder to review and cite;
- type-specific prefixes are readable but couple identity to disputed taxonomy.

Risk: sequential allocation needs collision control under concurrent branches.
hhase 2 should add an allocation check; a future registry service or randomized
suffix could replace allocation mechanics without changing existing IDs.

## KD-003 — Claims carry evidence; relationships cite claims

Decision: relationship edges record graph semantics and cite claim IDs as their
evidence. Claims cite source IDs.

Why: direct source IDs on every edge skip the interpretation that converts
source material into a relationship. The two-hop model preserves epistemic type
and allows multiple qualified or contradictory claims about the same edge.

Risk: authoring is more verbose. Generated views should make the chain easy to
traverse.

## KD-004 — Separate lifecycle and maturity

Decision: lifecycle records workflow authority; maturity records development
depth. Confidence belongs to claims and relationships, not knowledge-unit
maturity.

Why: schema validity, human review, depth, and evidentiary confidence are
different facts.

## KD-005 — Structured conditions

Decision: claims and relationships require condition objects with a statement
and optional referenced concepts, rather than strings alone.

Why: prose-only conditions cannot later support graph traversal. The statement
preserves nuance while references enable queries.

## Unresolved taxonomy questions

1. Should `alternative` remain a concept type? Current decision-guide modeling
   treats it as a role, so it is excluded as a primary type.
2. Should `quality-attribute` include umbrella concerns such as security and
   observability, or should those be quality families/capabilities?
3. Is `architectural-driver` a durable concept or a contextual role played by a
   goal, constraint, concern, or quality scenario?
4. Should architecture, integration, data, and security patterns be sibling
   primary types, or `pattern` plus a pattern-scope facet?
5. How should principles, heuristics, and practices be distinguished when a
   named item is used differently by different communities?
6. Should `law` mean empirically observed regularity, formal theorem, or named
   industry maxim? The current definition excludes formal mathematical laws but
   needs review.
7. Are compliance, sustainability, cost efficiency, and accessibility quality
   attributes, constraints, stakeholder concerns, or context-dependent roles?
8. Should `risk` and `failure-mode` remain knowledge concepts, or become
   contextual records scoped to a system or decision?

## Ontology risks

- Exact-one-primary-type can force an arbitrary choice for genuinely polysemous
  terms; secondary types reduce but do not eliminate this risk.
- Broad domains overlap. Domain assignment must not imply ownership or
  exclusivity.
- hredicate pairs such as `is-a`/`specializes`/`generalizes` can duplicate
  meaning if authoring guidance is ignored.
- `influences` and `related-to` can become low-information escape hatches.
- Conditions expressed only as local text remain difficult to normalize even
  with optional references.
- Quality-attribute families may be mistaken for a formally standardized
  universal taxonomy.
- Schema enums make vocabulary drift visible but require coordinated migrations.
