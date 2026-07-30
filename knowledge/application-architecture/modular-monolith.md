---
id: AKC-000007
record_kind: concept
title: Modular Monolith
aliases:
  - Modular monolithic architecture
type: architectural-style
secondary_types: []
domain: application-architecture
subdomains:
  - modularity
dimensions:
  - system-decomposition
  - internal-structure
  - deployment
  - data-ownership
  - organizational-ownership
status: drafted
maturity: seed
summary: An application architecture organized into explicit internal modules while remaining a single primary deployment and runtime boundary.
tags:
  - monolith
  - modules
  - boundaries
problem: A single deployable can accumulate implicit coupling and unclear ownership, while distributing it prematurely introduces network and operational costs.
context: A product whose domain boundaries matter but whose deployment, scale, or organizational needs do not yet justify distributed services.
intent: Preserve strong module boundaries and replaceability without requiring independent deployment.
forces:
  - One deployment simplifies coordination.
  - Modules need enforceable dependency rules.
  - Shared runtime and storage permit accidental coupling.
  - Future extraction may or may not occur.
applicable_when:
  - statement: Use when a cohesive release unit is acceptable and internal boundaries can be enforced through code, data, and ownership rules.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Avoid when independently deployable scaling, fault isolation, regulatory separation, or team autonomy is a demonstrated requirement that one deployable cannot meet.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: A coordinated deployment boundary must remain acceptable for the product and organization.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Module boundaries are continuously enforced in code, data access, and ownership.
    scope: edge-local
    concept_ids: []
benefits:
  - Lower distributed-systems overhead.
  - Explicit internal ownership.
  - Simpler transactions and deployment.
tradeoffs:
  - Runtime fate remains shared.
  - Independent scaling is limited.
  - Boundary erosion is easy without enforcement.
risks:
  - statement: A monolith labeled modular can retain shared tables and cyclic dependencies.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000022
security_implications:
  - Modules should define authorization boundaries and limit access to sensitive data even when calls stay in-process.
operational_implications:
  - One release and runtime reduce fleet complexity, but observability should still attribute behavior and failures to modules.
data_implications:
  - Prefer module-owned schemas or access APIs; shared transactions are available but should not erase ownership.
alternatives:
  - statement: Microservices provide independent deployment and stronger runtime boundaries at higher coordination cost.
    scope: reusable-concept
    concept_ids:
      - AKC-000008
related:
  - AKC-000008
  - AKC-000009
relationships:
  - AKR-000002
  - AKR-000003
  - AKR-000022
examples:
  - statement: An order application deploys as one service but separates catalog, ordering, payment orchestration, and fulfillment behind module APIs.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Folders named by domain while every module reads shared tables and imports internal classes do not form a modular monolith.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000007
  - AKL-000022
  - AKL-000023
  - AKL-000046
sources:
  - AKS-000006
  - AKS-000007
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 2
contextual_roles:
  - role: decomposition-model
    context: Logical modules are the principal internal decomposition.
  - role: deployment-topology
    context: The modules retain one coordinated deployment and runtime boundary.
---

# Modular Monolith

## Summary

An application architecture organized into explicit internal modules while remaining a single primary deployment and runtime boundary.

## Intent

Preserve strong module boundaries and replaceability without requiring independent deployment.

## Context

A product whose domain boundaries matter but whose deployment, scale, or organizational needs do not yet justify distributed services.

## Problem

A single deployable can accumulate implicit coupling and unclear ownership, while distributing it prematurely introduces network and operational costs.

## Forces

One deployment simplifies coordination. Modules need enforceable dependency rules. Shared runtime and storage permit accidental coupling. Future extraction may or may not occur.

## How It Works

Partition responsibilities into modules with explicit APIs, restrict dependency direction, hide internal data, assign ownership, and validate boundary rules in the build. Deployment remains coordinated.

## Structural View

Modules form the principal decomposition inside one deployable. Direct access to another module's internals or tables is restricted by policy and tests.

## Runtime View

Calls are usually in-process, while module boundaries remain logical contracts. A process or deployment failure can affect the whole application.

## Applicability

Use when a cohesive release unit is acceptable and internal boundaries can be enforced through code, data, and ownership rules.

## When Not to Use It

Avoid when independently deployable scaling, fault isolation, regulatory separation, or team autonomy is a demonstrated requirement that one deployable cannot meet.

## Quality Attribute Impact

It can improve modifiability and delivery simplicity but provides less runtime isolation and independent scaling than distributed services.

## Benefits

Lower distributed-systems overhead. Explicit internal ownership. Simpler transactions and deployment.

## Trade-offs

Runtime fate remains shared. Independent scaling is limited. Boundary erosion is easy without enforcement.

## Risks and Failure Modes

A monolith labeled modular can retain shared tables and cyclic dependencies. Extraction-oriented overengineering can add abstraction without value.

## Security Implications

Modules should define authorization boundaries and limit access to sensitive data even when calls stay in-process.

## Data Implications

Prefer module-owned schemas or access APIs; shared transactions are available but should not erase ownership.

## Operational Implications

One release and runtime reduce fleet complexity, but observability should still attribute behavior and failures to modules.

## Implementation Variants

Variants include package-enforced modules, component modules, plugin architectures, and module-owned schemas within one database service.

## Alternatives

Microservices provide independent deployment and stronger runtime boundaries at higher coordination cost.

## Decision Guide

Choose this style when module autonomy is valuable but independent runtime ownership is not yet a proven driver.

## Verification and Testing

Run dependency-rule tests, detect cycles, audit cross-module data access, and verify module-level ownership and telemetry.

## Examples

An order application deploys as one service but separates catalog, ordering, payment orchestration, and fulfillment behind module APIs.

## Counterexamples

Folders named by domain while every module reads shared tables and imports internal classes do not form a modular monolith.

## Related Concepts

Microservices are an alternative deployment and ownership choice; Hexagonal Architecture can structure dependencies inside each module.

## Claims and Evidence

AKL-000007 defines the style. AKL-000022 and AKL-000023 qualify alternatives and compatibility.

## Sources

AKS-000006 is a first-party modular-monolith case; AKS-000007 provides contrast with microservice characteristics.
