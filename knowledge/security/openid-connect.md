---
id: AKC-000018
record_kind: concept
title: "OpenID Connect"
aliases: ["OIDC"]
type: protocol
secondary_types: []
domain: security-privacy
subdomains: [authentication, identity]
dimensions: [interaction, trust-security]
status: drafted
maturity: seed
summary: "An identity layer built on OAuth 2.0 that lets a relying party verify an end user's authentication and obtain interoperable identity claims."
tags: [openid-connect, authentication, identity]
problem: "OAuth access tokens authorize resource access but do not by themselves define an interoperable end-user authentication result for a client."
context: "Clients need federated authentication through an OpenID Provider and can validate issuer, audience, nonce, signatures, and protocol state."
intent: "Provide standardized authentication assertions and identity claims without redefining OAuth resource authorization."
forces: ["Authentication and authorization have different semantics.","ID Tokens require strict validation.","Claims can be stale or sensitive.","Federation expands trust.","Logout and session behavior vary."]
applicable_when:
  - statement: "Use when a client needs interoperable federated end-user authentication and an appropriate OpenID Provider is trusted."
    concept_ids: []
avoid_when:
  - statement: "Do not use ID Tokens as generic API access tokens or assume an authenticated identity is authorized for a protected action."
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
benefits: ["Standardized federated authentication.","Signed identity assertions.","Interoperable discovery and claims."]
tradeoffs: ["Provider dependency.","Complex validation rules.","Privacy and claim-minimization burden."]
risks: []
failure_modes: [AKC-000023]
security_implications: ["Use authorization-code flow with current OAuth protections where applicable, validate every required ID Token field, and bind sessions to the verified result."]
operational_implications: ["Monitor provider availability, key rotation, metadata changes, clock skew, login failures, and emergency trust revocation."]
data_implications: ["Collect minimal identity claims, define freshness and authoritative source, and avoid durable storage of unnecessary personal data."]
alternatives: []
related: [AKC-000017]
relationships: [AKR-000013, AKR-000014, AKR-000023]
examples: []
counterexamples: []
claims: [AKL-000018, AKL-000033, AKL-000034, AKL-000047]
sources: [AKS-000019]
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-29
  reviewed_at: null
  review_due_at: null
version: 1
---

# OpenID Connect

## Summary

An identity layer built on OAuth 2.0 that lets a relying party verify an end user's authentication and obtain interoperable identity claims.

## Intent

Provide standardized authentication assertions and identity claims without redefining OAuth resource authorization.

## Context

Clients need federated authentication through an OpenID Provider and can validate issuer, audience, nonce, signatures, and protocol state.

## Problem

OAuth access tokens authorize resource access but do not by themselves define an interoperable end-user authentication result for a client.

## Forces

Authentication and authorization have different semantics. ID Tokens require strict validation. Claims can be stale or sensitive. Federation expands trust. Logout and session behavior vary.

## How It Works

The relying party sends an authentication request, the provider authenticates the user and returns an authorization response, and the client validates the ID Token and related protocol state.

## Structural View

An End-User, Relying Party, and OpenID Provider participate through OAuth endpoints plus identity-specific metadata, ID Tokens, UserInfo, and validation rules.

## Runtime View

The client correlates state and nonce, exchanges code when applicable, validates issuer, audience, signature, time, and nonce, then establishes its local session and policy.

## Applicability

Use when a client needs interoperable federated end-user authentication and an appropriate OpenID Provider is trusted.

## When Not to Use It

Do not use ID Tokens as generic API access tokens or assume an authenticated identity is authorized for a protected action.

## Quality Attribute Impact

It improves federation interoperability but introduces external identity dependency, key distribution, claim governance, and session-lifecycle complexity.

## Benefits

Standardized federated authentication. Signed identity assertions. Interoperable discovery and claims.

## Trade-offs

Provider dependency. Complex validation rules. Privacy and claim-minimization burden.

## Risks and Failure Modes

Skipping issuer, audience, nonce, or signature validation enables substitution and replay. Conflating ID and access tokens produces trust-boundary errors.

## Security Implications

Threat assumptions include malicious clients, token substitution, replay, issuer confusion, and compromised browser state. Use authorization-code flow with current OAuth protections where applicable, validate every required ID Token field, and bind sessions to the verified result.

## Data Implications

Collect minimal identity claims, define freshness and authoritative source, and avoid durable storage of unnecessary personal data.

## Operational Implications

Monitor provider availability, key rotation, metadata changes, clock skew, login failures, and emergency trust revocation.

## Implementation Variants

Provider discovery, dynamic registration, UserInfo, pairwise identifiers, and different claims profiles alter privacy and operations.

## Alternatives

Local authentication or other federation protocols can be appropriate when ecosystem, trust, or deployment constraints differ.

## Decision Guide

Choose OIDC for federated authentication, then design local authorization separately from the authenticated identity.

## Verification and Testing

Test issuer and audience confusion, nonce replay, code interception, key rotation, claim absence, session expiry, and provider outage.

## Examples

A web client validates an ID Token from its configured provider and then applies its own application authorization rules.

## Counterexamples

Sending an ID Token to an unrelated API as a bearer access credential violates the token-role distinction.

## Related Concepts

AKC-000017 are governed related concepts. Typed edges are recorded separately.

## Claims and Evidence

AKL-000018 defines the identity layer. AKL-000033 and AKL-000034 preserve compatibility and dependency without collapsing semantics.

## Sources

AKS-000019 is the final OpenID Connect Core specification with its authentication and validation contract.
