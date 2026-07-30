---
id: AKC-000012
record_kind: concept
title: Retry
aliases:
  - Retry pattern
type: tactic
secondary_types: []
domain: reliability-operability
subdomains:
  - fault-handling
dimensions:
  - interaction
  - resilience
  - observability
status: drafted
maturity: seed
summary: A resilience tactic that repeats a failed operation under a bounded policy when the failure may be transient.
tags:
  - retry
  - transient-fault
  - backoff
problem: Temporary faults can make an otherwise valid operation fail, but uncontrolled repetition can amplify load, latency, and duplicate effects.
context: Remote or local operations with understood transient failure modes, bounded latency budgets, and safe repetition semantics.
intent: Recover from transient failure without turning persistent failure into an amplification loop.
forces:
  - Failures are not all transient.
  - Attempts consume time and capacity.
  - Clients can synchronize retries.
  - Duplicate effects may be unsafe.
  - Upstream deadlines bound recovery.
applicable_when:
  - statement: Use when evidence supports transient recovery, repetition is safe, and a bounded attempt fits the end-to-end deadline.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Avoid retrying permanent validation, authorization, capacity, or semantic failures without a state change that could make them succeed.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves:
    - quality_attribute_id: AKC-000004
      conditions:
        - statement: Failures are transient and attempts are bounded.
          concept_ids: []
      claim_ids:
        - AKL-000026
  degrades: []
  influences: []
constraints:
  - statement: Attempts, delays, deadlines, and aggregate retry load must remain bounded.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The failure is transient and repeating the operation is safe or protected by equivalent duplicate-effect control.
    scope: edge-local
    concept_ids: []
benefits:
  - Masks short transient faults.
  - Can reduce user-visible failure.
  - Provides bounded recovery behavior.
tradeoffs:
  - Increased tail latency.
  - Extra load and cost.
  - Potential duplicate effects.
risks:
  - statement: Retry storms synchronize clients and exhaust capacity.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000021
security_implications:
  - Do not retry authorization failures; cap attacker-controlled amplification and preserve authentication context safely across attempts.
operational_implications:
  - Expose attempt counts, reasons, backoff, exhausted budgets, and downstream outcomes; tune policies from failure evidence.
data_implications:
  - Repeated writes require idempotency or equivalent concurrency semantics. Reads may still observe changing state between attempts.
alternatives:
  - statement: Circuit breakers limit calls during sustained failure; queues defer work; fail-fast behavior preserves capacity when recovery is unlikely.
    scope: reusable-concept
    concept_ids:
      - AKC-000013
related:
  - AKC-000004
  - AKC-000011
  - AKC-000013
relationships:
  - AKR-000005
  - AKR-000006
  - AKR-000008
  - AKR-000021
examples:
  - statement: A client retries a throttled read with server-directed delay, jitter, and a remaining deadline.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Retrying every error at every service layer until a fixed count is an amplification pattern, not a bounded recovery strategy.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000012
  - AKL-000025
  - AKL-000026
  - AKL-000028
  - AKL-000045
sources:
  - AKS-000012
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 2
contextual_roles: []
---

# Retry

## Summary

A resilience tactic that repeats a failed operation under a bounded policy when the failure may be transient.

## Intent

Recover from transient failure without turning persistent failure into an amplification loop.

## Context

Remote or local operations with understood transient failure modes, bounded latency budgets, and safe repetition semantics.

## Problem

Temporary faults can make an otherwise valid operation fail, but uncontrolled repetition can amplify load, latency, and duplicate effects.

## Forces

Failures are not all transient. Attempts consume time and capacity. Clients can synchronize retries. Duplicate effects may be unsafe. Upstream deadlines bound recovery.

## How It Works

Classify retryable failures, cap attempts and elapsed time, apply backoff and jitter, honor server signals and caller deadlines, and coordinate with idempotency and circuit breaking.

## Structural View

A retry policy wraps an operation and consumes an attempt budget derived from the end-to-end call path.

## Runtime View

After a classified failure, the caller waits according to policy and tries again until success, terminal classification, cancellation, or budget exhaustion.

## Applicability

Use when evidence supports transient recovery, repetition is safe, and a bounded attempt fits the end-to-end deadline.

## When Not to Use It

Avoid retrying permanent validation, authorization, capacity, or semantic failures without a state change that could make them succeed.

## Quality Attribute Impact

It may improve availability during transient faults but can degrade latency and reliability when it overloads an unhealthy dependency.

## Benefits

Masks short transient faults. Can reduce user-visible failure. Provides bounded recovery behavior.

## Trade-offs

Increased tail latency. Extra load and cost. Potential duplicate effects.

## Risks and Failure Modes

Retry storms synchronize clients and exhaust capacity. Nested retries multiply attempts; ignoring deadlines performs work after the result is no longer useful.

## Security Implications

Do not retry authorization failures; cap attacker-controlled amplification and preserve authentication context safely across attempts.

## Data Implications

Repeated writes require idempotency or equivalent concurrency semantics. Reads may still observe changing state between attempts.

## Operational Implications

Expose attempt counts, reasons, backoff, exhausted budgets, and downstream outcomes; tune policies from failure evidence.

## Implementation Variants

Immediate retry, exponential backoff, jittered backoff, server-directed delay, queued retry, and hedging address different failure and latency models.

## Alternatives

Circuit breakers limit calls during sustained failure; queues defer work; fail-fast behavior preserves capacity when recovery is unlikely.

## Decision Guide

Retry only classified transient faults with safe semantics and a budget owned by the end-to-end request.

## Verification and Testing

Inject transient and persistent failures, inspect attempt multiplication, test deadlines and cancellation, and measure load during recovery.

## Examples

A client retries a throttled read with server-directed delay, jitter, and a remaining deadline.

## Counterexamples

Retrying every error at every service layer until a fixed count is an amplification pattern, not a bounded recovery strategy.

## Related Concepts

Idempotency defines one safety property for repeated operations, while Circuit Breaker limits attempts during sustained dependency failure.

## Claims and Evidence

AKL-000012 defines bounded transient recovery. AKL-000025, AKL-000026, and AKL-000028 qualify idempotency, availability, and circuit-breaker relationships.

## Sources

AKS-000012 supplies the official retry-pattern description and operational cautions.
