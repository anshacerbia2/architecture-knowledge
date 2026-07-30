---
id: AKC-000004
record_kind: concept
title: Availability
aliases:
  - Service availability
type: quality-attribute
secondary_types: []
domain: quality
subdomains:
  - dependability
dimensions:
  - resilience
  - observability
status: drafted
maturity: seed
summary: Operational readiness for a specified service to satisfy valid demand under stated conditions during a defined observation window.
tags:
  - availability
  - uptime
problem: Availability statements are ambiguous unless required service, users, conditions, measurement boundaries, and time windows are specified.
context: Services whose inability to perform required functions creates material stakeholder impact.
intent: Turn accessibility expectations into bounded, measurable scenarios and architecture trade-offs.
forces:
  - Different functions have different criticality.
  - Planned and unplanned time may be classified differently.
  - Dependencies affect observed service.
  - Short outages and long degradation have different impacts.
applicable_when:
  - statement: Use when stakeholders care whether a defined service can be used at required times and conditions.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not use availability as a substitute for reliability, correctness, durability, or disaster-recovery capability.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: The required service, users, operating conditions, and observation window must be explicit.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The selected indicators represent whether the specified service is usable by the affected stakeholders.
    scope: edge-local
    concept_ids: []
benefits:
  - Connects stakeholder need to measurable behavior.
  - Guides redundancy and recovery choices.
  - Supports service-level objectives.
tradeoffs:
  - Higher targets increase cost and complexity.
  - Aggregate percentages can hide severe user segments.
  - Exclusions can distort the result.
risks:
  - statement: Vanity uptime can report healthy infrastructure while required user functions fail.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Security controls can intentionally deny access; availability analysis should distinguish authorized denial, attack-induced outage, and control failure.
operational_implications:
  - Measurement, alerting, incident response, capacity, failover testing, and dependency management are part of the availability design.
data_implications:
  - Availability of computation does not imply availability or correctness of required data; data dependencies belong in the scenario.
alternatives:
  - statement: Reliability evaluates continuity or correctness over time; a quality-attribute scenario supplies a testable expression.
    scope: reusable-concept
    concept_ids:
      - AKC-000005
      - AKC-000006
related:
  - AKC-000005
  - AKC-000006
  - AKC-000012
  - AKC-000013
relationships:
  - AKR-000006
  - AKR-000007
  - AKR-000020
examples:
  - statement: A checkout journey succeeds for eligible users in a region during a rolling window under specified dependency conditions.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: A process-running metric alone is not evidence that customers can complete the required function.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000004
  - AKL-000026
  - AKL-000027
sources:
  - AKS-000004
  - AKS-000005
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 3
contextual_roles:
  - role: operational-quality
    context: Readiness for usable service is evaluated against a specified service boundary, valid demand, conditions, and window.
  - role: dependability-term
    context: This corpus keeps Availability distinct from Reliability while allowing explicitly conditioned measurement overlap.
---

# Availability

## Summary

Operational readiness for a specified service to satisfy valid demand under stated conditions during a defined observation window.

## Intent

Turn accessibility expectations into bounded, measurable scenarios and architecture trade-offs.

## Context

Services whose inability to perform required functions creates material stakeholder impact.

## Problem

Availability statements are ambiguous unless required service, users, conditions, measurement boundaries, and time windows are specified.

## Forces

Different functions have different criticality. Planned and unplanned time may be classified differently. Dependencies affect observed service. Short outages and long degradation have different impacts.

## How It Works

Define the service boundary, valid demand, success criterion, population, operating conditions, observation window, and excluded states. Measure whether required service is usable; design containment and recovery against that bounded scenario.

## Structural View

Availability depends on service boundaries, dependency topology, failure containment, recovery mechanisms, and measurement points.

## Runtime View

Requests and health signals classify service as meeting or failing the defined success criteria over the selected window.

## Applicability

Use when stakeholders care whether a defined service can be used at required times and conditions.

## When Not to Use It

Do not use availability as a substitute for reliability, correctness, durability, or disaster-recovery capability.

## Quality Attribute Impact

Availability is not a synonym for reliability, resilience, fault tolerance, or recoverability. Reliability concerns continuity of correct service; resilience is the broader capacity to withstand, adapt, and recover; fault tolerance is continued service despite specified faults; recoverability is restoration after failure.

## Benefits

Connects stakeholder need to measurable behavior. Guides redundancy and recovery choices. Supports service-level objectives.

## Trade-offs

Higher targets increase cost and complexity. Aggregate percentages can hide severe user segments. Exclusions can distort the result.

## Risks and Failure Modes

Vanity uptime can report healthy infrastructure while required user functions fail. Undefined dependency boundaries enable disputed results.

## Security Implications

Security controls can intentionally deny access; availability analysis should distinguish authorized denial, attack-induced outage, and control failure.

## Data Implications

Availability of computation does not imply availability or correctness of required data; data dependencies belong in the scenario.

## Operational Implications

Measurement, alerting, incident response, capacity, failover testing, and dependency management are part of the availability design.

## Implementation Variants

Measures include request success ratios, time-based availability, and user-journey indicators, each with different aggregation behavior.

## Alternatives

Reliability evaluates continuity or correctness over time; a quality-attribute scenario supplies a testable expression.

## Decision Guide

Choose indicators that represent the required stakeholder function and set targets from impact rather than a generic percentage.

## Verification and Testing

Test failure scenarios, inspect error-budget behavior, validate measurement boundaries, and exercise recovery under representative load.

## Examples

A checkout journey succeeds for eligible users in a region during a rolling window under specified dependency conditions.

## Counterexamples

A process-running metric alone is not evidence that customers can complete the required function.

## Related Concepts

Reliability addresses continuity of correct service, Quality Attribute Scenarios make availability expectations testable, and Retry or Circuit Breaker affect specific failure responses only under qualified conditions.

## Claims and Evidence

AKL-000004 defines the bounded attribute. AKL-000026 and AKL-000027 qualify retry and circuit-breaker effects.

## Sources

AKS-000004 supplies inspectable quality-scenario framing and AKS-000005 supplies operational service-level measurement. This unit does not rely on inaccessible ISO definitional detail or assert an ISO hierarchy.
