---
id: AKC-000017
record_kind: concept
title: "OAuth 2.x"
aliases: ["OAuth 2.0 authorization framework"]
type: protocol
secondary_types: []
domain: security-privacy
subdomains: [authorization]
dimensions: [interaction, trust-security]
status: drafted
maturity: seed
summary: "An authorization framework in which a client obtains scoped access to a protected resource on behalf of a resource owner or itself."
tags: [oauth, authorization, tokens]
problem: "Applications need delegated or service authorization without sharing a resource owner's primary credentials with every client."
context: "HTTP-based ecosystems with authorization servers, resource servers, clients, explicit trust boundaries, and protected resources."
intent: "Separate authorization delegation and token issuance from protected-resource access."
forces: ["Client types have different security capabilities.","Tokens are bearer credentials in common deployments.","Redirects and browsers create attack surfaces.","Scopes are not complete business authorization.","Standards evolve."]
applicable_when:
  - statement: "Use when delegated or service access to HTTP resources needs standardized authorization flows and ecosystem interoperability."
    concept_ids: []
avoid_when:
  - statement: "Do not use OAuth alone as proof of end-user authentication or as a replacement for resource-specific authorization policy."
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
benefits: ["Standardized delegated authorization.","Reduced credential sharing.","Separation of token issuance and resource enforcement."]
tradeoffs: ["Large security-sensitive configuration surface.","Token lifecycle operations.","Scopes can become coarse or ambiguous."]
risks: []
failure_modes: [AKC-000023]
security_implications: ["Apply the current security BCP, exact redirect matching, PKCE where applicable, audience restriction, secure token handling, and explicit client and issuer validation."]
operational_implications: ["Operate key rotation, issuer metadata, client registration, token telemetry, incident revocation, and configuration drift controls."]
data_implications: ["Minimize token contents, protect logs, define revocation and retention, and avoid treating scopes as data-ownership policy."]
alternatives: []
related: [AKC-000018]
relationships: [AKR-000013]
examples: []
counterexamples: []
claims: [AKL-000017, AKL-000033]
sources: [AKS-000017, AKS-000018]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# OAuth 2.x

## Summary

An authorization framework in which a client obtains scoped access to a protected resource on behalf of a resource owner or itself.

## Intent

Separate authorization delegation and token issuance from protected-resource access.

## Context

HTTP-based ecosystems with authorization servers, resource servers, clients, explicit trust boundaries, and protected resources.

## Problem

Applications need delegated or service authorization without sharing a resource owner's primary credentials with every client.

## Forces

Client types have different security capabilities. Tokens are bearer credentials in common deployments. Redirects and browsers create attack surfaces. Scopes are not complete business authorization. Standards evolve.

## How It Works

A client requests authorization, obtains an access token from an authorization server through an appropriate grant, and presents it to a resource server that validates token and policy.

## Structural View

Resource owner, client, authorization server, and resource server have distinct roles. Trust and deployment boundaries must be documented rather than inferred from role names.

## Runtime View

Authorization requests and token exchanges establish delegated access; protected-resource calls evaluate token validity, audience, scope, and local policy.

## Applicability

Use when delegated or service access to HTTP resources needs standardized authorization flows and ecosystem interoperability.

## When Not to Use It

Do not use OAuth alone as proof of end-user authentication or as a replacement for resource-specific authorization policy.

## Quality Attribute Impact

It can improve interoperability and credential separation but increases protocol, redirect, token, key, and policy complexity.

## Benefits

Standardized delegated authorization. Reduced credential sharing. Separation of token issuance and resource enforcement.

## Trade-offs

Large security-sensitive configuration surface. Token lifecycle operations. Scopes can become coarse or ambiguous.

## Risks and Failure Modes

Redirect manipulation, token theft, mix-up, weak client authentication, and audience confusion arise from incomplete profiles. Base RFC examples need current security guidance.

## Security Implications

Threat assumptions include malicious clients, redirect manipulation, token theft, replay, and issuer confusion. Apply the current security BCP, exact redirect matching, PKCE where applicable, audience restriction, secure token handling, and explicit client and issuer validation.

## Data Implications

Minimize token contents, protect logs, define revocation and retention, and avoid treating scopes as data-ownership policy.

## Operational Implications

Operate key rotation, issuer metadata, client registration, token telemetry, incident revocation, and configuration drift controls.

## Implementation Variants

Authorization code, client credentials, device authorization, and extensions serve different actor and device conditions; not every grant is appropriate.

## Alternatives

Session cookies can suit one first-party web boundary; capability or signed-request designs address different trust models.

## Decision Guide

Choose a flow and profile from the client, user, resource, and threat model, using current guidance in addition to the base framework.

## Verification and Testing

Test issuer, audience, redirect, state, PKCE, replay, expiry, revocation, key rotation, and resource-server authorization decisions.

## Examples

A user authorizes a client to access a bounded resource scope without giving the client the user's password.

## Counterexamples

Accepting any syntactically valid access token as proof of user identity collapses authorization and authentication.

## Related Concepts

AKC-000018 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000017 defines OAuth as authorization. AKL-000033 qualifies protocol compatibility with OpenID Connect.

## Sources

AKS-000017 is the base framework; AKS-000018 is the current OAuth 2.0 security guidance.
