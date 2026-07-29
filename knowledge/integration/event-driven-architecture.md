---
id: AKC-000010
record_kind: concept
title: "Event-Driven Architecture"
aliases: ["EDA"]
type: architectural-style
secondary_types: []
domain: integration
subdomains: [eventing]
dimensions: [interaction, execution, data-consistency, state-management, resilience]
status: drafted
maturity: seed
summary: "An architectural style in which producers publish facts about state changes and consumers react through asynchronous event flows."
tags: [events, asynchronous, integration]
problem: "Direct request coupling can force producers to know consumers and can synchronize lifecycles that need independent reaction and scaling."
context: "Systems where multiple consumers react to facts, temporal decoupling is valuable, and asynchronous semantics can be operated safely."
intent: "Decouple producers and consumers in time and knowledge while enabling reactive workflows."
forces: ["Events can be duplicated, delayed, reordered, or lost by faulty implementations.","Schemas evolve independently.","Consumers need replay and recovery policies.","Global transactions are usually unavailable."]
applicable_when:
  - statement: "Use when asynchronous reaction, fan-out, buffering, or independent consumer evolution addresses a demonstrated driver."
    concept_ids: []
avoid_when:
  - statement: "Avoid when the workflow requires immediate coordinated response and asynchronous state or operational complexity has no compensating value."
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
benefits: ["Temporal and knowledge decoupling.","Natural fan-out.","Independent consumer scaling."]
tradeoffs: ["Eventual consistency.","Harder end-to-end tracing.","Schema and replay governance."]
risks: []
failure_modes: [AKC-000024]
security_implications: ["Authorize publication and consumption, protect sensitive payloads, validate schemas, and account for replay as a security-relevant action."]
operational_implications: ["Operate broker capacity, lag, dead letters, replay, schema compatibility, correlation, and consumer health."]
data_implications: ["Events become durable integration data; ownership, retention, ordering, schema evolution, and deletion obligations must be explicit."]
alternatives: []
related: [AKC-000008, AKC-000014, AKC-000016]
relationships: [AKR-000004, AKR-000009, AKR-000012, AKR-000024]
examples: []
counterexamples: []
claims: [AKL-000010, AKL-000024, AKL-000029, AKL-000032, AKL-000048]
sources: [AKS-000010]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Event-Driven Architecture

## Summary

An architectural style in which producers publish facts about state changes and consumers react through asynchronous event flows.

## Intent

Decouple producers and consumers in time and knowledge while enabling reactive workflows.

## Context

Systems where multiple consumers react to facts, temporal decoupling is valuable, and asynchronous semantics can be operated safely.

## Problem

Direct request coupling can force producers to know consumers and can synchronize lifecycles that need independent reaction and scaling.

## Forces

Events can be duplicated, delayed, reordered, or lost by faulty implementations. Schemas evolve independently. Consumers need replay and recovery policies. Global transactions are usually unavailable.

## How It Works

Producers publish immutable event facts to a broker or log; consumers subscribe, process with explicit delivery semantics, and maintain their own state or trigger actions.

## Structural View

Producers, event channels, schemas, consumers, and state stores form independently evolving boundaries connected through event contracts.

## Runtime View

Events move asynchronously and may be redelivered. Consumers track processing, handle poison events, and reconcile lag or replay.

## Applicability

Use when asynchronous reaction, fan-out, buffering, or independent consumer evolution addresses a demonstrated driver.

## When Not to Use It

Avoid when the workflow requires immediate coordinated response and asynchronous state or operational complexity has no compensating value.

## Quality Attribute Impact

It can improve scalability and decoupling while increasing consistency latency, debugging complexity, and operational state.

## Benefits

Temporal and knowledge decoupling. Natural fan-out. Independent consumer scaling.

## Trade-offs

Eventual consistency. Harder end-to-end tracing. Schema and replay governance.

## Risks and Failure Modes

Dual writes lose events, consumers create duplicate effects, and unbounded replay overloads dependencies. Event names can expose implementation rather than stable facts.

## Security Implications

Authorize publication and consumption, protect sensitive payloads, validate schemas, and account for replay as a security-relevant action.

## Data Implications

Events become durable integration data; ownership, retention, ordering, schema evolution, and deletion obligations must be explicit.

## Operational Implications

Operate broker capacity, lag, dead letters, replay, schema compatibility, correlation, and consumer health.

## Implementation Variants

Brokered events, event logs, notification events, event-carried state transfer, and event sourcing have different ownership semantics.

## Alternatives

Request-response integration offers immediate results and simpler local reasoning when temporal decoupling is unnecessary.

## Decision Guide

Choose the style when asynchronous decoupling or fan-out has concrete value and the organization can manage delivery, replay, and schema semantics.

## Verification and Testing

Test duplicate, delayed, reordered, malformed, missing, and replayed events; observe lag and trace outcomes across consumers.

## Examples

An order-accepted event triggers fulfillment, analytics, and notification consumers without the producer knowing each implementation.

## Counterexamples

Renaming remote commands as events while requiring an immediate single consumer response does not create event-driven decoupling.

## Related Concepts

AKC-000008, AKC-000014, AKC-000016 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000010 defines the style. AKL-000024, AKL-000029, and AKL-000032 qualify compatibility, outbox support, and consistency effects.

## Sources

AKS-000010 provides the official architecture-style description and its asynchronous trade-offs.
