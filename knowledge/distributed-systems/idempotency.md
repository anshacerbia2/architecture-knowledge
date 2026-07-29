---
id: AKC-000011
record_kind: concept
title: "Idempotency"
aliases: ["Idempotent operation semantics"]
type: tactic
secondary_types: []
domain: distributed-systems
subdomains: [message-processing]
dimensions: [interaction, state-management, resilience]
status: drafted
maturity: seed
summary: "A semantic property or design tactic whereby repeating an operation with the same intended input does not create additional unintended effects beyond the defined result."
tags: [idempotency, duplicates, retries]
problem: "Networks and brokers can leave callers uncertain whether an operation completed, so safe recovery may require repeating it."
context: "Operations that can be retried, redelivered, replayed, or submitted concurrently and whose duplicate effects matter."
intent: "Make repeated execution produce a bounded, explicitly defined outcome."
forces: ["Duplicate detection needs identity and retention.","Concurrent duplicates can race.","A repeated response may differ while intended state stays stable.","Side effects can cross system boundaries."]
applicable_when:
  - statement: "Use where recovery or delivery semantics permit duplicate attempts and duplicate effects would violate business or system invariants."
    concept_ids: []
avoid_when:
  - statement: "Do not add global deduplication when the operation is naturally idempotent or when duplicate effects are acceptable and retention cost is unjustified."
    concept_ids: []
prerequisites: []
quality_attributes:
  improves:
    []
  degrades:
    []
  influences:
    []
constraints: []
assumptions: []
benefits: ["Enables safer retries and redelivery.","Protects invariants from duplicate effects.","Makes recovery semantics explicit."]
tradeoffs: ["Key storage and expiry.","Concurrency coordination.","Ambiguous request equivalence."]
risks: []
failure_modes: [AKC-000024]
security_implications: ["Bind idempotency keys to the authorized principal and operation; otherwise a key can leak results or create cross-tenant interference."]
operational_implications: ["Monitor duplicate rates, key conflicts, storage growth, expiry behavior, and stuck in-progress records."]
data_implications: ["Define key uniqueness, retention, atomicity with domain state, and treatment of payload changes and external side effects."]
alternatives: []
related: [AKC-000012, AKC-000014]
relationships: [AKR-000005]
examples: []
counterexamples: []
claims: [AKL-000011, AKL-000025]
sources: [AKS-000011, AKS-000012]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Idempotency

## Summary

A semantic property or design tactic whereby repeating an operation with the same intended input does not create additional unintended effects beyond the defined result.

## Intent

Make repeated execution produce a bounded, explicitly defined outcome.

## Context

Operations that can be retried, redelivered, replayed, or submitted concurrently and whose duplicate effects matter.

## Problem

Networks and brokers can leave callers uncertain whether an operation completed, so safe recovery may require repeating it.

## Forces

Duplicate detection needs identity and retention. Concurrent duplicates can race. A repeated response may differ while intended state stays stable. Side effects can cross system boundaries.

## How It Works

Define the idempotency scope, key, request equivalence, result semantics, concurrency control, retention window, and behavior for partial side effects. Persist enough state to recognize or safely recompute repeats.

## Structural View

A caller supplies or derives stable operation identity; the receiver coordinates domain state, idempotency records, and external effects within a defined boundary.

## Runtime View

The first accepted attempt records its outcome or state transition. Later equivalent attempts return or derive the defined result without applying another unintended effect.

## Applicability

Use where recovery or delivery semantics permit duplicate attempts and duplicate effects would violate business or system invariants.

## When Not to Use It

Do not add global deduplication when the operation is naturally idempotent or when duplicate effects are acceptable and retention cost is unjustified.

## Quality Attribute Impact

It can improve recovery safety and effective reliability but adds state, storage, contention, and semantic complexity.

## Benefits

Enables safer retries and redelivery. Protects invariants from duplicate effects. Makes recovery semantics explicit.

## Trade-offs

Key storage and expiry. Concurrency coordination. Ambiguous request equivalence.

## Risks and Failure Modes

Reusing a key for a different request can return a wrong result. Expiring keys too early permits late duplicates; storing success before external effects can hide incomplete work.

## Security Implications

Bind idempotency keys to the authorized principal and operation; otherwise a key can leak results or create cross-tenant interference.

## Data Implications

Define key uniqueness, retention, atomicity with domain state, and treatment of payload changes and external side effects.

## Operational Implications

Monitor duplicate rates, key conflicts, storage growth, expiry behavior, and stuck in-progress records.

## Implementation Variants

Natural idempotency, conditional updates, idempotency-key records, inbox deduplication, and effect-ledger designs cover different scopes.

## Alternatives

A transactional boundary can prevent some duplicates locally; at-most-once delivery can lose work and still needs explicit failure semantics.

## Decision Guide

Apply it to operations likely to repeat and whose duplicate effects are materially harmful; define the business outcome rather than merely the HTTP response.

## Verification and Testing

Test sequential, concurrent, delayed, changed-payload, expired-key, crash-before-commit, and crash-after-commit repetitions.

## Examples

A payment request with the same customer-scoped key returns the recorded outcome without creating a second charge.

## Counterexamples

Suppressing a duplicate message ID while an earlier attempt left an external effect uncertain does not prove end-to-end idempotency.

## Related Concepts

AKC-000012, AKC-000014 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000011 distinguishes HTTP method semantics from broader operation design. AKL-000025 qualifies the retry dependency.

## Sources

AKS-000011 defines HTTP idempotent method semantics; AKS-000012 motivates retry safety without universalizing that protocol scope.
