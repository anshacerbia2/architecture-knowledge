---
id: AKC-000009
record_kind: concept
title: Hexagonal Architecture
aliases:
  - Ports and Adapters
type: architectural-pattern
secondary_types: []
domain: application-architecture
subdomains:
  - internal-structure
dimensions:
  - internal-structure
  - interaction
  - trust-security
  - delivery-evolution
status: drafted
maturity: seed
summary: An architectural pattern that isolates application behavior behind ports and connects external actors and technologies through adapters.
tags:
  - hexagonal
  - ports
  - adapters
problem: Business behavior becomes difficult to test and evolve when it directly depends on user interfaces, databases, frameworks, or remote systems.
context: Applications where domain or application logic needs stable boundaries from external technologies and delivery mechanisms.
intent: Make application behavior invocable and testable independently of particular external adapters.
forces:
  - External technologies change.
  - The application still needs explicit contracts.
  - Abstraction has design cost.
  - Not every dependency needs a port.
applicable_when:
  - statement: Use when external technology volatility or test isolation justifies explicit inbound and outbound ports.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Avoid ceremonial ports around stable trivial dependencies when indirection adds more cost than isolation value.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: Application behavior must remain isolated from technology-specific adapters at the declared application boundary.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Ports express stable application purposes rather than leaking external technology details.
    scope: edge-local
    concept_ids: []
benefits:
  - Technology-independent application tests.
  - Explicit dependency direction.
  - Replaceable external adapters.
tradeoffs:
  - More interfaces and mapping.
  - Boundary design requires judgment.
  - Leaky ports can preserve coupling.
risks:
  - statement: Framework types inside ports undermine isolation.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000022
security_implications:
  - Adapters are trust-boundary translation points and should validate, authenticate, authorize, and normalize external input as appropriate.
operational_implications:
  - Adapter-level telemetry should preserve correlation while distinguishing external failure from application decision.
data_implications:
  - Outbound ports should express application data needs without pretending persistence semantics are interchangeable.
alternatives:
  - statement: Layered architecture can also direct dependencies but may organize by technical layer rather than application boundary.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000007
relationships:
  - AKR-000003
examples:
  - statement: A payment use case exposes an inbound port and calls an application-owned payment-provider port implemented by a vendor adapter.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: An interface mirroring every method of a database client is indirection, not a meaningful application port.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000009
  - AKL-000023
sources:
  - AKS-000006
  - AKS-000009
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

# Hexagonal Architecture

## Summary

An architectural pattern that isolates application behavior behind ports and connects external actors and technologies through adapters.

## Intent

Make application behavior invocable and testable independently of particular external adapters.

## Context

Applications where domain or application logic needs stable boundaries from external technologies and delivery mechanisms.

## Problem

Business behavior becomes difficult to test and evolve when it directly depends on user interfaces, databases, frameworks, or remote systems.

## Forces

External technologies change. The application still needs explicit contracts. Abstraction has design cost. Not every dependency needs a port.

## How It Works

Define ports in terms of application needs, implement core behavior without adapter dependencies, and attach inbound and outbound adapters that translate external protocols and technologies.

## Structural View

The application core owns port contracts. Adapters depend inward and translate between external representations and those contracts.

## Runtime View

An inbound adapter invokes a port; application behavior may invoke outbound ports; adapters perform protocol, persistence, or messaging work.

## Applicability

Use when external technology volatility or test isolation justifies explicit inbound and outbound ports.

## When Not to Use It

Avoid ceremonial ports around stable trivial dependencies when indirection adds more cost than isolation value.

## Quality Attribute Impact

It can improve testability and replaceability but can degrade comprehensibility when every library call is wrapped without a boundary reason.

## Benefits

Technology-independent application tests. Explicit dependency direction. Replaceable external adapters.

## Trade-offs

More interfaces and mapping. Boundary design requires judgment. Leaky ports can preserve coupling.

## Risks and Failure Modes

Framework types inside ports undermine isolation. Generic repository abstractions can hide required data semantics.

## Security Implications

Adapters are trust-boundary translation points and should validate, authenticate, authorize, and normalize external input as appropriate.

## Data Implications

Outbound ports should express application data needs without pretending persistence semantics are interchangeable.

## Operational Implications

Adapter-level telemetry should preserve correlation while distinguishing external failure from application decision.

## Implementation Variants

Ports may be use-case oriented, message oriented, or capability oriented; adapters may be synchronous, asynchronous, or in-memory for tests.

## Alternatives

Layered architecture can also direct dependencies but may organize by technical layer rather than application boundary.

## Decision Guide

Use the pattern where an external dependency's change or test cost is material enough to justify a stable application-owned contract.

## Verification and Testing

Run architecture dependency tests, substitute test adapters, and inspect ports for framework or transport leakage.

## Examples

A payment use case exposes an inbound port and calls an application-owned payment-provider port implemented by a vendor adapter.

## Counterexamples

An interface mirroring every method of a database client is indirection, not a meaningful application port.

## Related Concepts

A Modular Monolith can use ports and adapters within modules; the pattern does not require a monolithic or distributed deployment.

## Claims and Evidence

AKL-000009 grounds ports and adapters. AKL-000023 qualifies compatibility with a modular monolith.

## Sources

AKS-000009 is the originating pattern description; AKS-000006 provides a bounded first-party application example.
