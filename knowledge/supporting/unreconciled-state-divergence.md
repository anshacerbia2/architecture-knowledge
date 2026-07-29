---
id: AKC-000024
record_kind: concept
title: "Unreconciled State Divergence"
aliases: ["Unbounded distributed divergence"]
type: failure-mode
secondary_types: []
domain: distributed-systems
subdomains: [supporting-concepts]
dimensions: [data-consistency, state-management, resilience]
status: proposed
maturity: seed
summary: "A failure mode in which distributed state diverges beyond its accepted anomaly window because propagation, conflict handling, compensation, or repair does not converge."
tags: [failure-mode, divergence, reconciliation]
problem: "Temporary inconsistency becomes an unbounded defect when delivery or recovery mechanisms fail silently."
context: "Event-driven projections, outbox relays, sagas, deduplication records, or replicated state with expected convergence."
intent: "Distinguish designed temporary divergence from failed or absent reconciliation."
forces: ["Delivery can stall.","Conflicts can be unresolved.","Repairs can repeat.","Users act on stale state."]
applicable_when:
  - statement: "Use when a convergence contract exists but observed state remains outside its accepted bound."
    concept_ids: []
avoid_when:
  - statement: "Do not call bounded, measured temporary divergence a failure when it remains inside the accepted contract."
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
benefits: ["Makes failed convergence observable as a first-class failure."]
tradeoffs: ["A divergence bound and authoritative comparison can be expensive to define."]
risks: []
failure_modes: [AKC-000021]
security_implications: ["Threat assumptions include tampering, replay, or authorization drift that selectively blocks or alters convergence."]
operational_implications: ["Alert on lag and divergence age, provide reconciliation, and audit manual repair."]
data_implications: ["Define authoritative state, divergence measure, conflict outcome, tombstone behavior, and repair provenance."]
alternatives: []
related: [AKC-000010, AKC-000014, AKC-000015, AKC-000016]
relationships: [AKR-000024]
examples: []
counterexamples: []
claims: [AKL-000044, AKL-000048]
sources: [AKS-000010, AKS-000014, AKS-000015, AKS-000016]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Unreconciled State Divergence

## Summary

A failure mode in which distributed state diverges beyond its accepted anomaly window because propagation, conflict handling, compensation, or repair does not converge.

## Intent

Distinguish designed temporary divergence from failed or absent reconciliation.

## Context

Event-driven projections, outbox relays, sagas, deduplication records, or replicated state with expected convergence.

## Problem

Temporary inconsistency becomes an unbounded defect when delivery or recovery mechanisms fail silently.

## Forces

Delivery can stall. Conflicts can be unresolved. Repairs can repeat. Users act on stale state.

## How It Works

An update, message, compensation, or repair is lost, blocked, duplicated incorrectly, or applied inconsistently, leaving participants without a successful convergence path.

## Structural View

State holders, propagation channels, coordinators, conflict rules, and repair processes form the convergence mechanism.

## Runtime View

Divergence age grows past the accepted bound and downstream actions compound the mismatch until repair or intervention occurs.

## Applicability

Use when a convergence contract exists but observed state remains outside its accepted bound.

## When Not to Use It

Do not call bounded, measured temporary divergence a failure when it remains inside the accepted contract.

## Quality Attribute Impact

It degrades reliability, correctness, and sometimes availability of workflows that depend on converged state.

## Benefits

Makes failed convergence observable as a first-class failure.

## Trade-offs

A divergence bound and authoritative comparison can be expensive to define.

## Risks and Failure Modes

Assuming that eventual consistency guarantees eventual repair can leave permanent inconsistency undetected.

## Security Implications

Threat assumptions include tampering, replay, or authorization drift that selectively blocks or alters convergence.

## Data Implications

Define authoritative state, divergence measure, conflict outcome, tombstone behavior, and repair provenance.

## Operational Implications

Alert on lag and divergence age, provide reconciliation, and audit manual repair.

## Implementation Variants

Stalled projections, poisoned outbox rows, failed saga compensation, and replica conflicts are variants.

## Alternatives

Cascading amplification describes feedback-driven load rather than persistent state mismatch.

## Decision Guide

Use the node when state exceeds a declared convergence or reconciliation boundary.

## Verification and Testing

Interrupt delivery and repair at each stage, restore it, and prove convergence or explicit escalation within the bound.

## Examples

An outbox relay stalls and an order projection remains stale past its operational objective without alert or repair.

## Counterexamples

A projection lagging for seconds inside its declared bound is temporary inconsistency, not unreconciled divergence.

## Related Concepts

AKC-000010, AKC-000014, AKC-000015, AKC-000016 are governed related concepts. This supporting node is not one of the twenty draft reference units.

## Claims and Evidence

AKL-000044, AKL-000048 ground the failure mechanism and its corpus relationship.

## Sources

AKS-000010, AKS-000014, AKS-000015, AKS-000016 provide admitted evidence within the approved admission boundaries.
