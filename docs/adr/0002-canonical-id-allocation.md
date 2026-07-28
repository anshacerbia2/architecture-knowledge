# ADR 0002 — Canonical ID Allocation Assessment

Status: proposed recommendation  
Date: 2026-07-29

This record does not replace the M1 identifier decision and is not
human-reviewed, approved, published, or canonical.

## Current strategy

Canonical IDs use a record-kind prefix and six-digit monotonically increasing
sequence, for example `AKC-000001`. Titles, paths, domains, and detailed concept
types are not encoded.

## Assessment

The opacity and broad record-kind prefix remain sound: valid renames,
reclassification, and moves do not change identity.

Sequential allocation creates coordination risk:

- two parallel branches can allocate the same next number;
- rebasing may require changing an unmerged ID and every reference;
- a text-file “next value” counter would become a merge hotspot;
- gaps are harmless, but reuse of retired values would violate identity.

The strategy is acceptable for low-concurrency authoring only when an immutable
ledger is validated before merge. M2 therefore adds `ids/ledger.yaml`.
Every active record must have one allocation; retired allocations remain as
tombstones and cannot be reused.

## Human-readable key decision

Do not make a human-readable key part of canonical identity. Every active
concept allocation requires a globally unique, non-null `human_key` for
navigation and tooling, while the opaque `AKC-*` ID remains canonical. Titles
and aliases remain mutable labels. A `human_key` is stable by default; changing
one requires an explicit migration and preservation of the previous navigation
key before external links depend on it. Ontology vocabulary keys remain unique
within their registries.

This policy was accepted by the project owner during the M2 hardening run on
2026-07-29. It does not change existing machine IDs.

## Alternatives

- Random UUID or ULID suffixes reduce branch collisions but reduce citation
  readability and require a migration policy for mixed formats.
- Central allocation eliminates collision risk but introduces service
  availability and offline-authoring constraints.
- Semantic IDs improve readability but couple identity to disputed taxonomy and
  mutable language.

## Migration implications

Do not rewrite existing IDs merely to change allocation mechanics. A future
allocator can issue randomized or centrally reserved IDs while preserving every
existing allocation and tombstone. Changing the canonical pattern would require
a schema migration, dual-format validator period, redirect map, and graph-wide
reference rewrite.
