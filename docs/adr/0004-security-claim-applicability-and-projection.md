# ADR 0004 — Security Claim Applicability and Normative Projection

Status: proposed implementation decision
Date: 2026-08-01

This record is not human-reviewed, approved, published, or canonical.

## Context

The final focused M3 re-audit reproduced four states that were structurally
valid but unsafe for standalone security retrieval: protocol force hidden under
a non-normative implication kind, disagreement among statement and normative
metadata, sourced normative guidance without direct evidence, and claim reuse
outside its semantic owner merely because a source was adjacent.

OpenID Connect ID Token validation also combined controls with different force
and flow applicability in AKL-000061. AKL-000062 represented repository advice
with unsupported protocol-level force.

## Decision

Schema registry version 2 adds optional claim
`applicable_concept_ids`. A security implication may use a claim when the
claim subject is the knowledge unit or when the target concept is explicitly
listed. Source adjacency and relationship adjacency do not grant
applicability.

Sourced normative claims require non-empty direct sources and source locators.
Semantic validation additionally requires admitted source status, target-domain
coverage, exact statement projection, compatible uppercase force, preserved
conditions and material exceptions, and a direct, normalized, or directly
sourced synthesis claim type.

Repository recommendations cannot carry the claim `normative` object. They
project as `operational-recommendation` and remain visibly distinct from
protocol requirements. Descriptive security risks and implementation
observations may remain unbound when they issue no normative requirement.

Every applicable sourced normative claim must be projected by a
security-sensitive knowledge unit. Removing an implication and its local claim
declaration together therefore remains detectable.

AKL-000061 retains its immutable ID but narrows to issuer validation. New
claims AKL-000064 through AKL-000069 separately represent audience,
authorized-party, non-direct signature, direct Token Endpoint TLS alternative,
expiration, and nonce controls. The split preserves different MUST, SHOULD, and
MAY semantics rather than assigning one force to the former umbrella.

## Migration

- `schemas/registry.json` advances from schema version 1 to 2.
- Existing claims remain valid without `applicable_concept_ids` when used
  only by their subject concept.
- Existing cross-concept security projections must add the target concept
  explicitly.
- Recommendation claims carrying `normative` metadata must remove unsupported
  protocol force or migrate to a directly sourced normative claim type.
- No identifier is recycled, and no human-only lifecycle transition occurs.

## Consequences

The contract adds authoring work for legitimate cross-protocol reuse and makes
standalone completeness stricter. In return, a shared source or graph edge can
no longer silently transfer normative control semantics across concept
boundaries.

Lexical force and qualification checks are defense in depth around structured
metadata, not a substitute for specification review. Final M3 regression
re-audit must still verify source fidelity independently.
