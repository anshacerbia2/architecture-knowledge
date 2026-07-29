---
id: AKC-000015
record_kind: concept
title: "Saga"
aliases: ["Saga distributed transaction"]
type: integration-pattern
secondary_types: []
domain: distributed-systems
subdomains: [workflow, transactions]
dimensions: [interaction, data-consistency, state-management, resilience]
status: drafted
maturity: seed
summary: "A distributed workflow pattern that coordinates a sequence of local transactions and uses compensating actions or forward recovery after failure."
tags: [saga, compensation, workflow]
problem: "A business workflow spans independently owned transactional boundaries where one atomic transaction is unavailable or undesirable."
context: "Long-running or cross-service processes with explicit intermediate states, failure handling, and business-defined compensation."
intent: "Coordinate distributed progress while making partial completion and recovery explicit."
forces: ["Compensation may not undo reality.","Steps can repeat or reorder.","Isolation is weaker than one transaction.","Business deadlines can be long.","Ownership spans services."]
applicable_when:
  - statement: "Use when local transactions can advance a workflow and the business can define acceptable compensation or forward recovery for failures."
    concept_ids: []
avoid_when:
  - statement: "Avoid when partial completion is unacceptable and a single transactional boundary is feasible, or when no valid recovery semantics exist."
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
benefits: ["Avoids global locks.","Supports long-running workflows.","Makes compensation explicit."]
tradeoffs: ["Weak isolation.","Complex state machines.","Compensation and operations burden."]
risks: []
failure_modes: [AKC-000024]
security_implications: ["Authorize every step and compensation independently; a coordinator must not become a confused deputy across service boundaries."]
operational_implications: ["Provide end-to-end state visibility, stuck-saga detection, replay controls, manual repair, and audit trails."]
data_implications: ["Persist workflow identity, step state, causal links, deadlines, and compensation outcomes; design participant actions for repeated messages."]
alternatives: []
related: [AKC-000016]
relationships: [AKR-000011]
examples: []
counterexamples: []
claims: [AKL-000015, AKL-000031]
sources: [AKS-000015]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Saga

## Summary

A distributed workflow pattern that coordinates a sequence of local transactions and uses compensating actions or forward recovery after failure.

## Intent

Coordinate distributed progress while making partial completion and recovery explicit.

## Context

Long-running or cross-service processes with explicit intermediate states, failure handling, and business-defined compensation.

## Problem

A business workflow spans independently owned transactional boundaries where one atomic transaction is unavailable or undesirable.

## Forces

Compensation may not undo reality. Steps can repeat or reorder. Isolation is weaker than one transaction. Business deadlines can be long. Ownership spans services.

## How It Works

Model workflow states and steps, commit each step locally, persist coordination state, and trigger compensation or forward actions when later steps fail.

## Structural View

Participants own local state; an orchestrator or event choreography carries workflow state and commands or events across boundaries.

## Runtime View

Each step changes durable state. Failures transition the saga into retry, compensation, manual intervention, or terminal states.

## Applicability

Use when local transactions can advance a workflow and the business can define acceptable compensation or forward recovery for failures.

## When Not to Use It

Avoid when partial completion is unacceptable and a single transactional boundary is feasible, or when no valid recovery semantics exist.

## Quality Attribute Impact

It enables cross-boundary workflows but introduces temporary inconsistency, complex recovery, and longer observability paths.

## Benefits

Avoids global locks. Supports long-running workflows. Makes compensation explicit.

## Trade-offs

Weak isolation. Complex state machines. Compensation and operations burden.

## Risks and Failure Modes

Compensation can fail or be semantically impossible. Choreography can hide the workflow, while central orchestration can become coupled to participant details.

## Security Implications

Authorize every step and compensation independently; a coordinator must not become a confused deputy across service boundaries.

## Data Implications

Persist workflow identity, step state, causal links, deadlines, and compensation outcomes; design participant actions for repeated messages.

## Operational Implications

Provide end-to-end state visibility, stuck-saga detection, replay controls, manual repair, and audit trails.

## Implementation Variants

Orchestration centralizes workflow decisions; choreography distributes reactions. Forward recovery and semantic compensation can coexist.

## Alternatives

A local transaction is simpler when ownership can remain within one boundary. Distributed transactions may apply in tightly controlled infrastructure.

## Decision Guide

Choose a saga only after defining partial-state visibility, compensation, isolation anomalies, ownership, and manual recovery.

## Verification and Testing

Test failure at every boundary, duplicate and reordered messages, compensation failure, timeouts, and operator repair.

## Examples

A travel workflow reserves components locally and compensates completed reservations when a later required step fails.

## Counterexamples

Calling several services sequentially without durable workflow state or compensation is not a reliable saga.

## Related Concepts

AKC-000016 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000015 defines the local-transaction sequence. AKL-000031 qualifies its dependence on eventual convergence.

## Sources

AKS-000015 supplies the official saga pattern, coordination variants, and consistency trade-offs.
