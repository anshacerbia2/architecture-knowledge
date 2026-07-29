---
id: AKC-000005
record_kind: concept
title: "Reliability"
aliases: ["Service reliability"]
type: quality-attribute
secondary_types: []
domain: quality
subdomains: [dependability]
dimensions: [resilience, observability]
status: drafted
maturity: seed
summary: "The degree to which a system performs specified functions without unacceptable failure under stated conditions for a stated period."
tags: [reliability, correctness]
problem: "Reliability is often collapsed into uptime even though incorrect, duplicated, lost, or inconsistent outcomes can occur while a service remains reachable."
context: "Systems where continuity and correctness of specified behavior across time and conditions matter."
intent: "Specify dependable behavior in terms of functions, failure criteria, operating conditions, duration, and evidence."
forces: ["Failure definitions depend on stakeholder outcomes.","Components and dependencies fail differently.","Recovery can restore access without correcting state.","Long-term behavior is expensive to test."]
applicable_when:
  - statement: "Use when repeated or sustained operation must meet explicit correctness and failure expectations."
    concept_ids: []
avoid_when:
  - statement: "Do not infer reliability from availability alone or from a short successful demonstration."
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
benefits: ["Broadens dependability beyond uptime.","Guides fault and recovery analysis.","Makes incorrect outcomes visible."]
tradeoffs: ["Evidence across long periods is difficult.","Fault injection has risk and cost.","Stronger guarantees constrain performance and autonomy."]
risks: []
failure_modes: []
security_implications: ["Compromise can create apparently available but untrustworthy behavior; integrity and authorization failures belong in the failure model."]
operational_implications: ["Incident data, change failure, dependency health, repair time, and error budgets contribute evidence but require careful interpretation."]
data_implications: ["Reliability includes preservation of required state transitions, duplicate control, loss detection, reconciliation, and recovery."]
alternatives: []
related: [AKC-000004, AKC-000006, AKC-000008, AKC-000014, AKC-000019]
relationships: [AKR-000010, AKR-000015, AKR-000016, AKR-000020]
examples: []
counterexamples: []
claims: [AKL-000005, AKL-000030, AKL-000035, AKL-000036, AKL-000040]
sources: [AKS-000003, AKS-000004, AKS-000005]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Reliability

## Summary

The degree to which a system performs specified functions without unacceptable failure under stated conditions for a stated period.

## Intent

Specify dependable behavior in terms of functions, failure criteria, operating conditions, duration, and evidence.

## Context

Systems where continuity and correctness of specified behavior across time and conditions matter.

## Problem

Reliability is often collapsed into uptime even though incorrect, duplicated, lost, or inconsistent outcomes can occur while a service remains reachable.

## Forces

Failure definitions depend on stakeholder outcomes. Components and dependencies fail differently. Recovery can restore access without correcting state. Long-term behavior is expensive to test.

## How It Works

Define required functions and unacceptable failures, model fault sources, choose prevention, detection, containment, recovery, and repair tactics, then evaluate behavior over relevant conditions and time.

## Structural View

Reliability emerges from component behavior, dependency contracts, state transitions, fault containment, and recovery paths.

## Runtime View

Failures are detected against functional criteria; recovery actions should restore service and preserve or reconcile required state.

## Applicability

Use when repeated or sustained operation must meet explicit correctness and failure expectations.

## When Not to Use It

Do not infer reliability from availability alone or from a short successful demonstration.

## Quality Attribute Impact

Reliability tactics can improve continuity and correctness but may add latency, cost, operational complexity, or temporary inconsistency.

## Benefits

Broadens dependability beyond uptime. Guides fault and recovery analysis. Makes incorrect outcomes visible.

## Trade-offs

Evidence across long periods is difficult. Fault injection has risk and cost. Stronger guarantees constrain performance and autonomy.

## Risks and Failure Modes

Successful requests can conceal corrupt or duplicated outcomes. Recovery loops can amplify faults when retry and state semantics are not coordinated.

## Security Implications

Compromise can create apparently available but untrustworthy behavior; integrity and authorization failures belong in the failure model.

## Data Implications

Reliability includes preservation of required state transitions, duplicate control, loss detection, reconciliation, and recovery.

## Operational Implications

Incident data, change failure, dependency health, repair time, and error budgets contribute evidence but require careful interpretation.

## Implementation Variants

Reliability can be specified per request, workflow, mission interval, batch, or durable state transition.

## Alternatives

Availability focuses on accessibility; resilience focuses on adapting to faults; both overlap but are not synonyms.

## Decision Guide

Select failure criteria from stakeholder impact and choose tactics only after defining state and dependency semantics.

## Verification and Testing

Use scenario tests, fault injection, invariant checks, recovery exercises, and longitudinal service indicators.

## Examples

A payment workflow avoids loss and duplicate capture while completing within its bounded failure and recovery conditions.

## Counterexamples

A reachable endpoint returning incorrect results is available by one measure but not reliable for its specified function.

## Related Concepts

AKC-000004, AKC-000006, AKC-000008, AKC-000014, AKC-000019 are governed related concepts. Relationships are qualified in the relationship registry.

## Claims and Evidence

AKL-000005 defines reliability. AKL-000030, AKL-000035, AKL-000036, and AKL-000040 qualify cross-domain effects.

## Sources

AKS-000003, AKS-000004, and AKS-000005 provide complementary quality and operational grounding.
