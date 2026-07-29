---
id: AKC-000004
record_kind: concept
title: "Availability"
aliases: ["Service availability"]
type: quality-attribute
secondary_types: []
domain: quality
subdomains: [dependability]
dimensions: [resilience, observability]
status: drafted
maturity: seed
summary: "The degree to which a system or service is operational and accessible when required within a defined scope and observation window."
tags: [availability, uptime]
problem: "Availability statements are ambiguous unless required service, users, conditions, measurement boundaries, and time windows are specified."
context: "Services whose inability to perform required functions creates material stakeholder impact."
intent: "Turn accessibility expectations into bounded, measurable scenarios and architecture trade-offs."
forces: ["Different functions have different criticality.","Planned and unplanned time may be classified differently.","Dependencies affect observed service.","Short outages and long degradation have different impacts."]
applicable_when:
  - statement: "Use when stakeholders care whether a defined service can be used at required times and conditions."
    concept_ids: []
avoid_when:
  - statement: "Do not use availability as a substitute for reliability, correctness, durability, or disaster-recovery capability."
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
benefits: ["Connects stakeholder need to measurable behavior.","Guides redundancy and recovery choices.","Supports service-level objectives."]
tradeoffs: ["Higher targets increase cost and complexity.","Aggregate percentages can hide severe user segments.","Exclusions can distort the result."]
risks: []
failure_modes: []
security_implications: ["Security controls can intentionally deny access; availability analysis should distinguish authorized denial, attack-induced outage, and control failure."]
operational_implications: ["Measurement, alerting, incident response, capacity, failover testing, and dependency management are part of the availability design."]
data_implications: ["Availability of computation does not imply availability or correctness of required data; data dependencies belong in the scenario."]
alternatives: []
related: [AKC-000005, AKC-000006, AKC-000012, AKC-000013]
relationships: [AKR-000006, AKR-000007]
examples: []
counterexamples: []
claims: [AKL-000004, AKL-000026, AKL-000027]
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

# Availability

## Summary

The degree to which a system or service is operational and accessible when required within a defined scope and observation window.

## Intent

Turn accessibility expectations into bounded, measurable scenarios and architecture trade-offs.

## Context

Services whose inability to perform required functions creates material stakeholder impact.

## Problem

Availability statements are ambiguous unless required service, users, conditions, measurement boundaries, and time windows are specified.

## Forces

Different functions have different criticality. Planned and unplanned time may be classified differently. Dependencies affect observed service. Short outages and long degradation have different impacts.

## How It Works

Define the service boundary, required function, population, operating conditions, observation window, success indicator, and excluded states. Design detection, containment, redundancy, and recovery against that scenario.

## Structural View

Availability depends on service boundaries, dependency topology, failure containment, recovery mechanisms, and measurement points.

## Runtime View

Requests and health signals classify service as meeting or failing the defined success criteria over the selected window.

## Applicability

Use when stakeholders care whether a defined service can be used at required times and conditions.

## When Not to Use It

Do not use availability as a substitute for reliability, correctness, durability, or disaster-recovery capability.

## Quality Attribute Impact

Availability can improve through recovery and fault isolation, while added redundancy can increase cost and consistency complexity.

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

AKC-000005, AKC-000006, AKC-000012, AKC-000013 are governed related concepts. Relationships are qualified in the relationship registry.

## Claims and Evidence

AKL-000004 defines the bounded attribute. AKL-000026 and AKL-000027 qualify retry and circuit-breaker effects.

## Sources

AKS-000003, AKS-000004, and AKS-000005 provide quality-model, scenario, and SLO perspectives.
