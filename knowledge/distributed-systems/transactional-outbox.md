---
id: AKC-000014
record_kind: concept
title: Transactional Outbox
aliases:
  - Outbox pattern
type: integration-pattern
secondary_types: []
domain: distributed-systems
subdomains:
  - messaging
  - transactions
dimensions:
  - interaction
  - data-consistency
  - state-management
  - resilience
status: drafted
maturity: seed
summary: An integration pattern that stores an outgoing message record in the same local transaction as business state, then publishes it asynchronously.
tags:
  - outbox
  - dual-write
  - events
problem: Updating a database and publishing a message as separate operations creates a dual-write gap in which either side can succeed alone.
context: A service must emit messages corresponding to local durable state changes without a distributed transaction across database and broker.
intent: Make business-state commit and message intent atomic within one local transaction.
forces:
  - The publisher can crash at any point.
  - Publication is usually at least once.
  - Ordering requirements vary by aggregate.
  - Outbox retention grows.
  - Broker acknowledgement can be uncertain.
applicable_when:
  - statement: Use when a database state transition and an outgoing message must not diverge and asynchronous publication is acceptable.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Avoid when one transactional resource already covers both effects or when message delay and duplicate delivery cannot be tolerated.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves:
    - quality_attribute_id: AKC-000005
      conditions:
        - statement: Business state and message intent share one local transaction.
          concept_ids: []
      claim_ids:
        - AKL-000030
  degrades: []
  influences: []
constraints:
  - statement: Business state and message intent must be committed within one local transaction.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The relay is operated to eventual publication and consumers tolerate the declared delivery semantics.
    scope: edge-local
    concept_ids: []
benefits:
  - Closes the local dual-write gap.
  - Works without cross-resource transactions.
  - Supports recoverable publication.
tradeoffs:
  - At-least-once publication.
  - Additional table and relay.
  - Cleanup and ordering complexity.
risks:
  - statement: Marking published before broker acknowledgement loses messages; marking after acknowledgement permits duplicates.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000024
security_implications:
  - Protect outbox payloads and relay credentials; avoid placing unnecessary sensitive data in durable integration records.
operational_implications:
  - Monitor oldest unpublished age, backlog, publish failures, duplicates, cleanup, and broker acknowledgement behavior.
data_implications:
  - Define transactional boundary, event identity, ordering key, retention, cleanup, schema evolution, and recovery from poisoned rows.
alternatives:
  - statement: Distributed transactions provide stronger atomic coordination where supported; event sourcing derives events from the primary log but changes the data model.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000005
  - AKC-000010
  - AKC-000011
relationships:
  - AKR-000009
  - AKR-000010
examples:
  - statement: An order transaction stores OrderAccepted and its outbox message together; a relay later publishes the event.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Writing state, then directly publishing without a durable message intent remains a dual write even if failures are rare.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000014
  - AKL-000029
  - AKL-000030
sources:
  - AKS-000014
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

# Transactional Outbox

## Summary

An integration pattern that stores an outgoing message record in the same local transaction as business state, then publishes it asynchronously.

## Intent

Make business-state commit and message intent atomic within one local transaction.

## Context

A service must emit messages corresponding to local durable state changes without a distributed transaction across database and broker.

## Problem

Updating a database and publishing a message as separate operations creates a dual-write gap in which either side can succeed alone.

## Forces

The publisher can crash at any point. Publication is usually at least once. Ordering requirements vary by aggregate. Outbox retention grows. Broker acknowledgement can be uncertain.

## How It Works

Write business changes and an outbox row in one transaction. A relay reads committed rows, publishes messages, and marks or removes them after acknowledgement.

## Structural View

The service owns business tables, an outbox, and a relay connected to the broker. Consumers remain responsible for duplicate-safe processing.

## Runtime View

Commit makes state and message intent durable together; the relay may publish more than once after crashes or uncertain acknowledgements.

## Applicability

Use when a database state transition and an outgoing message must not diverge and asynchronous publication is acceptable.

## When Not to Use It

Avoid when one transactional resource already covers both effects or when message delay and duplicate delivery cannot be tolerated.

## Quality Attribute Impact

It improves reliability of event intent but introduces delay, duplicate delivery, relay operations, storage, and ordering concerns.

## Benefits

Closes the local dual-write gap. Works without cross-resource transactions. Supports recoverable publication.

## Trade-offs

At-least-once publication. Additional table and relay. Cleanup and ordering complexity.

## Risks and Failure Modes

Marking published before broker acknowledgement loses messages; marking after acknowledgement permits duplicates. A stalled relay creates invisible lag.

## Security Implications

Protect outbox payloads and relay credentials; avoid placing unnecessary sensitive data in durable integration records.

## Data Implications

Define transactional boundary, event identity, ordering key, retention, cleanup, schema evolution, and recovery from poisoned rows.

## Operational Implications

Monitor oldest unpublished age, backlog, publish failures, duplicates, cleanup, and broker acknowledgement behavior.

## Implementation Variants

Polling publisher, change-data-capture relay, log tailing, and broker-integrated database features have different failure boundaries.

## Alternatives

Distributed transactions provide stronger atomic coordination where supported; event sourcing derives events from the primary log but changes the data model.

## Decision Guide

Choose it when the local database is authoritative, cross-resource atomicity is unavailable, and eventual publication is acceptable.

## Verification and Testing

Crash before and after commit, publish, and acknowledgement; test duplicates, ordering, backlog recovery, and cleanup.

## Examples

An order transaction stores OrderAccepted and its outbox message together; a relay later publishes the event.

## Counterexamples

Writing state, then directly publishing without a durable message intent remains a dual write even if failures are rare.

## Related Concepts

Event-Driven Architecture supplies the publication context, Idempotency addresses duplicate delivery effects, and Reliability is affected only within the local dual-write boundary.

## Claims and Evidence

AKL-000014 defines the atomic local write and relay. AKL-000029 and AKL-000030 qualify EDA enablement and reliability.

## Sources

AKS-000014 provides the official pattern description and duplicate-handling boundary.
