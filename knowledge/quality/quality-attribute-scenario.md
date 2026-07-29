---
id: AKC-000006
record_kind: concept
title: "Quality Attribute Scenario"
aliases: ["QAS"]
type: quality-attribute-scenario
secondary_types: []
domain: quality
subdomains: [quality-requirements]
dimensions: [resilience, observability, governance]
status: drafted
maturity: seed
summary: "A structured scenario that expresses a quality expectation through a stimulus, source, environment, affected artifact, response, and measurable response."
tags: [quality-attribute, scenario, verification]
problem: "Quality terms such as fast, secure, scalable, or reliable do not identify the conditions, system response, or acceptance threshold needed for architecture analysis."
context: "Architecture work where a quality concern must guide design, evaluation, or trade-off decisions."
intent: "Convert an ambiguous quality concern into a bounded and testable statement."
forces: ["Stakeholders use broad quality language.","Responses depend on environment and stimulus.","Measures can create unintended incentives.","Scenarios compete for architecture resources."]
applicable_when:
  - statement: "Use when a quality expectation needs to influence architecture or be verified against an observable response."
    concept_ids: []
avoid_when:
  - statement: "Do not force a scenario form onto a purely functional rule with no quality-response dimension."
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
benefits: ["Makes quality expectations testable.","Improves stakeholder alignment.","Supports traceability from concern to evidence."]
tradeoffs: ["Quantification can be costly.","A measure can oversimplify impact.","One scenario cannot represent every operating condition."]
risks: []
failure_modes: []
security_implications: ["Security scenarios should include threat actor or stimulus source, protected asset, trust boundary, response, and measurable residual behavior."]
operational_implications: ["Scenarios should be executable or observable through tests, telemetry, drills, or operational review."]
data_implications: ["Include dataset size, state, sensitivity, consistency, and retention conditions when they affect the response."]
alternatives: []
related: [AKC-000004, AKC-000005, AKC-000020]
relationships: [AKR-000017]
examples: []
counterexamples: []
claims: [AKL-000006, AKL-000037]
sources: [AKS-000004]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Quality Attribute Scenario

## Summary

A structured scenario that expresses a quality expectation through a stimulus, source, environment, affected artifact, response, and measurable response.

## Intent

Convert an ambiguous quality concern into a bounded and testable statement.

## Context

Architecture work where a quality concern must guide design, evaluation, or trade-off decisions.

## Problem

Quality terms such as fast, secure, scalable, or reliable do not identify the conditions, system response, or acceptance threshold needed for architecture analysis.

## Forces

Stakeholders use broad quality language. Responses depend on environment and stimulus. Measures can create unintended incentives. Scenarios compete for architecture resources.

## How It Works

Identify the stimulus source, stimulus, operating environment, affected artifact, expected response, and quantitative or otherwise assessable response measure. Review the scenario with stakeholders and link it to decisions and tests.

## Structural View

A scenario connects stakeholder concern to system boundary, stimulus, response mechanism, measure, evidence, and related decisions.

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

AKC-000004, AKC-000005, AKC-000020 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000006 grounds the six-part structure. AKL-000037 qualifies how a scenario may be recorded with an ADR.

## Sources

AKS-000004 supplies the quality-attribute scenario method and its analytical purpose.
