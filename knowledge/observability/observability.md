---
id: AKC-000019
record_kind: concept
title: "Observability"
aliases: ["System observability"]
type: quality-attribute
secondary_types: []
domain: observability
subdomains: [telemetry, diagnostics]
dimensions: [observability, resilience, execution]
status: drafted
maturity: seed
summary: "The capability to understand a system's internal state and behavior from available outputs, context, and targeted investigation."
tags: [observability, telemetry, diagnostics]
problem: "Operators and engineers cannot diagnose unfamiliar failures or evaluate behavior when the system exposes only predetermined health signals without sufficient context."
context: "Operated systems whose distributed, dynamic, or high-cardinality behavior requires investigation beyond known failure dashboards."
intent: "Enable evidence-based questions about system behavior while controlling telemetry cost, sensitivity, and interpretation."
forces: ["Unknown failures need exploratory evidence.","Telemetry has cost and cardinality.","Context propagation can break.","Signals are incomplete models.","Sensitive data can leak."]
applicable_when:
  - statement: "Use as a system quality concern where diagnosis, learning, and operational decisions depend on interrogating behavior."
    concept_ids: []
avoid_when:
  - statement: "Do not equate installing a telemetry library or collecting three signal types with achieving useful observability."
    concept_ids: []
prerequisites: []
quality_attributes:
  improves:
    - quality_attribute_id: AKC-000005
      conditions:
        - statement: Telemetry is actionable and used in detection and response.
          concept_ids: []
      claim_ids: [AKL-000035]
  degrades:
    []
  influences:
    []
constraints: []
assumptions: []
benefits: ["Supports investigation of unknown failure.","Improves causal context.","Enables operational learning and verification."]
tradeoffs: ["Storage and processing cost.","Instrumentation maintenance.","Privacy and cardinality risks."]
risks: []
failure_modes: []
security_implications: ["Treat telemetry as sensitive data, enforce tenant boundaries, redact secrets and personal data, and audit query access."]
operational_implications: ["Operate telemetry pipelines as production dependencies with capacity, loss, delay, quality, and cost indicators."]
data_implications: ["Define telemetry ownership, schema, retention, sampling, redaction, lineage, and deletion requirements."]
alternatives: []
related: [AKC-000005]
relationships: [AKR-000015]
examples: []
counterexamples: []
claims: [AKL-000019, AKL-000035]
sources: [AKS-000020]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# Observability

## Summary

The capability to understand a system's internal state and behavior from available outputs, context, and targeted investigation.

## Intent

Enable evidence-based questions about system behavior while controlling telemetry cost, sensitivity, and interpretation.

## Context

Operated systems whose distributed, dynamic, or high-cardinality behavior requires investigation beyond known failure dashboards.

## Problem

Operators and engineers cannot diagnose unfamiliar failures or evaluate behavior when the system exposes only predetermined health signals without sufficient context.

## Forces

Unknown failures need exploratory evidence. Telemetry has cost and cardinality. Context propagation can break. Signals are incomplete models. Sensitive data can leak.

## How It Works

Instrument meaningful operations, preserve correlation and domain context, collect appropriate traces, metrics, logs, and profiles, and provide analysis workflows tied to questions and decisions.

## Structural View

Instrumentation, context propagation, collection, processing, storage, query, visualization, and response workflows form an evidence pipeline.

## Runtime View

Systems emit contextual signals; pipelines transform and retain them; humans and automation query evidence to explain behavior and act.

## Applicability

Use as a system quality concern where diagnosis, learning, and operational decisions depend on interrogating behavior.

## When Not to Use It

Do not equate installing a telemetry library or collecting three signal types with achieving useful observability.

## Quality Attribute Impact

Actionable observability can improve reliability through faster detection and diagnosis, but instrumentation overhead and poor signals can add cost without improving outcomes.

## Benefits

Supports investigation of unknown failure. Improves causal context. Enables operational learning and verification.

## Trade-offs

Storage and processing cost. Instrumentation maintenance. Privacy and cardinality risks.

## Risks and Failure Modes

Dashboards can create false confidence. Sampling can omit rare failures, labels can explode cost, and broken context can produce misleading traces.

## Security Implications

Treat telemetry as sensitive data, enforce tenant boundaries, redact secrets and personal data, and audit query access.

## Data Implications

Define telemetry ownership, schema, retention, sampling, redaction, lineage, and deletion requirements.

## Operational Implications

Operate telemetry pipelines as production dependencies with capacity, loss, delay, quality, and cost indicators.

## Implementation Variants

Vendor-neutral and vendor-specific stacks, head or tail sampling, centralized or federated storage, and domain-oriented telemetry serve different scales.

## Alternatives

Monitoring of known conditions is necessary but narrower; debugging and profiling provide targeted evidence and can participate in an observability strategy.

## Decision Guide

Invest where specific operational questions, incident risks, or verification needs justify signal and pipeline cost.

## Verification and Testing

Run investigation exercises against unfamiliar failures, measure context completeness and signal loss, and test access, redaction, and retention.

## Examples

An engineer traces a degraded user journey across services and correlates it with deployment, tenant, and dependency evidence.

## Counterexamples

A dashboard showing host CPU without request or domain context does not establish system observability.

## Related Concepts

AKC-000005 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000019 defines observability as understanding through outputs. AKL-000035 qualifies its reliability effect when evidence drives response.

## Sources

AKS-000020 supplies vendor-neutral observability concepts; it does not mandate OpenTelemetry as the implementation.
