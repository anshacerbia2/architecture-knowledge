---
id: AKC-000013
record_kind: concept
title: "Circuit Breaker"
aliases: ["Circuit breaker pattern"]
type: tactic
secondary_types: []
domain: reliability-operability
subdomains: [fault-containment]
dimensions: [interaction, resilience, observability]
status: drafted
maturity: seed
summary: "A resilience tactic that temporarily prevents calls to a failing dependency and probes for recovery according to an explicit state policy."
tags: [circuit-breaker, fault-containment]
problem: "Continuing to call an unhealthy dependency consumes capacity, increases latency, and can spread failure through waiting callers."
context: "Remote calls with observable failure signals, meaningful fallback or fast-failure behavior, and a dependency likely to recover."
intent: "Contain sustained dependency failure and allow controlled recovery probing."
forces: ["Failure thresholds can misclassify.","Shared and per-instance state behave differently.","Fallback can be stale or unsafe.","Recovery probes need capacity.","Business errors differ from system faults."]
applicable_when:
  - statement: "Use where stopping calls preserves material resources or prevents cascading failure and the open-state behavior is defined."
    concept_ids: []
avoid_when:
  - statement: "Avoid when the call is local and cheap, failure classification is unavailable, or blocking calls would violate a safety-critical action."
    concept_ids: []
prerequisites: []
quality_attributes:
  improves:
    - quality_attribute_id: AKC-000004
      conditions:
        - statement: Calls to an unhealthy dependency would otherwise consume shared capacity.
          concept_ids: []
      claim_ids: [AKL-000027]
  degrades:
    []
  influences:
    []
constraints: []
assumptions: []
benefits: ["Limits cascading failure.","Reduces wasted waits.","Creates controlled recovery probes."]
tradeoffs: ["State tuning and coordination.","Intentional rejection while open.","Fallback correctness burden."]
risks: []
failure_modes: [AKC-000021]
security_implications: ["Failure responses and breaker state should not leak sensitive dependency details; fallback must preserve authorization and freshness rules."]
operational_implications: ["Monitor state transitions, rejected calls, probe outcomes, thresholds, and correlation with dependency health."]
data_implications: ["Cached or alternate fallback data needs explicit staleness, consistency, and provenance semantics."]
alternatives: []
related: [AKC-000004, AKC-000012]
relationships: [AKR-000007, AKR-000008]
examples: []
counterexamples: []
claims: [AKL-000013, AKL-000027, AKL-000028]
sources: [AKS-000013]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Circuit Breaker

## Summary

A resilience tactic that temporarily prevents calls to a failing dependency and probes for recovery according to an explicit state policy.

## Intent

Contain sustained dependency failure and allow controlled recovery probing.

## Context

Remote calls with observable failure signals, meaningful fallback or fast-failure behavior, and a dependency likely to recover.

## Problem

Continuing to call an unhealthy dependency consumes capacity, increases latency, and can spread failure through waiting callers.

## Forces

Failure thresholds can misclassify. Shared and per-instance state behave differently. Fallback can be stale or unsafe. Recovery probes need capacity. Business errors differ from system faults.

## How It Works

Track classified outcomes, transition from closed to open at a threshold, reject or redirect calls during an open interval, then allow bounded probes in a half-open state.

## Structural View

The breaker sits on a caller-side dependency boundary with policy state, metrics, and optional fallback behavior.

## Runtime View

Closed calls flow normally; open calls fail fast; half-open probes determine whether normal traffic can resume.

## Applicability

Use where stopping calls preserves material resources or prevents cascading failure and the open-state behavior is defined.

## When Not to Use It

Avoid when the call is local and cheap, failure classification is unavailable, or blocking calls would violate a safety-critical action.

## Quality Attribute Impact

It can improve availability of the caller and preserve capacity under dependency failure, but may reject calls after recovery or hide stale fallback behavior.

## Benefits

Limits cascading failure. Reduces wasted waits. Creates controlled recovery probes.

## Trade-offs

State tuning and coordination. Intentional rejection while open. Fallback correctness burden.

## Risks and Failure Modes

A global breaker can create synchronized recovery load. Counting business rejections as dependency faults opens the breaker for the wrong reason.

## Security Implications

Failure responses and breaker state should not leak sensitive dependency details; fallback must preserve authorization and freshness rules.

## Data Implications

Cached or alternate fallback data needs explicit staleness, consistency, and provenance semantics.

## Operational Implications

Monitor state transitions, rejected calls, probe outcomes, thresholds, and correlation with dependency health.

## Implementation Variants

Count-based, time-window, latency-based, per-endpoint, per-tenant, and distributed breakers differ in isolation and coordination.

## Alternatives

Timeouts bound individual waits; retries address transient failures; bulkheads isolate capacity. They are complementary rather than substitutes.

## Decision Guide

Use it when sustained failure creates a credible cascade and a fast-failure or fallback response is safer than continued calls.

## Verification and Testing

Inject sustained and intermittent faults, test classification and recovery timing, and validate fallback under authorization and staleness conditions.

## Examples

A checkout service opens a breaker for a failing recommendation dependency and continues without optional recommendations.

## Counterexamples

Opening a breaker for declined payments confuses expected business outcomes with dependency failure.

## Related Concepts

AKC-000004, AKC-000012 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000013 defines the state mechanism. AKL-000027 and AKL-000028 qualify availability and retry compatibility.

## Sources

AKS-000013 supplies the official circuit-breaker pattern and state behavior.
