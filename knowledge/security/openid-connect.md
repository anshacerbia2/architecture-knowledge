---
id: AKC-000018
record_kind: concept
title: OpenID Connect
aliases:
  - OIDC
type: protocol
secondary_types: []
domain: security-privacy
subdomains:
  - authentication
  - identity
dimensions:
  - interaction
  - trust-security
status: drafted
maturity: seed
summary: An identity layer built on OAuth 2.0 that lets a relying party verify an end user's authentication and obtain interoperable identity claims.
tags:
  - openid-connect
  - authentication
  - identity
problem: OAuth access tokens authorize resource access but do not by themselves define an interoperable end-user authentication result for a client.
context: Clients need federated authentication through an OpenID Provider and can validate issuer, audience, nonce, signatures, and protocol state.
intent: Provide standardized authentication assertions and identity claims without redefining OAuth resource authorization.
forces:
  - Authentication and authorization have different semantics.
  - ID Tokens require strict validation.
  - Claims can be stale or sensitive.
  - Federation expands trust.
  - Logout and session behavior vary.
applicable_when:
  - statement: Use when a client needs interoperable federated end-user authentication and an appropriate OpenID Provider is trusted.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not use ID Tokens as generic API access tokens or assume an authenticated identity is authorized for a protected action.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: The relying party must validate the complete OpenID Connect response in the configured issuer and client context.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: The configured OpenID Provider metadata, keys, issuer, client identity, and redirect endpoints are trustworthy and current.
    scope: edge-local
    concept_ids: []
benefits:
  - Standardized federated authentication.
  - Signed identity assertions.
  - Interoperable discovery and claims.
tradeoffs:
  - Provider dependency.
  - Complex validation rules.
  - Privacy and claim-minimization burden.
risks:
  - statement: Skipping issuer, audience, nonce, or signature validation enables substitution and replay.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000023
security_implications:
  - statement: Public OAuth clients using the authorization code grant MUST use PKCE.
    kind: normative-control
    claim_ids: [AKL-000050]
    scope: edge-local
    concept_ids: []
  - statement: Confidential clients making token endpoint requests MUST authenticate using the method established with the authorization server and any stricter selected profile requirements.
    kind: normative-control
    claim_ids: [AKL-000051]
    scope: edge-local
    concept_ids: []
  - statement: Authorization servers MUST compare redirect URIs using exact string matching, except that native-application localhost loopback redirect URIs may vary only by port as specified by RFC 9700.
    kind: normative-control
    claim_ids: [AKL-000052]
    scope: edge-local
    concept_ids: []
  - statement: OAuth deployments SHOULD NOT use the implicit grant or other response types that issue access tokens in the authorization response unless access-token injection is prevented and the relevant leakage vectors are mitigated.
    kind: normative-control
    claim_ids: [AKL-000054]
    scope: edge-local
    concept_ids: []
  - statement: OAuth access tokens are authorization credentials for protected-resource access, and OAuth does not require every access token to use JWT format.
    kind: implementation-observation
    claim_ids: [AKL-000059]
    scope: edge-local
    concept_ids: []
  - statement: An OpenID Connect ID Token is a JWT authentication assertion about an end-user authentication event for its intended relying party.
    kind: implementation-observation
    claim_ids: [AKL-000060]
    scope: edge-local
    concept_ids: []
  - statement: OpenID Connect relying parties MUST validate the ID Token issuer, audience, applicable authorized-party value, signature, time constraints, and nonce when a nonce was sent.
    kind: normative-control
    claim_ids: [AKL-000061]
    scope: edge-local
    concept_ids: []
  - statement: Clients MUST NOT use an OpenID Connect ID Token as a generic API access credential when the API expects an OAuth access token issued for that API audience.
    kind: normative-control
    claim_ids: [AKL-000062]
    scope: edge-local
    concept_ids: []
operational_implications:
  - Monitor provider availability, key rotation, metadata changes, clock skew, login failures, and emergency trust revocation.
data_implications:
  - Collect minimal identity claims, define freshness and authoritative source, and avoid durable storage of unnecessary personal data.
alternatives:
  - statement: Local authentication or other federation protocols can be appropriate when ecosystem, trust, or deployment constraints differ.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000017
relationships:
  - AKR-000013
  - AKR-000014
  - AKR-000023
examples:
  - statement: A web client validates an ID Token from its configured provider and then applies its own application authorization rules.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Sending an ID Token to an unrelated API as a bearer credential, accepting an access token as a universal identity assertion, or assuming every OAuth access token is a JWT violates the token-role and format boundaries.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000018
  - AKL-000033
  - AKL-000034
  - AKL-000047
  - AKL-000050
  - AKL-000051
  - AKL-000052
  - AKL-000054
  - AKL-000059
  - AKL-000060
  - AKL-000061
  - AKL-000062
sources:
  - AKS-000017
  - AKS-000018
  - AKS-000019
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 4
contextual_roles: []
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

The relying party sends an authentication request through OAuth 2.0 mechanisms, the OpenID Provider authenticates the end user, and the client validates the authorization response, code exchange, ID Token, and related protocol state before creating a local session.

## Structural View

End-User, Relying Party, OpenID Provider, authorization endpoint, token endpoint, user agent, ID Token, access token, and optional UserInfo endpoint have distinct roles. An ID Token is a JWT authentication assertion for the client; an OAuth access token is an authorization credential whose format is not universally JWT.

## Runtime View

The client correlates state and nonce and applies current OAuth flow requirements directly: public authorization-code clients use PKCE, confidential token-endpoint clients authenticate, redirect matching preserves the native loopback-port exception, and implicit-style access-token responses retain their BCP qualification. It then validates issuer, audience, applicable authorized-party context, signature, time, nonce when sent, and applicable hash bindings before establishing local session and authorization policy separately.

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

Threat assumptions include token substitution, replay, malicious or confused clients, issuer or audience confusion, and compromised browser state. OIDC flow security is bound directly to the admitted OAuth sources and claims: public authorization-code clients must use PKCE, confidential token-endpoint clients authenticate, redirect matching preserves the native localhost loopback-port exception, and implicit-style access-token responses retain their qualified SHOULD NOT guidance. ID Tokens are JWT authentication assertions for their relying party and require issuer, audience, applicable authorized-party, signature, time, and nonce validation. They must not be substituted for an OAuth access token when an API expects a token issued for that audience. OAuth access-token format remains profile-specific rather than universally JWT.

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

Test issuer mix-up, audience and authorized-party confusion, nonce and code replay, PKCE handling, token substitution, ID Token signature and time validation, key rotation, claim absence, session expiry, access-token misuse, and provider outage.

## Examples

A web client validates an ID Token from its configured provider and then applies its own application authorization rules.

## Counterexamples

Sending an ID Token to an unrelated API as a bearer credential, accepting an access token as a universal identity assertion, or assuming every OAuth access token is a JWT violates the token-role and format boundaries.

## Related Concepts

OAuth 2.0 supplies authorization mechanisms, while OpenID Connect adds an authentication result and ID Token validation contract.

## Claims and Evidence

AKL-000050, AKL-000051, AKL-000052, and AKL-000054 bind the OAuth flow controls used by OIDC directly to this unit. AKL-000059 through AKL-000062 distinguish access-token format, ID Token role, ID Token validation, and the API credential boundary. AKL-000018, AKL-000033, and AKL-000034 preserve the identity-layer and protocol-dependency model; AKL-000047 remains proposed and is not used to support a sourced security implication.

## Sources

AKS-000019 is OpenID Connect Core and governs ID Token semantics and relying-party validation. AKS-000017 governs OAuth access-token role and confidential-client behavior. AKS-000018 directly governs the OAuth security controls used by OIDC flows. Each source is declared by this unit rather than inherited through adjacency.
