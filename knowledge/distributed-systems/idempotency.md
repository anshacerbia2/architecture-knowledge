---
id: AKC-000011
record_kind: concept
title: Idempotency
aliases:
  - Idempotent operation semantics
type: semantic-property
secondary_types: []
domain: distributed-systems
subdomains:
  - message-processing
dimensions:
  - interaction
  - state-management
  - resilience
status: drafted
maturity: seed
summary: An umbrella semantic property for bounded repeated operations, with HTTP method semantics, operation-effect semantics, and implementation tactics kept as distinct contextual roles.
tags:
  - idempotency
  - duplicates
  - retries
problem: Networks and brokers can leave callers uncertain whether an operation completed, so safe recovery may require repeating it.
context: Operations that can be retried, redelivered, replayed, or submitted concurrently and whose duplicate effects matter.
intent: Make repeated execution produce a bounded, explicitly defined outcome.
forces:
  - Duplicate detection needs identity and retention.
  - Concurrent duplicates can race.
  - A repeated response may differ while intended state stays stable.
  - Side effects can cross system boundaries.
applicable_when:
  - statement: Use where recovery or delivery semantics permit duplicate attempts and duplicate effects would violate business or system invariants.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not add global deduplication when the operation is naturally idempotent or when duplicate effects are acceptable and retention cost is unjustified.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: Operation equivalence, intended effect, identity, and retention must be defined for each idempotency context.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Equivalent attempts can be identified within the chosen scope and retention window.
    scope: edge-local
    concept_ids: []
benefits:
  - Enables safer retries and redelivery.
  - Protects invariants from duplicate effects.
  - Makes recovery semantics explicit.
tradeoffs:
  - Key storage and expiry.
  - Concurrency coordination.
  - Ambiguous request equivalence.
risks:
  - statement: Reusing a key for a different request can return a wrong result.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000024
security_implications:
  - Bind idempotency keys to the authorized principal and operation; otherwise a key can leak results or create cross-tenant interference.
operational_implications:
  - Monitor duplicate rates, key conflicts, storage growth, expiry behavior, and stuck in-progress records.
data_implications:
  - Define key uniqueness, retention, atomicity with domain state, and treatment of payload changes and external side effects.
alternatives:
  - statement: A transactional boundary can prevent some duplicates locally; at-most-once delivery can lose work and still needs explicit failure semantics.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000012
  - AKC-000014
relationships:
  - AKR-000005
examples:
  - statement: A payment request with the same customer-scoped key returns the recorded outcome without creating a second charge.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Suppressing a duplicate message ID while an earlier attempt left an external effect uncertain does not prove end-to-end idempotency.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000011
  - AKL-000025
sources:
  - AKS-000011
  - AKS-000012
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 3
contextual_roles:
  - role: http-method-semantics
    context: RFC 9110 defines the intended effect of repeated identical requests for an HTTP method.
  - role: operation-characteristic
    context: A business operation can define equivalent attempts and a bounded intended effect.
  - role: implementation-tactic
    context: Keys, inboxes, conditional writes, and effect ledgers are mechanisms, not the semantic property itself.
---

# Idempotency

## Summary

An umbrella semantic property for bounded repeated operations, with HTTP method semantics, operation-effect semantics, and implementation tactics kept as distinct contextual roles.

## Intent

Make repeated execution produce a bounded, explicitly defined outcome.

## Context

Operations that can be retried, redelivered, replayed, or submitted concurrently and whose duplicate effects matter.

## Problem

Repeated delivery, uncertain outcomes, and client retries can duplicate harmful effects. HTTP method semantics, business-operation equivalence, message deduplication, and storage mechanisms answer different questions and must not be collapsed.

## Forces

Duplicate detection needs identity and retention. Concurrent duplicates can race. A repeated response may differ while intended state stays stable. Side effects can cross system boundaries.

## How It Works

First name the context. RFC 9110 defines the intended server effect of repeated identical requests for an HTTP method. A business operation separately defines equivalent attempts and permitted effects. Keys, inboxes, conditional writes, and effect ledgers are implementation tactics that may enforce that operation contract; they are not the semantic property itself.

## Structural View

The umbrella retains three explicit roles: HTTP method semantic property, protocol-neutral operation characteristic, and implementation tactic. Only the HTTP role is directly defined by AKS-000011; retry guidance in AKS-000012 motivates duplicate-effect control without defining a universal message-idempotency model.

## Runtime View

A system classifies an incoming attempt by the applicable semantic contract, identifies an equivalent prior attempt when the contract requires it, and either returns the prior outcome or prevents additional prohibited effects within the declared retention and concurrency scope.

## Applicability

Use where recovery or delivery semantics permit duplicate attempts and duplicate effects would violate business or system invariants.

## When Not to Use It

Do not add global deduplication when the operation is naturally idempotent or when duplicate effects are acceptable and retention cost is unjustified.

## Quality Attribute Impact

Duplicate-effect control can protect state correctness, but storage, coordination, retention, and concurrency handling add latency and operational complexity. HTTP idempotency alone does not guarantee exactly-once processing or external-effect deduplication.

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

Retry needs operation-level duplicate-effect safety only in qualified uncertain outcomes; Transactional Outbox consumers often need separate message-processing deduplication.

## Claims and Evidence

AKL-000011 is strictly the RFC 9110 HTTP-method definition. AKL-000025 states a qualified retry duplicate-effect need without treating HTTP semantics, message processing, or idempotency-key tactics as equivalent.

## Sources

AKS-000011 directly defines HTTP method idempotency. AKS-000012 supports the retry duplicate-effect problem. No admitted source is represented as a universal protocol-neutral definition of message or business-operation idempotency.
