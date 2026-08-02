# ADR 0005 — Knowledge Graph Projection and Traversal

Status: proposed implementation decision
Date: 2026-08-02

This record is machine-authored. It is not human-reviewed, approved, published,
or canonical.

## Context

The M3 corpus passed its final independent regression audit. Its concepts,
claims, admitted sources, qualified relationships, evidence chains, and explicit
traversal dispositions now need a deterministic machine interface. M4 must not
become an alternative semantic authority or introduce M5 retrieval behavior.

## Decision

Project the validated repository into versioned JSON artifacts committed under
`generated/graph/` and `generated/indexes/`. The repository records remain the
source of truth. Generation fails when repository validation or graph
validation fails, and `graph:check` compares expected bytes in memory without
rewriting the worktree.

The graph has four node families: concept, claim, source, and relationship.
First-class relationship records project as semantic graph edges. Additional
provenance edge families represent concept declarations, direct source support,
claim derivation, explicit claim applicability, and relationship evidence.
Relationship nodes allow `relationship -> supporting claim -> source`
provenance without treating relationship metadata as a concept.

Indexes preserve governed structured fields and add only deterministic
projection metadata such as normalized source paths, concept human keys, and
resolved evidence-chain summaries. They do not infer facts from Markdown links,
record adjacency, shared sources, or prose proximity.

## Traversal contract

Concept traversal is default-deny. An edge participates in multi-hop queries
only when its repository relationship explicitly sets `traversal.eligible` and
all enforced M3 conditions remain true: sourced lifecycle, concept-global
semantic scope, resolved concept endpoints, sourced claim evidence, admitted
source grounding, and the quality-impact evidence restriction. Repository
exclusion rationales are preserved verbatim. Policy-derived failures use stable
`policy:*` reason codes.

Edge-local conditions remain unevaluated edge qualifiers. They are returned in
query results but are not promoted into global facts or assumed satisfied. M4
does not implement a rules engine.

Directed edges are followed according to the requested direction. Incoming
inspection uses reverse adjacency while retaining the original predicate.
Symmetric relationships are stored once and may be inspected from either
endpoint. No inverse predicate is invented.

Traversal uses per-path visited-node protection, deterministic ordering, a
default depth of 3, and a hard maximum depth of 8. Excluded relationships and
provenance edges cannot enter concept traversal paths.

## Generated artifact policy

Every artifact carries `graph_contract_version: 1`. The generator contract is
version 1. Object keys, record families, stable IDs, predicates, targets, paths,
and adjacency references use deterministic ordering. Paths use `/`, and no
timestamp, random ID, absolute path, or environment value is emitted. The input
fingerprint hashes normalized governed records, relationship vocabulary,
validation policy, and identifier allocations.

The authoritative query output is a stable JSON envelope containing the query,
result count, results, diagnostics, and graph contract version. Exact
case-sensitive matching is used for IDs, human keys, titles, and metadata.
Fuzzy, semantic, and full-text matching are deferred to M5.

## Why an in-repository graph

The current corpus is small enough for maps and adjacency indexes. Committed
JSON is portable, reviewable, reproducible in clean checkouts, and compatible
with existing pnpm/TypeScript validation. A graph database would add migration,
deployment, synchronization, and trust-boundary costs without an M4 requirement.

## Rejected alternatives

- Neo4j or another graph database: unnecessary operational state and a second
  truth surface.
- PostgreSQL or pgvector: belongs to measured M5 retrieval decisions.
- Markdown link or chunk adjacency: lacks governed semantic meaning.
- Inferred traversal from resolved endpoints or shared sources: violates the M3
  traversal disposition and source-applicability boundaries.
- Rewriting excluded M3 edges: loses auditability and changes corpus semantics.
- Natural-language or LLM query interpretation: belongs to later retrieval and
  RAG milestones.

## Consequences and M5 migration

Consumers gain deterministic exact lookup, provenance, neighbors, bounded
paths, dependency inspection, and structured constraint queries. Committed
artifacts increase repository size and must be regenerated whenever governed
inputs change.

M5 may ingest these versioned artifacts or invoke the query library. It must
continue treating repository records as authoritative, preserve qualifiers and
evidence, and negotiate a contract migration if graph version 1 changes. M5
must not reinterpret excluded edges as retrieval expansion merely because they
exist in the graph.

