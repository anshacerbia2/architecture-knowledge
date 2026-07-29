---
id: AKC-000020
record_kind: concept
title: "Architecture Decision Record"
aliases: ["ADR"]
type: documentation-artifact
secondary_types: []
domain: documentation
subdomains: [architecture-decisions]
dimensions: [governance, delivery-evolution, organizational-ownership]
status: drafted
maturity: seed
summary: "A durable record of a consequential architecture decision, including its context, selected option, rationale, and consequences."
tags: [adr, decision-record, rationale]
problem: "Architecture choices lose context over time, causing repeated debate, accidental reversal, or cargo-cult reuse outside the original conditions."
context: "A decision with material, durable, cross-cutting, costly, or difficult-to-reverse consequences."
intent: "Preserve why a decision was made, under which conditions, and with what acknowledged consequences."
forces: ["Records must remain concise enough to maintain.","Context and alternatives change.","Decision status needs history.","Evidence can be uncertain.","Repository location affects discoverability."]
applicable_when:
  - statement: "Use for decisions whose rationale and consequences future maintainers or stakeholders need to understand."
    concept_ids: []
avoid_when:
  - statement: "Do not create an ADR for every implementation detail or treat the record as a substitute for discussion, evidence, or enforcement."
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
benefits: ["Preserves rationale and consequences.","Reduces repeated debate.","Supports review and supersession."]
tradeoffs: ["Maintenance and discovery cost.","Risk of stale context.","Conciseness can omit evidence."]
risks: []
failure_modes: []
security_implications: ["Security-relevant ADRs should record threat assumptions, accepted residual risk, authority, and sensitive-detail handling."]
operational_implications: ["Link decisions to operational ownership, rollout, observability, rollback, and verification evidence."]
data_implications: ["Data decisions should capture ownership, lifecycle, migration, consistency, privacy, and rollback consequences."]
alternatives: []
related: [AKC-000002, AKC-000003, AKC-000006]
relationships: [AKR-000017, AKR-000019]
examples: []
counterexamples: []
claims: [AKL-000020, AKL-000037, AKL-000039]
sources: [AKS-000021, AKS-000022]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Architecture Decision Record

## Summary

A durable record of a consequential architecture decision, including its context, selected option, rationale, and consequences.

## Intent

Preserve why a decision was made, under which conditions, and with what acknowledged consequences.

## Context

A decision with material, durable, cross-cutting, costly, or difficult-to-reverse consequences.

## Problem

Architecture choices lose context over time, causing repeated debate, accidental reversal, or cargo-cult reuse outside the original conditions.

## Forces

Records must remain concise enough to maintain. Context and alternatives change. Decision status needs history. Evidence can be uncertain. Repository location affects discoverability.

## How It Works

Record title, status, context, decision drivers, considered alternatives, decision, rationale, consequences, evidence, and supersession links. Update status through governed history rather than silently rewriting the past.

## Structural View

An ADR links decision context, constraints, quality scenarios, alternatives, claims, responsible actors, and later superseding decisions.

## Runtime View

During change, teams consult active records, compare current conditions, and create a new decision or supersession when the old rationale no longer applies.

## Applicability

Use for decisions whose rationale and consequences future maintainers or stakeholders need to understand.

## When Not to Use It

Do not create an ADR for every implementation detail or treat the record as a substitute for discussion, evidence, or enforcement.

## Quality Attribute Impact

ADRs improve traceability and evolutionary safety but can degrade flow when used as heavyweight approval paperwork disconnected from decisions.

## Benefits

Preserves rationale and consequences. Reduces repeated debate. Supports review and supersession.

## Trade-offs

Maintenance and discovery cost. Risk of stale context. Conciseness can omit evidence.

## Risks and Failure Modes

Retroactive ADRs can fabricate certainty. Mutable records can erase history, while excessive templates can hide the actual decision.

## Security Implications

Security-relevant ADRs should record threat assumptions, accepted residual risk, authority, and sensitive-detail handling.

## Data Implications

Data decisions should capture ownership, lifecycle, migration, consistency, privacy, and rollback consequences.

## Operational Implications

Link decisions to operational ownership, rollout, observability, rollback, and verification evidence.

## Implementation Variants

Short-form, MADR-like templates, decision logs, and repository or catalog storage differ in fields and workflow.

## Alternatives

Meeting notes capture discussion but may not identify a durable decision. A decision log can be lighter but needs the same context and history discipline.

## Decision Guide

Create an ADR when future cost of losing rationale exceeds the cost of maintaining the record.

## Verification and Testing

Check that the record names a real decision, alternatives, context, consequences, evidence, status, and supersession path; verify implementation separately.

## Examples

A team records why it selected a modular monolith, the autonomy thresholds that would trigger reconsideration, and the boundary fitness checks.

## Counterexamples

A document that merely announces a technology without context, alternatives, rationale, or consequences is not a useful ADR.

## Related Concepts

AKC-000002, AKC-000003, AKC-000006 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000020 defines the durable decision record. AKL-000037 and AKL-000039 qualify links from quality scenarios and systems reasoning.

## Sources

AKS-000021 is the originating ADR proposal; AKS-000022 supplies architecture-description context without prescribing one ADR format.
