# Ontology Cross-Domain Stress Test

Status: proposed analysis. The examples below are hypothetical shapes, not
knowledge records or factual architecture claims.

## Test method

Attempt representative questions from the target system using only registered
record kinds, concept types, dimensions, and relationship predicates. A pass
means the model can represent the reasoning without retyping a concept or
forcing it into a domain hierarchy. It does not establish that any example
claim is true.

| Reasoning path | Required model shape | Result |
| --- | --- | --- |
| Business goal to engineering verification | business-goal → influences → architectural-driver → constrains → decision → implemented-by → pattern → verified-by → fitness-function | Representable |
| Pattern trade-off across qualities | architectural-pattern → improves → quality-attribute and architectural-pattern → degrades → quality-attribute, with different conditions and claims | Representable |
| Security risk treatment | security-control → mitigates → risk; control → degrades → quality-attribute; each edge cites a scoped claim | Representable |
| Data residency decision | constraint in security/privacy or data domain → constrains → decision-guide; guide options are concepts from cloud and data domains | Representable |
| Reliability measurement | quality-attribute → measured-by → metric → verified-by is intentionally not implied; a separate claim or fitness function supplies verification | Representable without conflating measurement and verification |
| Source disagreement | claim → contradicted-by ↔ claim; each claim → supported-by → its own source | Representable |
| Decomposition plus interaction | one system can reference concepts classified under system-decomposition and interaction dimensions without making them alternatives | Representable |
| Organizational prerequisite | engineering practice or architectural style → requires → context-condition or concern in organizational ownership dimension | Representable |

## Boundary tests

### Same label, different abstraction

“Adapter” can denote a design pattern, an architectural boundary mechanism, or
an integration pattern. The model does not merge these by title. Separate
concept IDs can use different primary types and be connected by `related-to`,
`specializes`, or `implemented-by` only when supported.

### Contextual role versus intrinsic type

A technology, pattern, or style may be an option in a decision. It remains its
intrinsic concept type; the decision guide assigns it the role of alternative.
No `alternative` knowledge-unit type is needed.

### Umbrella quality versus measurable property

Security and maintainability may act as quality families, while confidentiality
or modifiability are narrower assessable properties. The current registry can
record both but does not yet enforce family inheritance. This remains an
ontology risk.

### Concept versus record

A quality-attribute scenario is modeled as a concept with a specialized schema.
A claim about that scenario is a separate claim record. A source supporting the
claim remains a source record. This prevents evidence metadata from becoming a
concept-type hierarchy.

## Gaps exposed

1. No first-class system, organization, person, or project instance model exists.
   `Example` is insufficient for a future operational architecture inventory.
2. Relationship endpoint constraints use record kinds and selected concept
   types, and M2 enforces them because JSON Schema cannot resolve
   referenced records.
3. Organizational ownership is a dimension, but there are no dedicated team,
   ownership, or responsibility relationship predicates.
4. Temporal validity is not first-class. Conditions can state time bounds, but
   claims and relationships may eventually need `valid_from` and `valid_until`.
5. Scope is prose-first. A future context model may need reusable workload,
   jurisdiction, system-boundary, and maturity nodes.
6. `is-a`, `specializes`, and `generalizes` remain easy to misuse even with
   definitions; M2 includes examples and negative fixtures; semantic misuse remains an audit risk.

## Conclusion

The kernel supports the target cross-domain reasoning paths without a flat
taxonomy. It is adequate for validation-kernel implementation, subject to the
gaps above and the unresolved decisions in `kernel-decisions.md`.
