---
id: AKC-000003
record_kind: concept
title: Constraint
aliases:
  - Architecture constraint
type: constraint
secondary_types: []
domain: constraints-assumptions
subdomains:
  - decision-context
dimensions:
  - governance
status: drafted
maturity: seed
summary: A condition that restricts the feasible architecture choices, values, or implementation forms within a stated scope.
tags:
  - constraint
  - feasibility
problem: Architecture reasoning becomes misleading when non-negotiable limits, negotiable preferences, and untested assumptions are mixed together.
context: Any decision with regulatory, physical, temporal, budgetary, organizational, contractual, or technical limits.
intent: Make restrictions explicit, scoped, attributable, testable where possible, and distinguishable from assumptions and preferences.
forces:
  - Some limits are externally imposed.
  - Constraints can expire or be renegotiated.
  - Unverified constraints can become folklore.
  - Multiple constraints can conflict.
applicable_when:
  - statement: Use whenever a restriction materially removes options or bounds an acceptance criterion.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not label a preference or an untested belief as a constraint; record those as a decision criterion or assumption.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: A constraint is valid only within its declared scope, authority, and effective period.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The stated authority and environmental conditions remain valid for the decision being constrained.
    scope: edge-local
    concept_ids: []
benefits:
  - Narrows feasible choices transparently.
  - Prevents hidden noncompliance.
  - Supports revisiting decisions when limits change.
tradeoffs:
  - Documentation does not prove validity.
  - Overclassification can freeze design.
  - Conflicting limits require escalation.
risks:
  - statement: Constraint laundering occurs when a preferred solution is declared mandatory.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Security and privacy obligations should identify jurisdiction, asset, threat, and enforcement scope rather than use generic mandates.
operational_implications:
  - Operational constraints include recovery targets, maintenance windows, staffing, platform support, and observability requirements.
data_implications:
  - Data constraints can cover residency, retention, schema, lineage, ownership, and consistency; each needs an explicit scope.
alternatives:
  - statement: Assumptions are propositions accepted for reasoning but still need validation; goals express desired outcomes rather than restrictions.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000008
  - AKC-000020
relationships:
  - AKR-000018
examples:
  - statement: A regulated dataset must remain in an identified jurisdiction under a named legal scope.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: The team prefers a familiar database is a preference, not a constraint, unless an authorized policy makes it mandatory.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000003
  - AKL-000038
sources:
  - AKS-000002
  - AKS-000022
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

# Constraint

## Summary

A condition that restricts the feasible architecture choices, values, or implementation forms within a stated scope.

## Intent

Make restrictions explicit, scoped, attributable, testable where possible, and distinguishable from assumptions and preferences.

## Context

Any decision with regulatory, physical, temporal, budgetary, organizational, contractual, or technical limits.

## Problem

Architecture reasoning becomes misleading when non-negotiable limits, negotiable preferences, and untested assumptions are mixed together.

## Forces

Some limits are externally imposed. Constraints can expire or be renegotiated. Unverified constraints can become folklore. Multiple constraints can conflict.

## How It Works

State the restricted variable or choice, scope, origin, rationale, effective period, verification method, and process for challenge or change.

## Structural View

A constraint links a source or authority to affected decisions, alternatives, and verification evidence.

## Runtime View

Constraints are evaluated at decision gates and monitored when the restricted property can drift during operation.

## Applicability

Use whenever a restriction materially removes options or bounds an acceptance criterion.

## When Not to Use It

Do not label a preference or an untested belief as a constraint; record those as a decision criterion or assumption.

## Quality Attribute Impact

Explicit constraints improve decision traceability but may degrade outcomes when obsolete restrictions remain unchallenged.

## Benefits

Narrows feasible choices transparently. Prevents hidden noncompliance. Supports revisiting decisions when limits change.

## Trade-offs

Documentation does not prove validity. Overclassification can freeze design. Conflicting limits require escalation.

## Risks and Failure Modes

Constraint laundering occurs when a preferred solution is declared mandatory. Missing expiry or authority allows obsolete limits to persist.

## Security Implications

Security and privacy obligations should identify jurisdiction, asset, threat, and enforcement scope rather than use generic mandates.

## Data Implications

Data constraints can cover residency, retention, schema, lineage, ownership, and consistency; each needs an explicit scope.

## Operational Implications

Operational constraints include recovery targets, maintenance windows, staffing, platform support, and observability requirements.

## Implementation Variants

Hard constraints exclude options; soft constraints impose a cost or approval path. This distinction should be explicit.

## Alternatives

Assumptions are propositions accepted for reasoning but still need validation; goals express desired outcomes rather than restrictions.

## Decision Guide

Treat a statement as a constraint only when violation makes an option infeasible or noncompliant within the stated scope.

## Verification and Testing

Trace each active constraint to authority and affected decisions; test measurable limits and periodically challenge continued validity.

## Examples

A regulated dataset must remain in an identified jurisdiction under a named legal scope.

## Counterexamples

The team prefers a familiar database is a preference, not a constraint, unless an authorized policy makes it mandatory.

## Related Concepts

Microservice choices illustrate how constraints narrow feasible decomposition and deployment; ADRs preserve the governing constraint and decision context.

## Claims and Evidence

AKL-000003 defines the restriction role. AKL-000038 qualifies how a constraint can narrow microservice choices.

## Sources

AKS-000002 and AKS-000022 support systems and architecture-description context without approving any particular constraint.
