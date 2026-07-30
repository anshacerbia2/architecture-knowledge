---
id: AKC-000001
record_kind: concept
title: First-Principles Thinking
aliases:
  - First-principles reasoning
type: reasoning-model
secondary_types: []
domain: foundations
subdomains:
  - reasoning
dimensions:
  - governance
status: drafted
maturity: seed
summary: A reasoning model that identifies propositions treated as foundational within a bounded inquiry and builds conclusions from them.
tags:
  - reasoning
  - decomposition
problem: Teams can inherit assumptions, labels, and solution forms without examining whether those premises hold in the current architecture context.
context: Architecture exploration where inherited constraints or conventional solutions need to be separated from facts, choices, and hypotheses.
intent: Expose the premises beneath an architecture question so alternatives can be reasoned about explicitly.
forces:
  - Reasoning needs a defensible stopping point.
  - Evidence and assumptions have different epistemic status.
  - Decomposition can hide system interactions.
applicable_when:
  - statement: Use when a decision is dominated by inherited assumptions or when the feasible design space needs to be reopened.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Avoid using decomposition alone when feedback, emergence, or stakeholder interaction dominates the outcome.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: The inquiry must stop at explicitly declared contextual premises rather than treating a convenient premise as universal.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Evidence and declared assumptions can be distinguished well enough to test the selected premises.
    scope: edge-local
    concept_ids: []
benefits:
  - Makes hidden assumptions discussable.
  - Expands alternatives beyond copied solutions.
  - Supports traceable rationale.
tradeoffs:
  - Requires time and domain evidence.
  - A chosen foundation can still be wrong.
  - Reduction can underrepresent emergence.
risks:
  - statement: False certainty arises when a convenient premise is treated as an unquestionable fact.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Threat assumptions should be challenged explicitly; reducing security to isolated controls can omit attacker paths and trust-boundary interactions.
operational_implications:
  - Operational evidence is needed to test premises about load, failure, recovery, and team capability.
data_implications:
  - Claims about data ownership, meaning, and consistency should be separated from implementation conventions.
alternatives:
  - statement: Systems thinking is a complement and, for interaction-dominated questions, an alternative analytical starting point.
    scope: reusable-concept
    concept_ids:
      - AKC-000002
related:
  - AKC-000002
  - AKC-000020
relationships:
  - AKR-000001
examples:
  - statement: A team challenges the premise that independent deployment requires independently owned services and evaluates modular boundaries inside one deployable.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Renaming a preferred solution as a first principle without exposing its premises is not first-principles reasoning.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000001
  - AKL-000021
sources:
  - AKS-000001
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

# First-Principles Thinking

## Summary

A reasoning model that identifies propositions treated as foundational within a bounded inquiry and builds conclusions from them.

## Intent

Expose the premises beneath an architecture question so alternatives can be reasoned about explicitly.

## Context

Architecture exploration where inherited constraints or conventional solutions need to be separated from facts, choices, and hypotheses.

## Problem

Teams can inherit assumptions, labels, and solution forms without examining whether those premises hold in the current architecture context.

## Forces

Reasoning needs a defensible stopping point. Evidence and assumptions have different epistemic status. Decomposition can hide system interactions.

## How It Works

State the question, separate observations from assumptions, identify the most basic propositions accepted for this inquiry, test them, and reconstruct candidate conclusions. The selected premises remain contextual and revisable.

## Structural View

The model produces a chain from evidence and declared assumptions through intermediate propositions to candidate decisions. It does not prescribe a system topology.

## Runtime View

At decision time, challenged premises can reopen alternatives; after implementation, observed outcomes can confirm or invalidate the premises.

## Applicability

Use when a decision is dominated by inherited assumptions or when the feasible design space needs to be reopened.

## When Not to Use It

Avoid using decomposition alone when feedback, emergence, or stakeholder interaction dominates the outcome.

## Quality Attribute Impact

Its primary effect is on decision quality and traceability. It can improve clarity but can degrade completeness when interactions are stripped away.

## Benefits

Makes hidden assumptions discussable. Expands alternatives beyond copied solutions. Supports traceable rationale.

## Trade-offs

Requires time and domain evidence. A chosen foundation can still be wrong. Reduction can underrepresent emergence.

## Risks and Failure Modes

False certainty arises when a convenient premise is treated as an unquestionable fact. Excessive decomposition can separate behavior that only makes sense as a system.

## Security Implications

Threat assumptions should be challenged explicitly; reducing security to isolated controls can omit attacker paths and trust-boundary interactions.

## Data Implications

Claims about data ownership, meaning, and consistency should be separated from implementation conventions.

## Operational Implications

Operational evidence is needed to test premises about load, failure, recovery, and team capability.

## Implementation Variants

Variants include assumption mapping, causal decomposition, and constraint relaxation. Each variant needs an explicit boundary for what counts as foundational.

## Alternatives

Systems thinking is a complement and, for interaction-dominated questions, an alternative analytical starting point.

## Decision Guide

Choose this model when questioning premises is the main need; combine it with systems thinking when reconstructed choices have material feedback effects.

## Verification and Testing

Record premises, evidence, rejected alternatives, and falsification signals. Review whether conclusions still follow when one premise changes.

## Examples

A team challenges the premise that independent deployment requires independently owned services and evaluates modular boundaries inside one deployable.

## Counterexamples

Renaming a preferred solution as a first principle without exposing its premises is not first-principles reasoning.

## Related Concepts

Systems Thinking complements premise examination by restoring interactions and feedback; ADRs can preserve the premises and resulting decision.

## Claims and Evidence

AKL-000001 describes the bounded epistemic mechanism. AKL-000021 supports contextual compatibility with systems thinking.

## Sources

AKS-000001 provides historical and philosophical grounding; its scope does not make this a universal software recipe.
