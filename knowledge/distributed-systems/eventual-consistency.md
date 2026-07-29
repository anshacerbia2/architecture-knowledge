---
id: AKC-000016
record_kind: concept
title: "Eventual Consistency"
aliases: ["Eventually consistent convergence"]
type: data-pattern
secondary_types: []
domain: distributed-systems
subdomains: [consistency]
dimensions: [data-consistency, state-management, interaction]
status: drafted
maturity: seed
summary: "A consistency model in which replicas or distributed participants may temporarily diverge but are expected to converge after updates cease under stated delivery and conflict assumptions."
tags: [eventual-consistency, convergence]
problem: "Independent distribution and availability can make immediate global agreement costly or unavailable, while users and workflows still need understandable state semantics."
context: "Replicated data or distributed workflows that permit bounded temporary divergence and have a convergence mechanism."
intent: "Trade immediate agreement for availability, autonomy, or latency while defining convergence and anomaly handling explicitly."
forces: ["Updates propagate with delay.","Concurrent writes can conflict.","Users observe intermediate states.","Convergence depends on delivery and merge rules.","Some invariants cannot be delayed."]
applicable_when:
  - statement: "Use when stakeholders accept specified temporary divergence and the system can prove or monitor convergence for the affected state."
    concept_ids: []
avoid_when:
  - statement: "Avoid for invariants that require immediate coordination or where stale and conflicting observations create unacceptable harm."
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
benefits: ["Supports disconnected or autonomous progress.","Reduces synchronous coordination.","Can improve regional latency and availability."]
tradeoffs: ["Temporary anomalies.","Conflict-resolution complexity.","Harder user and operator reasoning."]
risks: []
failure_modes: [AKC-000024]
security_implications: ["Authorization and revocation semantics need special care because stale replicas can continue accepting or exposing actions."]
operational_implications: ["Measure replication lag, divergence age, conflict rate, repair backlog, and convergence failures rather than assuming convergence."]
data_implications: ["Specify convergence target, conflict semantics, causal metadata, tombstones, retention, and invariants requiring coordination."]
alternatives: []
related: [AKC-000010, AKC-000015]
relationships: [AKR-000011, AKR-000012]
examples: []
counterexamples: []
claims: [AKL-000016, AKL-000031, AKL-000032]
sources: [AKS-000010, AKS-000015, AKS-000016]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Eventual Consistency

## Summary

A consistency model in which replicas or distributed participants may temporarily diverge but are expected to converge after updates cease under stated delivery and conflict assumptions.

## Intent

Trade immediate agreement for availability, autonomy, or latency while defining convergence and anomaly handling explicitly.

## Context

Replicated data or distributed workflows that permit bounded temporary divergence and have a convergence mechanism.

## Problem

Independent distribution and availability can make immediate global agreement costly or unavailable, while users and workflows still need understandable state semantics.

## Forces

Updates propagate with delay. Concurrent writes can conflict. Users observe intermediate states. Convergence depends on delivery and merge rules. Some invariants cannot be delayed.

## How It Works

Define what may diverge, how updates propagate, how conflicts are ordered or merged, which invariants remain local or coordinated, and how convergence is detected and repaired.

## Structural View

Multiple state holders exchange updates through channels and apply deterministic ordering, conflict resolution, or compensating workflow rules.

## Runtime View

Readers may observe different versions. After relevant updates and failures stop, delivery and resolution mechanisms move participants toward the defined converged state.

## Applicability

Use when stakeholders accept specified temporary divergence and the system can prove or monitor convergence for the affected state.

## When Not to Use It

Avoid for invariants that require immediate coordination or where stale and conflicting observations create unacceptable harm.

## Quality Attribute Impact

It can improve availability, latency, and autonomy while degrading freshness, simplicity, and immediate invariant enforcement.

## Benefits

Supports disconnected or autonomous progress. Reduces synchronous coordination. Can improve regional latency and availability.

## Trade-offs

Temporary anomalies. Conflict-resolution complexity. Harder user and operator reasoning.

## Risks and Failure Modes

Eventually can become unbounded when delivery or repair fails. Last-write-wins can discard meaningful concurrent intent, and hidden stale reads can violate business expectations.

## Security Implications

Authorization and revocation semantics need special care because stale replicas can continue accepting or exposing actions.

## Data Implications

Specify convergence target, conflict semantics, causal metadata, tombstones, retention, and invariants requiring coordination.

## Operational Implications

Measure replication lag, divergence age, conflict rate, repair backlog, and convergence failures rather than assuming convergence.

## Implementation Variants

Primary-replica propagation, quorum systems, CRDTs, event-driven projections, and saga state each provide different convergence guarantees.

## Alternatives

Strong consistency coordinates before exposing results; bounded staleness and session guarantees offer intermediate contracts.

## Decision Guide

Use it only with an explicit anomaly budget, convergence mechanism, and invariant analysis tied to stakeholder impact.

## Verification and Testing

Partition communication, issue concurrent updates, restore delivery, and test convergence, conflict outcomes, stale sessions, deletion, and repair.

## Examples

A regional catalog projection serves slightly stale descriptions and converges after event delivery resumes.

## Counterexamples

Two databases that drift indefinitely with no delivery, conflict, or repair mechanism are inconsistent, not eventually consistent by design.

## Related Concepts

AKC-000010, AKC-000015 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000016 defines convergence assumptions. AKL-000031 and AKL-000032 qualify saga and event-driven relationships.

## Sources

AKS-000016 provides the foundational model; AKS-000010 and AKS-000015 supply architecture and workflow contexts.
