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
  - statement: Skipping an applicable issuer, audience, nonce, expiration, or signature control enables substitution and replay.
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
  - statement: Confidential clients making token endpoint requests MUST authenticate using the method established with the authorization server. Selected profiles may impose stricter authentication requirements.
    kind: normative-control
    claim_ids: [AKL-000051]
    scope: edge-local
    concept_ids: []
  - statement: Authorization servers MUST compare redirect URIs using exact string matching, except that native-application localhost loopback redirect URIs may vary only by port as specified by RFC 9700.
    kind: normative-control
    claim_ids: [AKL-000052]
    scope: edge-local
    concept_ids: []
  - statement: OAuth clients SHOULD NOT use the implicit grant or other response types that issue access tokens in the authorization response unless access-token injection is prevented and the relevant leakage vectors are mitigated.
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
  - statement: OpenID Connect clients MUST require the configured OpenID Provider issuer identifier to exactly match the ID Token iss claim.
    kind: normative-control
    claim_ids: [AKL-000061]
    scope: edge-local
    concept_ids: []
  - statement: OpenID Connect clients MUST validate that the ID Token audience contains their registered client identifier and reject the token if the client is not a valid audience or any additional audience is untrusted.
    kind: normative-control
    claim_ids: [AKL-000064]
    scope: edge-local
    concept_ids: []
  - statement: When an extension makes the azp claim applicable, OpenID Connect clients SHOULD validate the azp value as specified by that extension.
    kind: normative-control
    claim_ids: [AKL-000065]
    scope: edge-local
    concept_ids: []
  - statement: When an ID Token is not received by direct communication from the Token Endpoint, OpenID Connect clients MUST validate its signature using the issuer's keys and the token's declared algorithm.
    kind: normative-control
    claim_ids: [AKL-000066]
    scope: edge-local
    concept_ids: []
  - statement: When an ID Token is received by direct communication from the Token Endpoint, OpenID Connect clients MAY use TLS server validation to validate the issuer in place of checking that token's signature.
    kind: normative-control
    claim_ids: [AKL-000067]
    scope: edge-local
    concept_ids: []
  - statement: OpenID Connect clients MUST require the current time to be before the time represented by the ID Token exp claim.
    kind: normative-control
    claim_ids: [AKL-000068]
    scope: edge-local
    concept_ids: []
  - statement: When a nonce was sent in the Authentication Request, OpenID Connect clients MUST require a nonce claim in the ID Token and validate that its value equals the sent nonce.
    kind: normative-control
    claim_ids: [AKL-000069]
    scope: edge-local
    concept_ids: []
  - statement: Repository guidance recommends that clients not substitute an OpenID Connect ID Token when an API contract requires an audience-bound OAuth access token.
    kind: operational-recommendation
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
  - AKL-000064
  - AKL-000065
  - AKL-000066
  - AKL-000067
  - AKL-000068
  - AKL-000069
sources:
  - AKS-000017
  - AKS-000018
  - AKS-000019
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-08-01
  reviewed_at: null
  review_due_at: null
version: 5
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

The client correlates state and nonce and applies current OAuth flow requirements directly: public authorization-code clients use PKCE, confidential token-endpoint clients authenticate, redirect matching preserves the native loopback-port exception, and implicit-style access-token responses retain their BCP qualification. It then validates the exact issuer and intended audience. Authorized-party validation remains a conditional SHOULD when an extension makes azp applicable. Signature validation is mandatory outside direct Token Endpoint communication; for a directly received ID Token, TLS server validation may validate the issuer instead. Expiration is mandatory, and nonce presence and equality are mandatory only when a nonce was sent. Local session and authorization policy remain separate.

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

Skipping an applicable issuer, audience, nonce, expiration, or signature control enables substitution and replay. The direct Token Endpoint signature alternative is flow-specific. Conflating ID and access tokens produces trust-boundary errors.

## Security Implications

Threat assumptions include token substitution, replay, malicious or confused clients, issuer or audience confusion, and compromised browser state. OIDC flow security is bound directly to admitted OAuth claims with explicit cross-concept applicability: public authorization-code clients must use PKCE, confidential token-endpoint clients authenticate, redirect matching preserves the native localhost loopback-port exception, and OAuth clients retain the qualified SHOULD NOT for implicit-style access-token responses. ID Token issuer and audience checks are mandatory. Authorized-party validation is a conditional SHOULD. Signature validation is mandatory outside direct Token Endpoint communication, where TLS server validation may instead validate the issuer. Expiration is mandatory, while nonce presence and equality are mandatory only when a nonce was sent. Repository guidance recommends preserving the access-token/ID-Token role boundary when an API contract requires an audience-bound OAuth access token; this is not presented as protocol-level MUST NOT language.

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

AKL-000050, AKL-000051, AKL-000052, AKL-000054, and AKL-000059 explicitly declare cross-concept applicability to this OIDC unit. AKL-000060 records the ID Token role. AKL-000061 and AKL-000064 through AKL-000069 separately preserve issuer, audience, conditional authorized-party, flow-qualified signature, direct Token Endpoint TLS alternative, expiration, and conditional nonce semantics. AKL-000062 is repository-authored operational guidance derived from the sourced token-role boundary, not a protocol MUST NOT. AKL-000018, AKL-000033, and AKL-000034 preserve the identity-layer and protocol-dependency model; AKL-000047 remains proposed and is not used to support a sourced security implication.

## Sources

AKS-000019 is OpenID Connect Core and governs ID Token semantics and relying-party validation. AKS-000017 governs OAuth access-token role and confidential-client behavior. AKS-000018 directly governs the OAuth security controls used by OIDC flows. Each source is declared by this unit rather than inherited through adjacency.
