---
id: AKC-000021
record_kind: concept
title: Cascading Failure Amplification
aliases:
  - Failure amplification
type: failure-mode
secondary_types: []
domain: reliability-operability
subdomains:
  - supporting-concepts
dimensions:
  - interaction
  - resilience
status: proposed
maturity: seed
summary: A failure mode in which retries, queues, dependencies, or resource contention magnify an initial fault across system boundaries.
tags:
  - failure-mode
  - amplification
problem: Recovery behavior can consume more capacity than normal traffic and spread a local fault.
context: Distributed call paths and asynchronous workflows under degraded dependency or capacity conditions.
intent: Name and analyze the mechanism by which a bounded fault becomes a wider outage.
forces:
  - Recovery consumes capacity.
  - Clients share dependencies.
  - Feedback is delayed.
applicable_when:
  - statement: Use when one participant's response to failure can increase load or resource occupancy elsewhere.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not use this label when failures are independent and no amplification mechanism is evidenced.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: Amplification requires an evidenced positive-feedback path from failure response to additional load or resource occupancy.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Attempt, queue, saturation, and dependency evidence is available to distinguish amplification from independent failures.
    scope: edge-local
    concept_ids: []
benefits:
  - Creates a reusable node for failure analysis.
tradeoffs:
  - The label does not identify the root cause by itself.
risks:
  - statement: Misdiagnosing correlation as amplification can lead to the wrong control.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Threat assumptions include an actor able to trigger expensive failure paths or retry amplification.
operational_implications:
  - Observe attempt ratios, queue age, saturation, call depth, and correlated failure timing.
data_implications:
  - Queue and attempt identity are needed to measure amplification without double counting.
alternatives:
  - statement: Boundary erosion and unreconciled divergence describe different failure mechanisms.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000008
  - AKC-000012
  - AKC-000013
relationships:
  - AKR-000021
examples:
  - statement: Nested retries multiply one user request into many calls against a degraded dependency.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Two independent components failing from one power loss share a cause but do not necessarily amplify each other.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000041
  - AKL-000045
sources:
  - AKS-000008
  - AKS-000012
  - AKS-000013
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

# Cascading Failure Amplification

## Summary

A failure mode in which retries, queues, dependencies, or resource contention magnify an initial fault across system boundaries.

## Intent

Name and analyze the mechanism by which a bounded fault becomes a wider outage.

## Context

Distributed call paths and asynchronous workflows under degraded dependency or capacity conditions.

## Problem

Recovery behavior can consume more capacity than normal traffic and spread a local fault.

## Forces

Recovery consumes capacity. Clients share dependencies. Feedback is delayed.

## How It Works

An initial fault increases waits or errors; callers retry, queue, or hold resources; the additional work reduces remaining capacity and creates further failures.

## Structural View

Callers, shared dependencies, retry policies, queues, and resource pools form a positive feedback loop.

## Runtime View

Load and latency rise together until controls shed work, isolate capacity, or the dependency recovers.

## Applicability

Use when one participant's response to failure can increase load or resource occupancy elsewhere.

## When Not to Use It

Do not use this label when failures are independent and no amplification mechanism is evidenced.

## Quality Attribute Impact

It degrades availability and reliability by turning localized degradation into multi-boundary saturation.

## Benefits

Creates a reusable node for failure analysis.

## Trade-offs

The label does not identify the root cause by itself.

## Risks and Failure Modes

Misdiagnosing correlation as amplification can lead to the wrong control. Breakers and limits can also reject healthy recovery traffic when tuned poorly.

## Security Implications

Threat assumptions include an actor able to trigger expensive failure paths or retry amplification.

## Data Implications

Queue and attempt identity are needed to measure amplification without double counting.

## Operational Implications

Observe attempt ratios, queue age, saturation, call depth, and correlated failure timing.

## Implementation Variants

Retry storms, thundering herds, queue collapse, and dependency cascades are variants.

## Alternatives

Boundary erosion and unreconciled divergence describe different failure mechanisms.

## Decision Guide

Use the node when a supported feedback mechanism links the initial fault to increased downstream work.

## Verification and Testing

Inject a bounded failure and measure whether recovery work, concurrency, or queues grow beyond the initiating load.

## Examples

Nested retries multiply one user request into many calls against a degraded dependency.

## Counterexamples

Two independent components failing from one power loss share a cause but do not necessarily amplify each other.

## Related Concepts

Retry and dependency call chains can participate in amplification; Circuit Breaker is one conditional containment tactic.

## Claims and Evidence

AKL-000041, AKL-000045 ground the failure mechanism and its corpus relationship.

## Sources

AKS-000008, AKS-000012, AKS-000013 provide admitted evidence within the approved admission boundaries.
