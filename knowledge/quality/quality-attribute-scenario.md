---
id: AKC-000006
record_kind: concept
title: Quality Attribute Scenario
aliases:
  - QAS
type: quality-attribute-scenario
secondary_types: []
domain: quality
subdomains:
  - quality-requirements
dimensions:
  - resilience
  - observability
  - governance
status: drafted
maturity: seed
summary: A reusable or system-specific scenario used to make a quality concern concrete enough for architecture reasoning and assessment.
tags:
  - quality-attribute
  - scenario
  - verification
problem: Quality terms such as fast, secure, scalable, or reliable do not identify the conditions, system response, or acceptance threshold needed for architecture analysis.
context: Architecture work where a quality concern must guide design, evaluation, or trade-off decisions.
intent: Convert an ambiguous quality concern into a bounded and testable statement.
forces:
  - Stakeholders use broad quality language.
  - Responses depend on environment and stimulus.
  - Measures can create unintended incentives.
  - Scenarios compete for architecture resources.
applicable_when:
  - statement: Use when a quality expectation needs to influence architecture or be verified against an observable response.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not force a scenario form onto a purely functional rule with no quality-response dimension.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: A scenario must identify a bounded quality concern, expected response, and assessable evidence without attributing an unsupported fixed field set to a source.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The selected stimulus, context, response, and measure are representative enough to evaluate the architecture concern.
    scope: edge-local
    concept_ids: []
benefits:
  - Makes quality expectations testable.
  - Improves stakeholder alignment.
  - Supports traceability from concern to evidence.
tradeoffs:
  - Quantification can be costly.
  - A measure can oversimplify impact.
  - One scenario cannot represent every operating condition.
risks:
  - statement: A scenario can validate the wrong boundary or incentivize a proxy rather than the stakeholder outcome.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Security scenarios should include threat actor or stimulus source, protected asset, trust boundary, response, and measurable residual behavior.
operational_implications:
  - Scenarios should be executable or observable through tests, telemetry, drills, or operational review.
data_implications:
  - Include dataset size, state, sensitivity, consistency, and retention conditions when they affect the response.
alternatives:
  - statement: Unstructured quality statements are cheaper but less testable.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000004
  - AKC-000005
  - AKC-000020
relationships:
  - AKR-000017
examples:
  - statement: When one regional dependency becomes unavailable during peak traffic, eligible requests recover within a defined interval and bounded error ratio.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: The system must be highly available lacks stimulus, environment, boundary, response, and measure.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000006
  - AKL-000037
sources:
  - AKS-000004
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 3
contextual_roles: []
---

# Quality Attribute Scenario

## Summary

A reusable or system-specific scenario used to make a quality concern concrete enough for architecture reasoning and assessment.

## Intent

Convert an ambiguous quality concern into a bounded and testable statement.

## Context

Architecture work where a quality concern must guide design, evaluation, or trade-off decisions.

## Problem

Quality terms such as fast, secure, scalable, or reliable do not identify the conditions, system response, or acceptance threshold needed for architecture analysis.

## Forces

Stakeholders use broad quality language. Responses depend on environment and stimulus. Measures can create unintended incentives. Scenarios compete for architecture resources.

## How It Works

Start with a bounded quality concern and adapt it to a concrete system context, expected response, and assessable evidence. This corpus uses stimulus source, stimulus, environment, affected artifact, response, and response measure as an editorial template; AKS-000004 supports general-versus-concrete scenario reasoning but is not cited as proof of that fixed six-field template.

## Structural View

The repository template records stimulus source, stimulus, environment, affected artifact, response, and response measure. These fields are a governed corpus convention until an admitted inspectable source establishes direct provenance.

## Runtime View

A representative stimulus occurs in the defined environment; observations determine whether the response meets the stated measure.

## Applicability

Use when a quality expectation needs to influence architecture or be verified against an observable response.

## When Not to Use It

Do not force a scenario form onto a purely functional rule with no quality-response dimension.

## Quality Attribute Impact

It does not improve a quality attribute directly; it improves the precision and evaluability of the requirement and exposes conflicts among attributes.

## Benefits

Makes quality expectations testable. Improves stakeholder alignment. Supports traceability from concern to evidence.

## Trade-offs

Quantification can be costly. A measure can oversimplify impact. One scenario cannot represent every operating condition.

## Risks and Failure Modes

A scenario can validate the wrong boundary or incentivize a proxy rather than the stakeholder outcome. Missing environment conditions make results misleading.

## Security Implications

Security scenarios should include threat actor or stimulus source, protected asset, trust boundary, response, and measurable residual behavior.

## Data Implications

Include dataset size, state, sensitivity, consistency, and retention conditions when they affect the response.

## Operational Implications

Scenarios should be executable or observable through tests, telemetry, drills, or operational review.

## Implementation Variants

General scenarios describe a quality family; concrete scenarios bind a system, environment, and response measure.

## Alternatives

Unstructured quality statements are cheaper but less testable. Fitness functions can automate selected scenario checks.

## Decision Guide

Use a scenario when architecture choices depend on a quality threshold or response under a material condition.

## Verification and Testing

Review all six scenario parts, test boundary and measure validity, and map the scenario to at least one evaluation method.

## Examples

When one regional dependency becomes unavailable during peak traffic, eligible requests recover within a defined interval and bounded error ratio.

## Counterexamples

The system must be highly available lacks stimulus, environment, boundary, response, and measure.

## Related Concepts

Availability and Reliability supply measurable concerns for scenarios, while an ADR may record a scenario as a decision driver only as a contextual practice.

## Claims and Evidence

AKL-000006 is narrowed to general and concrete quality-scenario reasoning. AKL-000037 is an explicitly qualified recommendation about recording a decision-driving scenario in an ADR.

## Sources

AKS-000004 supports the purpose of general and concrete quality-attribute scenarios. It is not represented as an inspectable source for the repository six-field editorial template.
