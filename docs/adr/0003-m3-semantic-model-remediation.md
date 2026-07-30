# ADR 0003 — M3 Semantic Model Remediation

Status: proposed implementation decision
Date: 2026-07-30

This record is not human-reviewed, approved, published, or canonical.

## Context

The independent M3 audit found source-scope overreach, mixed concept roles, causal quality edges standing in for terminology, artificial failure-mode recursion, weak graph relationships, and incomplete structured context. These defects are expensive to carry into traversal or retrieval.

## Decision

Use one primary concept type plus explicit contextual roles. Add `semantic-property` and `consistency-model` as assignable types. Add qualified structured statements with `edge-local` or `reusable-concept` scope. Every relationship records `semantic_scope` and an explicit future-traversal decision.

Weak or inferential edges remain visible for auditability but are ineligible for traversal. Traversal eligibility requires a sourced, concept-global relationship backed by sourced claims; inferential quality-impact evidence cannot support an eligible `improves` or `degrades` edge.

Availability and Reliability use a non-causal `overlaps-with` predicate under an explicit measurement condition. Precise predicates replace generic or misleading edges where useful: `supports-investigation-of`, `presents-risk-to`, and `can-occur-in-context-of`.

Structured metadata is authoritative for independently retrieved constraints, assumptions, risks, alternatives, examples, and counterexamples. Markdown expands that context for humans. Risks, alternatives, examples, and counterexamples are validated as projections of their structured statements; constraints and assumptions have no one-to-one Markdown section and remain structured authorities.

## Taxonomy decisions

| Tension | Previous classification | Selected classification | Contextual roles | Rejected alternatives | Reasoning | Migration impact |
|---|---|---|---|---|---|---|
| Idempotency | `tactic` | `semantic-property` umbrella | HTTP method semantics; operation characteristic; implementation tactic | One undifferentiated tactic; exactly-once synonym; multiple primary types | The semantic contract and its enforcement mechanisms are distinct, while the existing stable ID remains useful as a governed umbrella. | AKC-000011 retains ID; schema and vocabulary expand; AKL-000011 narrows to RFC 9110; retry edge is claim-context-only. |
| Eventual Consistency | `data-pattern` | `consistency-model` | Distributed-system property; architectural consequence; trade-off | Generic pattern; tactic | The admitted source describes a weak consistency model, not a reusable problem-solution arrangement. | AKC-000016 retains ID; type and mappings migrate; pattern retrieval no longer includes it. |
| Modular Monolith | `architectural-style` | `architectural-style` | Decomposition model; deployment topology | Pattern synonym; multiple primary types | Its organizing style remains primary, while logical decomposition and coordinated deployment are independent facets. | Metadata-only enrichment; no ID or primary-type change. |
| Observability | `quality-attribute` | `quality-attribute` | System property; operational capability; engineering discipline | Telemetry tool; unconditional reliability tactic | The unit requires scenarios and measures, while tooling and response practices remain distinct roles. | Metadata enrichment; unsupported causal relationship becomes a non-traversable investigation predicate. |
| OAuth 2.x | Ambiguous finalized version-family `protocol` | `OAuth 2.0 Authorization Framework` protocol | RFC 6749 base framework; RFC 9700 Security BCP governed; extension host | Finalized “2.x” family; silent OAuth 2.1 inclusion; multiple primary types | The admitted evidence covers OAuth 2.0 and its Security BCP, not a finalized OAuth 2.1 specification. | AKC-000017 retains ID; title, human key, path, aliases, security content, and claim boundaries migrate. |

## Relationship and condition decisions

Conditions that qualify only one edge remain `edge-local`. A first-class constraint, assumption, or context concept is created only when the condition has stable identity and reuse beyond that edge. Review of AKR-000001 through AKR-000024 found no existing empty-ID condition meeting that threshold; creating generic nodes would reproduce the audit's low-information problem.

The traversal flag is a governance boundary, not an endorsement or lifecycle status. It does not mark a relationship reviewed or canonical.

## Trade-offs

Explicit roles, qualified statements, and traversal decisions increase authoring volume and schema migration cost. They prevent downstream systems from reconstructing scope from chunk adjacency or treating a plausible edge as a sourced global fact.

Keeping weak records but excluding them preserves audit history and stable IDs. Removal could be cleaner for retrieval, but would lose the exact disposition and complicate ledger history before a lifecycle policy for relationship retirement exists.

## Deferred questions

- Whether later evidence justifies reusable condition concepts for retry budgets, convergence contracts, or token-consumer validation context.
- Whether Observability eventually needs a broader system-property type after measurable scenarios and retrieval use cases are evaluated.
- Whether a separate OAuth Security BCP concept is useful once the corpus admits enough profile and extension knowledge to justify graph traversal.
